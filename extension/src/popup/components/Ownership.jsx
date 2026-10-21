import React, { useEffect, useState } from 'react';
import { saveOwnership, validateExpense } from '../../utils/ownership.js';

export default function Ownership({ vehicleId }) {
  const [record, setRecord] = useState({ expenses: [], nextService: '' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    chrome.storage.local.get('ag_ownership').then(data => { if (active) setRecord(data.ag_ownership?.[vehicleId] || { expenses: [], nextService: '' }); }).catch(() => { if (active) setStatus('Podatkov ni mogoče naložiti.'); });
    return () => { active = false; };
  }, [vehicleId]);
  async function submit(event) {
    event.preventDefault(); const form = event.currentTarget;
    setBusy(true);
    try {
      const expense = validateExpense(Object.fromEntries(new FormData(form)));
      setRecord(await saveOwnership(vehicleId, current => ({ ...current, expenses: [...current.expenses, expense] })));
      form.reset(); setStatus('Strošek je shranjen.');
    } catch (error) { setStatus(error.message || 'Shranjevanje ni uspelo.'); }
    finally { setBusy(false); }
  }
  async function service(event) {
    const value = event.target.value;
    try { setRecord(await saveOwnership(vehicleId, current => ({ ...current, nextService: value }))); setStatus('Servisni opomnik je shranjen v garaži.'); }
    catch { setStatus('Opomnika ni mogoče shraniti.'); }
  }
  const due = record.nextService && record.nextService <= new Date().toLocaleDateString('sv-SE');
  return <section className="ownership-section">
    <h3>Lastništvo in servis</h3>
    <p>Vaši ročni zapisi. Opomnik je prikazan v garaži; brez potisnih obvestil.</p>
    <label>Naslednji servis <input type="date" aria-label="Naslednji servis" value={record.nextService} onChange={service} /></label>
    {due && <p className="text-warning" role="status">Čas je za servis: {record.nextService}</p>}
    <strong>Skupni stroški: {record.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString('sl-SI', { style:'currency', currency:'EUR' })}</strong>
    <form onSubmit={submit} className="expense-form">
      <label>Opis <input name="note" required maxLength="160" placeholder="Servis, gorivo, zavarovanje…" /></label>
      <label>Znesek (€) <input name="amount" type="number" min="0.01" max="10000000" step="0.01" required /></label>
      <label>Datum <input name="date" type="date" required defaultValue={new Date().toLocaleDateString('sv-SE')} /></label>
      <button className="btn-primary" disabled={busy}>Dodaj strošek</button>
    </form>
    <div className="expense-history">{record.expenses.length ? record.expenses.slice().reverse().map((e, i) => <div key={i}><span>{e.date} · {e.note}</span><strong>{e.amount.toLocaleString('sl-SI')} €</strong></div>) : <p>Dodajte prvi strošek ali servisni zapis.</p>}</div>
    <p role="status">{status}</p>
  </section>;
}
