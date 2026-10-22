import React, { useState } from 'react';
import { updateVehicleStatus } from '../../utils/storage.js';
const tasks = ['Preverjena servisna zgodovina', 'Opravljen ogled in testna vožnja', 'Preverjeni dokumenti in lastništvo', 'Dogovorjen neodvisen pregled'];
export default function DecisionNotes({
  vehicle
}) {
  const [notes, setNotes] = useState(vehicle.buyerNotes || '');
  const [checked, setChecked] = useState(vehicle.buyerChecklist || []);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  async function save(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await updateVehicleStatus(vehicle.id, {
        buyerNotes: notes.slice(0, 3000),
        buyerChecklist: checked
      });
      setStatus('Zapiski in kontrolni seznam so shranjeni.');
    } catch {
      setStatus('Shranjevanje ni uspelo. Vaš vnos ostaja tukaj.');
    } finally {
      setBusy(false);
    }
  }
  return <form className="decision-notes" onSubmit={save}><h3>Preden se odločite</h3><p>Vaše ugotovitve in vprašanja za prodajalca. Seznam ni jamstvo za stanje vozila.</p><label>Zapiski za nakup<textarea maxLength={3000} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kaj mi je všeč? Kaj moram še preveriti?" /></label>{tasks.map((task, i) => <label key={task}><input type="checkbox" checked={checked.includes(i)} onChange={e => setChecked(e.target.checked ? [...checked, i] : checked.filter(x => x !== i))} />{task}</label>)}<button className="btn-primary" disabled={busy}>Shrani zapiske</button><p role="status">{status}</p></form>;
}
