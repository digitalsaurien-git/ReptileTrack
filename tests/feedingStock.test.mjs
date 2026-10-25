import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileFeedingStock } from '../src/utils/feedingStock.js';
import { createCareEvent, getFeedingSchedule } from '../src/utils/feedingSchedule.js';

const foods = [{ id: 'mouse', name: 'Souris', stock: 10 }, { id: 'rat', name: 'Rat', stock: 5 }];
const refusal = { type: 'refus_repas', foodId: 'mouse', quantity: 2, date: '2026-10-25' };

test('a refused thawed prey leaves stock and preserves the refusal and date', () => {
  const result = reconcileFeedingStock(foods, refusal);
  assert.equal(result.foods[0].stock, 8);
  assert.equal(result.foods[1].stock, 5);
  assert.equal(result.event.type, 'refus_repas');
  assert.equal(result.event.date, refusal.date);
  assert.equal(result.event.foodName, 'Souris');
  assert.equal(result.event.stockDeducted, true);
  assert.equal(foods[0].stock, 10);
});

for (const sex of ['male', 'femelle', '', 'indetermine']) {
  for (const frequency of [7, 14]) {
    test(`quick refusal for ${sex || 'unknown sex'} removes default prey and postpones ${frequency} days`, () => {
      const animal = { sex, feedingFrequency: frequency, defaultFoodId: 'mouse', defaultFoodQuantity: 1 };
      const result = reconcileFeedingStock(foods, {
        ...createCareEvent(animal, 'refus_repas', '2026-10-25'),
        foodId: animal.defaultFoodId, quantity: animal.defaultFoodQuantity
      });
      const schedule = getFeedingSchedule({ ...animal, history: [result.event] }, '2026-10-25');
      assert.equal(result.foods[0].stock, 9);
      assert.equal(schedule.lastMeal, undefined);
      assert.equal(schedule.lastRefusal.date, '2026-10-25');
      assert.equal(schedule.nextDate, frequency === 7 ? '2026-11-01' : '2026-11-08');
      assert.equal(schedule.due, false);
    });
  }
}

test('editing notes/date or switching refused to eaten does not deduct twice', () => {
  const created = reconcileFeedingStock(foods, refusal);
  for (const changes of [{ notes: 'corrigé' }, { date: '2026-10-24' }, { type: 'repas' }]) {
    const edited = reconcileFeedingStock(created.foods, { ...created.event, ...changes }, created.event);
    assert.equal(edited.foods[0].stock, 8);
  }
});

test('correction of quantity or prey reconciles the difference', () => {
  const created = reconcileFeedingStock(foods, refusal);
  const reduced = reconcileFeedingStock(created.foods, { ...created.event, quantity: 1 }, created.event);
  assert.equal(reduced.foods[0].stock, 9);
  const changed = reconcileFeedingStock(created.foods, { ...created.event, foodId: 'rat', quantity: 3 }, created.event);
  assert.equal(changed.foods[0].stock, 10);
  assert.equal(changed.foods[1].stock, 2);
});

test('cancelling a new refusal restores its deduction; an old refusal restores nothing', () => {
  const created = reconcileFeedingStock(foods, refusal);
  assert.deepEqual(reconcileFeedingStock(created.foods, null, created.event).foods, foods);
  assert.deepEqual(reconcileFeedingStock(foods, null, refusal).foods, foods);
});

test('legacy eaten meals still restore stock and transition to refusals without a second deduction', () => {
  const meal = { ...refusal, type: 'repas' };
  assert.equal(reconcileFeedingStock(foods, null, meal).foods[0].stock, 12);
  assert.equal(reconcileFeedingStock(foods, { ...meal, type: 'refus_repas' }, meal).foods[0].stock, 10);
});

test('old refusal is deducted only when explicitly corrected, without retroactive stock changes', () => {
  assert.equal(reconcileFeedingStock(foods, refusal, refusal).foods[0].stock, 8);
});

test('unrelated care does not change stock and replacing a deduction restores it', () => {
  assert.deepEqual(reconcileFeedingStock(foods, { type: 'mue' }).foods, foods);
  const created = reconcileFeedingStock(foods, refusal);
  assert.deepEqual(reconcileFeedingStock(created.foods, { type: 'mue' }, created.event).foods, foods);
});

test('a refusal requires a valid prey and positive whole quantity before any mutation', () => {
  for (const event of [{ ...refusal, foodId: '' }, { ...refusal, foodId: 'missing' }, ...[0, -1, 1.5, 'bad'].map(quantity => ({ ...refusal, quantity }))]) {
    assert.throws(() => reconcileFeedingStock(foods, event));
    assert.equal(foods[0].stock, 10);
  }
});

test('string quantities and stock values are normalized for imported data', () => {
  const created = reconcileFeedingStock([{ ...foods[0], stock: '10' }], { ...refusal, quantity: '2' });
  assert.equal(created.foods[0].stock, 8);
  assert.equal(created.event.quantity, 2);
  assert.equal(reconcileFeedingStock(created.foods, null, created.event).foods[0].stock, 10);
});
