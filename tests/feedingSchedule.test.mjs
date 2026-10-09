import test from 'node:test';
import assert from 'node:assert/strict';
import { getFeedingSchedule, feedingLabels, createCareEvent, addDays, localDateKey } from '../src/utils/feedingSchedule.js';

const event = (type, date) => ({ type, date });
const animal = (history = [], frequency = 7) => ({ sex: 'femelle', feedingFrequency: frequency, history });

test('sex-specific labels and neutral labels for an unknown sex', () => {
  assert.equal(feedingLabels({ sex: 'male' }).fed, 'Il a mangé !');
  assert.equal(feedingLabels({ sex: 'femelle' }).fed, 'Elle a mangé !');
  assert.equal(feedingLabels({ sex: 'femelle' }).refused, 'Elle n’a pas mangé');
  assert.equal(feedingLabels({}).refused, 'Repas refusé');
});

test('refusal resets the reminder by the configured interval but preserves the last eaten meal', () => {
  for (const frequency of [7, 14]) {
    const a = animal([event('refus_repas', '2026-10-09'), event('repas', '2026-09-01')], frequency);
    const dueDate = addDays('2026-10-09', frequency);
    const schedule = getFeedingSchedule(a, '2026-10-09');
    assert.equal(schedule.nextDate, dueDate);
    assert.equal(schedule.lastMeal.date, '2026-09-01');
    assert.equal(schedule.due, false);
    assert.equal(getFeedingSchedule(a, dueDate).due, true);
  }
});

test('observing a shed sets exactly 14 days even with a longer normal interval', () => {
  const a = animal([event('debut_mue', '2026-10-09'), event('repas', '2026-10-08')], 30);
  assert.equal(getFeedingSchedule(a, '2026-10-09').nextDate, '2026-10-23');
  assert.equal(getFeedingSchedule(a, '2026-10-22').inShed, true);
  assert.equal(getFeedingSchedule(a, '2026-10-23').inShed, false);
  assert.equal(getFeedingSchedule(a, '2026-10-23').due, true);
});

test('a completed legacy shed does not start a pause', () => {
  assert.equal(getFeedingSchedule(animal([event('mue', '2026-10-09')]), '2026-10-09').due, true);
});

test('winter blocks reminders for 90 days and resumes at the boundary', () => {
  const a = animal([event('debut_hivernage', '2026-11-01'), event('repas', '2026-10-01')]);
  assert.equal(getFeedingSchedule(a, '2027-01-29').due, false);
  assert.equal(getFeedingSchedule(a, '2027-01-29').inWinter, true);
  assert.equal(getFeedingSchedule(a, '2027-01-30').due, true);
  assert.equal(getFeedingSchedule(a, '2027-01-30').inWinter, false);
  assert.equal(getFeedingSchedule({ ...a, feedingFrequency: 365 }, '2026-11-01').nextDate, '2027-01-30');
});

test('early winter end cancels the 90-day pause, including same-day changes', () => {
  const a = animal([event('fin_hivernage', '2026-11-15'), event('debut_hivernage', '2026-11-01')]);
  assert.equal(getFeedingSchedule(a, '2026-11-15').due, true);
  const sameDay = animal([event('fin_hivernage', '2026-11-01'), event('debut_hivernage', '2026-11-01')]);
  assert.equal(getFeedingSchedule(sameDay, '2026-11-01').inWinter, false);
  assert.equal(getFeedingSchedule(sameDay, '2026-11-01').due, true);
});

test('overlapping shed/winter pauses and restarted winter keep reminders suspended', () => {
  const a = animal([event('debut_mue', '2026-11-10'), event('debut_hivernage', '2026-11-01')]);
  assert.equal(getFeedingSchedule(a, '2026-11-10').nextDate, '2027-01-30');
  a.history.unshift(event('fin_hivernage', '2026-11-12'));
  assert.equal(getFeedingSchedule(a, '2026-11-12').nextDate, '2026-11-24');
  assert.equal(getFeedingSchedule(a, '2026-11-12').due, false);
  a.history.unshift(event('debut_hivernage', '2026-11-12'));
  assert.equal(getFeedingSchedule(a, '2026-11-12').inWinter, true);
});

test('history order, backdated entries, future events and deletion are handled consistently', () => {
  const a = animal([event('refus_repas', '2026-09-01'), event('repas', '2026-10-08'), event('debut_hivernage', '2026-12-01')]);
  assert.equal(getFeedingSchedule(a, '2026-10-09').nextDate, '2026-10-15');
  assert.equal(getFeedingSchedule(a, '2026-10-09').inWinter, false);
  a.history.unshift(event('debut_mue', '2026-10-09'));
  assert.equal(getFeedingSchedule(a, '2026-10-09').nextDate, '2026-10-23');
  a.history.shift();
  assert.equal(getFeedingSchedule(a, '2026-10-09').nextDate, '2026-10-15');
});

test('states survive JSON backups/cloud history serialization and are not counted as meals', () => {
  const a = animal();
  for (const type of ['refus_repas', 'debut_mue', 'debut_hivernage', 'fin_hivernage']) {
    const entry = createCareEvent(a, type, '2026-10-09');
    assert.ok(entry.id);
    assert.ok(entry.notes);
    assert.notEqual(entry.type, 'repas');
    assert.equal(entry.foodId, undefined);
    assert.equal(entry.quantity, undefined);
  }
  a.history = [createCareEvent(a, 'debut_hivernage', '2026-10-09')];
  assert.deepEqual(getFeedingSchedule(JSON.parse(JSON.stringify(a)), '2026-10-09'), getFeedingSchedule(a, '2026-10-09'));
});

test('invalid frequencies and inactive animals do not produce reminders', () => {
  for (const frequency of ['', undefined, -1, 'invalid', 0]) {
    assert.equal(getFeedingSchedule({ history: [], feedingFrequency: frequency }, '2026-10-09').due, false);
  }
  assert.equal(getFeedingSchedule({ ...animal(), status: 'decede' }, '2026-10-09').due, false);
  assert.equal(getFeedingSchedule(animal(), '2026-10-09').due, true);
});

test('calendar dates cross DST/month/year/leap boundaries without drifting', () => {
  assert.equal(addDays('2026-10-24', 14), '2026-11-07');
  assert.equal(addDays('2026-12-31', 7), '2027-01-07');
  assert.equal(addDays('2028-02-28', 1), '2028-02-29');
  const date = new Date(2026, 9, 9, 0, 15);
  assert.equal(localDateKey(date), '2026-10-09');
});
