// Care states live in history so local backups and Cloud sync preserve them.
export const CARE_EVENT_LABELS = {
  refus_repas: 'Repas refusé',
  debut_mue: 'Début de mue',
  debut_hivernage: 'Début d’hivernage',
  fin_hivernage: 'Fin d’hivernage'
};

export function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function addDays(key, days) {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatCareDate(key) {
  return new Date(`${key}T12:00:00`).toLocaleDateString('fr-FR');
}

export function feedingLabels(animal) {
  const pronoun = animal.sex === 'femelle' ? 'Elle' : animal.sex === 'male' ? 'Il' : null;
  return {
    fed: pronoun ? `${pronoun} a mangé !` : 'Repas pris',
    refused: pronoun ? `${pronoun} n’a pas mangé` : 'Repas refusé'
  };
}

export function getFeedingSchedule(animal, today = localDateKey()) {
  // New entries are prepended: preserve that order for same-day state changes.
  const history = (animal.history || [])
    .filter(event => /^\d{4}-\d{2}-\d{2}/.test(event.date || '') && event.date.slice(0, 10) <= today)
    .slice().sort((a, b) => b.date.slice(0, 10).localeCompare(a.date.slice(0, 10)));
  const dayOf = event => event?.date.slice(0, 10);
  const frequency = Number(animal.feedingFrequency);
  const configured = Number.isInteger(frequency) && frequency > 0;
  const lastMeal = history.find(event => event.type === 'repas');
  const lastSchedulingEvent = history.find(event => ['repas', 'refus_repas', 'debut_mue', 'debut_hivernage', 'fin_hivernage'].includes(event.type));
  let nextDate = null;
  if (lastSchedulingEvent?.type === 'debut_mue') nextDate = addDays(dayOf(lastSchedulingEvent), 14);
  else if (lastSchedulingEvent?.type === 'debut_hivernage') nextDate = addDays(dayOf(lastSchedulingEvent), 90);
  else if (lastSchedulingEvent?.type === 'fin_hivernage') nextDate = dayOf(lastSchedulingEvent);
  else if (configured && lastSchedulingEvent) nextDate = addDays(dayOf(lastSchedulingEvent), frequency);
  const postpone = date => { if (!nextDate || date > nextDate) nextDate = date; };

  const shed = history.find(event => event.type === 'debut_mue');
  const shedUntil = shed ? addDays(dayOf(shed), 14) : null;
  if (shedUntil && today < shedUntil) postpone(shedUntil);

  const winter = history.find(event => event.type === 'debut_hivernage' || event.type === 'fin_hivernage');
  const winterUntil = winter?.type === 'debut_hivernage' ? addDays(dayOf(winter), 90) : null;
  if (winterUntil) postpone(winterUntil);
  // An early end cancels this winter pause; other delays still apply.
  if (winter?.type === 'fin_hivernage') postpone(dayOf(winter));

  const inShed = !!shedUntil && today < shedUntil;
  const inWinter = !!winterUntil && today < winterUntil;
  const active = !animal.status || animal.status === 'vivant' || animal.status === 'malade';
  return {
    configured, lastMeal, nextDate, inShed, inWinter, shedUntil, winterUntil,
    due: active && configured && !inShed && !inWinter && (!nextDate || today >= nextDate)
  };
}

export function createCareEvent(animal, type, date = localDateKey()) {
  const days = type === 'debut_mue' ? 14 : type === 'debut_hivernage' ? 90 : Number(animal.feedingFrequency);
  const nextDate = type === 'fin_hivernage' ? date : addDays(date, days);
  const notes = type === 'refus_repas'
    ? `${feedingLabels(animal).refused}. Prochain repas proposé le ${formatCareDate(nextDate)} (${days} jours).`
    : type === 'fin_hivernage'
      ? 'Hivernage terminé. Reprise des relances de repas.'
      : `${CARE_EVENT_LABELS[type]}. Relances de repas suspendues jusqu’au ${formatCareDate(nextDate)} (${days} jours).`;
  return { id: crypto.randomUUID(), type, date, notes };
}
