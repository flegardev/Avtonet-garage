const SECTION_DEFS = [
  { id: 'safety', title: 'Varnostna oprema' },
  { id: 'assistance', title: 'Asistenčni sistemi' },
  { id: 'lighting', title: 'Svetlobna oprema' },
  { id: 'comfort', title: 'Udobje in uporabnost' },
  { id: 'infotainment', title: 'Infotainment in povezljivost' },
  { id: 'exterior', title: 'Zunanjost in platišča' },
  { id: 'additional', title: 'Dodatna oprema' },
];

const FEATURE_RULES = [
  // Safety
  { section: 'safety', label: '6x zračna vreča / Airbag', patterns: [/\b6\s*x\s*zracn[ae]\s+vrec/, /\b6\s*x\s*airbag/] },
  { section: 'safety', label: 'ABS - zavorni sistem', patterns: [/\babs\b/] },
  { section: 'safety', label: 'BAS - pomoč pri zaviranju', patterns: [/\bbas\b/, /pomoc\s+pri\s+zaviranju/] },
  { section: 'safety', label: 'ESP - elektronski program stabilnosti', patterns: [/\besp\b/, /elektronski\s+program\s+stabilnosti/] },
  { section: 'safety', label: 'ASR - regulacija zdrsa pogonskih koles', patterns: [/\basr\b/, /regulacija\s+zdrsa/] },
  { section: 'safety', label: 'Samodejna zapora diferenciala (ASD / EDS)', patterns: [/\basd\b/, /\beds\b/, /zapora\s+diferenciala/] },
  { section: 'safety', label: 'Sistem za samodejno zaviranje v sili', patterns: [/samodejno\s+zaviranje\s+v\s+sili/, /zaviranje\s+v\s+sili/, /emergency\s+brak/] },
  { section: 'safety', label: 'Alarmna naprava', patterns: [/alarmna\s+naprava/, /\balarm\b/] },
  { section: 'safety', label: 'Blokada motorja', patterns: [/blokada\s+motorja/, /immobilizer/] },
  { section: 'safety', label: 'Kodno varovan vžig motorja', patterns: [/kodno\s+varovan\s+vzig/, /kodno\s+varovan/] },
  { section: 'safety', label: 'Nadzor zračnega tlaka v pnevmatikah', patterns: [/nadzor\s+zracnega\s+tlaka/, /tlaka\s+v\s+pnevmatikah/, /\btpms\b/] },

  // Assistance
  { section: 'assistance', label: 'Sistem za ohranjanje voznega pasu', patterns: [/ohranjanje\s+voznega\s+pasu/, /lane\s+keep/] },
  { section: 'assistance', label: 'Opozorilnik spremembe voznega pasu', patterns: [/opozorilnik\s+spremembe\s+voznega\s+pasu/, /lane\s+departure/] },
  { section: 'assistance', label: 'Opozorilnik varnostne razdalje', patterns: [/opozorilnik\s+varnostne\s+razdalje/, /varnostne\s+razdalje/, /distance\s+warning/] },
  { section: 'assistance', label: 'Sistem za prepoznavo prometnih znakov', patterns: [/prepoznav[ao]\s+prometnih\s+znakov/, /traffic\s+sign/] },
  { section: 'assistance', label: 'Samodejno upravljanje dolgih luči', patterns: [/samodejno\s+upravljanje\s+dolgih\s+luci/, /automatic\s+high\s+beam/] },
  { section: 'assistance', label: 'Senzor za dež', patterns: [/senzor\s+za\s+dez/, /rain\s+sensor/] },
  { section: 'assistance', label: 'Parkirni senzorji', patterns: [/parkirn[ai]\s+senzor/, /parking\s+sensor/] },
  { section: 'assistance', label: 'Kamera za vzvratno vožnjo', patterns: [/kamera\s+za\s+vzvratno/, /rear\s+view\s+camera/, /vzvratna\s+kamera/] },
  { section: 'assistance', label: 'Tempomat', patterns: [/\btempomat\b/, /cruise\s+control/] },
  { section: 'assistance', label: 'Aktivni tempomat', patterns: [/aktivni\s+tempomat/, /adaptive\s+cruise/] },

  // Lighting
  { section: 'lighting', label: 'LED žarometi', patterns: [/led\s+zaromet/, /led\s+headlight/] },
  { section: 'lighting', label: 'Prednje dnevne LED luči', patterns: [/prednje.*dnevne.*led\s+luci/, /dnevne.*led\s+luci/, /daytime.*led/] },
  { section: 'lighting', label: 'Zadnje LED luči', patterns: [/zadnje\s+led\s+luci/, /rear\s+led/] },
  { section: 'lighting', label: 'Meglenke', patterns: [/\bmeglenk/, /fog\s+light/] },
  { section: 'lighting', label: 'Tretja zavorna luč', patterns: [/tretja\s+zavorna\s+luc/] },
  { section: 'lighting', label: 'Ksenonski žarometi', patterns: [/ksenonsk[ai]\s+zaromet/, /xenon/] },

  // Comfort
  { section: 'comfort', label: 'Avtomatska klimatska naprava', patterns: [/avtomatsk[ao]\s+klim/, /automatic\s+climate/] },
  { section: 'comfort', label: 'Klimatska naprava', patterns: [/\bklimatska\s+naprava\b/, /\bklima\b/, /air\s+condition/] },
  { section: 'comfort', label: 'Ogrevani sedeži', patterns: [/ogrevan[ia]\s+sedez/, /heated\s+seat/] },
  { section: 'comfort', label: 'Električni pomik stekel', patterns: [/elektricn[ai]\s+pomik\s+stekel/, /electric\s+windows/] },
  { section: 'comfort', label: 'Električno nastavljivi sedeži', patterns: [/elektricno\s+nastavljiv[ai]\s+sedez/, /electric\s+seat/] },
  { section: 'comfort', label: 'Usnjeni sedeži', patterns: [/usnjen[ai]\s+sedez/, /leather\s+seat/] },
  { section: 'comfort', label: 'ISOFIX', patterns: [/\bisofix\b/] },

  // Infotainment
  { section: 'infotainment', label: 'Navigacijski sistem', patterns: [/navigacijsk[ai]\s+sistem/, /\bnavigacija\b/, /\bnav\b/] },
  { section: 'infotainment', label: 'Bluetooth povezava', patterns: [/\bbluetooth\b/] },
  { section: 'infotainment', label: 'Apple CarPlay', patterns: [/apple\s+carplay/] },
  { section: 'infotainment', label: 'Android Auto', patterns: [/android\s+auto/] },
  { section: 'infotainment', label: 'USB priključek', patterns: [/\busb\b/] },

  // Exterior / wheels
  { section: 'exterior', label: 'ALU platišča - 17 col', patterns: [/alu\s+platisca\s*[:-]?\s*17\s*col/, /lahka\s*-\s*alu\s+platisca\s*[:-]?\s*17/] },
  { section: 'exterior', label: 'ALU platišča', patterns: [/alu\s+platisca/, /alloy\s+wheels/] },
  { section: 'exterior', label: 'Kovinska / metalik barva', patterns: [/metalik\s+barva/, /\bmetalik\b/, /metallic/] },
  { section: 'exterior', label: 'Strešne sani', patterns: [/stresne\s+sani/, /roof\s+rail/] },
  { section: 'exterior', label: 'Vlečna kljuka', patterns: [/vlecna\s+kljuka/, /tow\s+bar/] },
];

const SECTION_BY_ID = Object.fromEntries(SECTION_DEFS.map((section) => [section.id, section]));

export function cleanVehicleText(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\u00a0/g, ' ')
    .replace(/\u0435/g, 'e')
    .replace(/\s*([,;])\s*/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function toSearchText(value) {
  return cleanVehicleText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function isLikelyEquipmentBlob(value) {
  const text = cleanVehicleText(value);
  if (!text) return false;

  const search = toSearchText(text);
  const matches = FEATURE_RULES.reduce((count, rule) => {
    return count + (rule.patterns.some((pattern) => pattern.test(search)) ? 1 : 0);
  }, 0);

  return matches >= 3 || (matches >= 2 && text.length > 70);
}

export function buildDisplaySpecs(vehicle) {
  const specs = vehicle?.specs ?? {};
  const engineRaw = cleanVehicleText(specs.engine);
  const powerRaw = isLikelyEquipmentBlob(specs.power) ? '' : cleanVehicleText(specs.power);
  const bodyRaw = isLikelyEquipmentBlob(specs.bodyType) ? '' : cleanVehicleText(specs.bodyType);

  const powerFromEngine = extractPower(engineRaw);
  const volumeFromEngine = extractEngineVolume(engineRaw);

  return {
    year: normalizeYear(specs.year),
    mileage: normalizeMileage(vehicle?.mileage || specs.mileage),
    fuel: normalizeFuel(specs.fuel),
    engine: normalizeEngine(volumeFromEngine || engineRaw),
    power: normalizePower(powerRaw || powerFromEngine),
    transmission: capitalizeFirst(cleanVehicleText(specs.transmission)),
    color: capitalizeFirst(cleanVehicleText(specs.color)),
    bodyType: capitalizeFirst(bodyRaw),
    drive: normalizeDrive(specs.drive || inferDrive(vehicle)),
    doors: cleanVehicleText(specs.doors),
  };
}

export function buildSpecSections(vehicle) {
  const specs = buildDisplaySpecs(vehicle);

  return {
    basicRows: toRows([
      ['Letnik', specs.year],
      ['Prevoženo', specs.mileage],
      ['Gorivo', specs.fuel],
      ['Menjalnik', specs.transmission],
      ['Barva', specs.color],
      ['Karoserija', specs.bodyType],
    ]),
    engineRows: toRows([
      ['Moč', specs.power],
      ['Prostornina', specs.engine],
      ['Pogon', specs.drive],
      ['Menjalnik', specs.transmission],
    ]),
  };
}

export function buildEquipmentSections(vehicle) {
  const buckets = createBuckets();

  mergeExplicitSections(buckets, vehicle?.equipmentSections);
  mergeKnownFeatures(buckets, collectSourceText(vehicle));
  mergeLooseItems(buckets, vehicle?.equipment || vehicle?.equipmentItems);

  return SECTION_DEFS
    .map((section) => ({
      ...section,
      items: [...(buckets.get(section.id) ?? [])],
    }))
    .filter((section) => section.items.length > 0);
}

export function normalizeDescription(value) {
  const text = cleanVehicleText(value);
  if (!text) return '';
  return text.length > 900 ? `${text.slice(0, 897).trim()}...` : text;
}

function createBuckets() {
  return new Map(SECTION_DEFS.map((section) => [section.id, new Set()]));
}

function mergeKnownFeatures(buckets, sourceText) {
  const search = toSearchText(sourceText);
  if (!search) return;

  FEATURE_RULES.forEach((rule) => {
    if (rule.patterns.some((pattern) => pattern.test(search))) {
      buckets.get(rule.section)?.add(rule.label);
    }
  });
}

function mergeExplicitSections(buckets, sections) {
  if (!Array.isArray(sections)) return;

  sections.forEach((section) => {
    const id = SECTION_BY_ID[section?.id] ? section.id : 'additional';
    const items = Array.isArray(section?.items) ? section.items : [];
    items.forEach((item) => addLooseItem(buckets, id, item));
  });
}

function mergeLooseItems(buckets, items) {
  if (!Array.isArray(items)) return;
  items.forEach((item) => addLooseItem(buckets, 'additional', item));
}

function addLooseItem(buckets, sectionId, item) {
  const label = cleanVehicleText(item);
  if (!label || label.length > 90) return;

  const known = FEATURE_RULES.find((rule) =>
    rule.patterns.some((pattern) => pattern.test(toSearchText(label)))
  );

  buckets.get(known?.section || sectionId)?.add(known?.label || capitalizeFirst(label));
}

function collectSourceText(vehicle) {
  const specs = vehicle?.specs ?? {};
  const rawValues = [
    specs.power,
    specs.bodyType,
    specs.engine,
    specs.drive,
    specs.rawText,
    ...(Array.isArray(specs.rawPairs) ? specs.rawPairs.flatMap((pair) => [pair.label, pair.value]) : []),
    vehicle?.description,
    vehicle?.equipmentText,
    ...(Array.isArray(vehicle?.equipment) ? vehicle.equipment : []),
  ];

  if (Array.isArray(vehicle?.equipmentSections)) {
    rawValues.push(...vehicle.equipmentSections.flatMap((section) => section.items ?? []));
  }

  return rawValues.filter(Boolean).join(' ');
}

function extractPower(value) {
  const text = cleanVehicleText(value);
  const match = text.match(/\b\d{2,4}\s*kW(?:\s*\(\s*\d{2,4}\s*(?:KM|HP)\s*\))?/i);
  return match?.[0] ?? '';
}

function extractEngineVolume(value) {
  const text = cleanVehicleText(value);
  const match = text.match(/\b\d{3,5}\s*ccm\b/i);
  return match?.[0] ?? '';
}

function normalizeYear(value) {
  const text = cleanVehicleText(value);
  const match = text.match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? text;
}

function normalizeMileage(value) {
  const text = cleanVehicleText(value);
  if (!text) return '';

  const digits = text.replace(/[^\d]/g, '');
  if (!digits) return text;

  const formatted = Number(digits).toLocaleString('sl-SI');
  return /\bkm\b/i.test(text) ? `${formatted} km` : `${formatted} km`;
}

function normalizeFuel(value) {
  const search = toSearchText(value);
  if (!search) return '';
  if (/\bdiesel\b|\bdizel\b/.test(search)) return 'Dizel';
  if (/\bbencin\b|\bpetrol\b|\bgasoline\b/.test(search)) return 'Bencin';
  if (/hibrid|hybrid/.test(search)) return 'Hibrid';
  if (/elektric|electric/.test(search)) return 'Elektrika';
  if (/\bplin\b|\blpg\b/.test(search)) return 'Plin';
  return capitalizeFirst(cleanVehicleText(value));
}

function normalizeEngine(value) {
  const text = cleanVehicleText(value);
  if (!text || isLikelyEquipmentBlob(text)) return '';

  const volume = extractEngineVolume(text) || text.match(/\b\d{3,5}\b/)?.[0];
  if (!volume) return text;

  const digits = volume.replace(/[^\d]/g, '');
  if (!digits) return text;
  return `${Number(digits).toLocaleString('sl-SI')} ccm`;
}

function normalizePower(value) {
  const text = cleanVehicleText(value);
  if (!text || isLikelyEquipmentBlob(text)) return '';

  const match = extractPower(text);
  return match || text;
}

function normalizeDrive(value) {
  const search = toSearchText(value);
  if (!search) return '';
  if (/xdrive|4x4|4wd|awd|stirikolesni/.test(search)) {
    return 'Štirikolesni pogon (4x4 / 4WD)';
  }
  if (/zadnji|rwd/.test(search)) return 'Zadnji pogon';
  if (/sprednji|fwd/.test(search)) return 'Sprednji pogon';
  return capitalizeFirst(cleanVehicleText(value));
}

function inferDrive(vehicle) {
  const text = [
    vehicle?.title,
    vehicle?.description,
    vehicle?.specs?.power,
    vehicle?.specs?.bodyType,
    vehicle?.specs?.rawText,
  ].filter(Boolean).join(' ');
  return /xdrive|4x4|4wd|awd|štirikolesni|stirikolesni/i.test(text) ? '4x4' : '';
}

function capitalizeFirst(value) {
  const text = cleanVehicleText(value);
  if (!text) return '';
  return text.charAt(0).toLocaleUpperCase('sl-SI') + text.slice(1);
}

function toRows(rows) {
  return rows
    .map(([label, value]) => [label, cleanVehicleText(value)])
    .filter(([, value]) => value && !isLikelyEquipmentBlob(value));
}
