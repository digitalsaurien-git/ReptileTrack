const feedingTypes = ['repas', 'refus_repas'];

function stockUsage(event) {
  // Older refusals did not remove prey, even when food fields were present.
  const deducted = event?.stockDeducted ?? (event?.type === 'repas');
  if (!deducted || !feedingTypes.includes(event?.type) || !event.foodId) return null;
  const quantity = Number(event.quantity);
  return Number.isInteger(quantity) && quantity > 0 ? { foodId: event.foodId, quantity } : null;
}

// Reconcile a creation, correction or deletion without double-counting stock.
export function reconcileFeedingStock(foods, event, previousEvent = null) {
  const nextEvent = event ? { ...event, stockDeducted: false } : null;
  if (nextEvent && feedingTypes.includes(nextEvent.type) && nextEvent.foodId) {
    const food = foods.find(item => item.id === nextEvent.foodId);
    const quantity = Number(nextEvent.quantity);
    if (!food) throw new Error('La proie sélectionnée n’existe plus dans le stock.');
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Indiquez une quantité entière de proies supérieure à zéro.');
    Object.assign(nextEvent, { foodName: food.name, quantity, stockDeducted: true });
  } else if (nextEvent?.type === 'refus_repas') {
    throw new Error('Sélectionnez la proie décongelée à retirer du stock.');
  }

  const before = stockUsage(previousEvent);
  const after = stockUsage(nextEvent);
  const updatedFoods = foods.map(food => {
    const restored = before?.foodId === food.id ? before.quantity : 0;
    const removed = after?.foodId === food.id ? after.quantity : 0;
    if (restored === removed) return food;
    return { ...food, stock: Number(food.stock) + restored - removed };
  });
  return { event: nextEvent, foods: updatedFoods };
}
