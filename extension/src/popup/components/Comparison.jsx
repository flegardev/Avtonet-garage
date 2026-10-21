import React, { useState } from 'react';

export default function Comparison({ vehicles }) {
  const [ids, setIds] = useState([]);
  const selected = vehicles.filter(v => ids.includes(v.id));
  if (vehicles.length < 2) return null;
  const rows = [ ['Cena', v => v.price || '—'], ['Letnik', v => v.specs?.year || '—'], ['Kilometri', v => v.specs?.mileage || v.mileage || '—'], ['Gorivo', v => v.specs?.fuel || '—'], ['Status', v => ({ active:'Aktivno',sold:'Prodano',removed:'Odstranjeno',price_change:'Cena spremenjena' })[v.status] || '—'] ];
  return <details className="comparison"><summary>Primerjaj vozila <span>Izberite do 3 shranjene oglase</span></summary>
    <div className="compare-choices">{vehicles.map(v => <label key={v.id}><input type="checkbox" checked={ids.includes(v.id)} disabled={!ids.includes(v.id) && ids.length >= 3} onChange={e => setIds(current => e.target.checked ? [...current, v.id] : current.filter(id => id !== v.id))} />{v.title}</label>)}</div>
    {selected.length >= 2 ? <div className="comparison-scroll"><table><caption>Podatki iz shranjenih oglasov</caption><thead><tr><th scope="col">Podatek</th>{selected.map(v => <th scope="col" key={v.id}>{v.title}</th>)}</tr></thead><tbody>{rows.map(([label, get]) => <tr key={label}><th scope="row">{label}</th>{selected.map(v => <td key={v.id}>{get(v)}</td>)}</tr>)}</tbody></table></div> : <p>Za primerjavo izberite vsaj dve vozili.</p>}
  </details>;
}
