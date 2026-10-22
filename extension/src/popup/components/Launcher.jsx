import React, { useEffect, useState } from 'react';
import { getVehicles } from '../../utils/storage.js';
export default function Launcher() {
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState('Nalagam vašo garažo…');
  useEffect(() => {
    getVehicles().then(v => {
      setVehicles(v);
      setStatus('Podatki so shranjeni samo v tem brskalniku.');
    }).catch(() => setStatus('Garaže ni mogoče naložiti. Poskusite znova.'));
  }, []);
  return <main className="launcher">
    <header><span className="launcher-brand">AvtoNetGaraža</span><span className="local-label">Lokalno</span></header>
    <h1>Naslednji avto.<br />Premišljena odločitev.</h1>
    <p>Vaš ožji izbor, primerjave in zapiski na enem mestu.</p>
    <button className="btn-primary launcher-open" onClick={() => chrome.tabs.create({
      url: chrome.runtime.getURL('popup.html?workspace=1')
    })}>Odpri mojo garažo <span>{vehicles.length}</span></button>
    <section><h2>Kako shranim vozilo?</h2><ol><li>Odprite oglas na avto.net.</li><li>Izberite »Shrani v garažo« ob oglasu.</li><li>V garaži primerjajte vozila in dodajte zapiske.</li></ol></section>
    <button className="btn-secondary" onClick={() => chrome.tabs.create({
      url: 'https://www.avto.net/'
    })}>Poišči vozilo na avto.net</button>
    <p className="launcher-status" role="status">{status}</p>
  </main>;
}
