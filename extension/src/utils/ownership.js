export function validateExpense(input) {
  const amount = Number(input.amount);
  const note = String(input.note || '').trim();
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) throw new Error('Vnesite veljaven znesek nad 0 €.');
  if (!note || note.length > 160) throw new Error('Vnesite opis (največ 160 znakov).');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || (!Number.isFinite(Date.parse(input.date)) || new Date(input.date).toISOString().slice(0,10) !== input.date)) throw new Error('Vnesite veljaven datum.');
  return { amount: Math.round(amount * 100) / 100, note, date: input.date };
}

export async function saveOwnership(vehicleId, transform) {
  const write = async () => {
    const { ag_ownership = {} } = await chrome.storage.local.get('ag_ownership');
    const next = transform(ag_ownership[vehicleId] || { expenses: [], nextService: '' });
    await chrome.storage.local.set({ ag_ownership: { ...ag_ownership, [vehicleId]: next } });
    return next;
  };
  return globalThis.navigator?.locks ? navigator.locks.request('ag-storage-write', write) : write();
}
