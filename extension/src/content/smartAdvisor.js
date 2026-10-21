/**
 * Smart Advisor — analyses a parsed vehicle and returns a structured report.
 * Returns: { score, positives, warnings, redFlags, recommendation, priceVerdict }
 * recommendation: 'low_risk' | 'inspect' | 'high_risk'
 */

// ─── Keyword lists (Slovenian + English) ────────────────────────────────────

const RED_FLAG_PATTERNS = [
  // Nujna prodaja / pritisk
  { re: /nujno|hitro|čim prej|urgentno|urgent|quick sale/i, label: 'Nujna prodaja', detail: 'Prodajalčeva urgentnost je klasična taktika pritiska; morda skriva težave.' },
  { re: /ne\s*(izgubljajte|zapravljajte)\s*časa|no time wasters/i, label: '"Brez izgubljanja časa"', detail: 'Obrambna formulacija pogosto kaže na problematičen oglas.' },
  // Poškodbe / težave
  { re: /havarija|havarirano|po trčenju|po nesreči|accident|crashed|collision damage/i, label: 'Havarija v preteklosti', detail: 'Vozilo je bilo vpleteno v trčenje.' },
  { re: /poškodovano|poškodovan|damaged|has damage/i, label: 'Omenjene poškodbe', detail: 'Prodajalec priznava nekakšno poškodbo.' },
  { re: /rja|zarjavelo|rust|rusted/i, label: 'Omenjena rja', detail: 'Rja je lahko strukturna in drago popravilo.' },
  { re: /dimljivo|dimi|smo|smoky|burning oil/i, label: 'Motor dimi', detail: 'Motor, ki dimi, kaže na resne mehanske težave.' },
  { re: /(potrebuje|treba|manjka|needs?)\s+(popravilo|servis|delo|work|repair|fix)/i, label: 'Potrebuje popravilo', detail: 'Prodajalec prizna, da so potrebna popravila.' },
  { re: /male\s+napake|small issues|minor problems|malo poškodovan/i, label: 'Nejasne "manjše napake"', detail: 'Nejasne navedbe poškodb pogosto podcenjujejo dejanske stroške.' },
  // Cena / pogajanja
  { re: /cena\s*(ni|not)\s*fiksna|price.*not.*final|pogajanje|negotiable price/i, label: 'Cena ni fiksna', detail: 'Kaže, da prodajalec ni prepričan o vrednosti vozila.' },
  { re: /kot\s+je|as.is|brez\s+garancije\s*(prodano)|without\s+warranty.*sold/i, label: 'Prodano kot je', detail: 'Po prodaji ni odgovornosti.' },
  // Uvoz / dokumentacija
  { re: /uvoz\s*(brez|ni)|import.*without|brez\s+dokumentov|no.*documents/i, label: 'Manjkajoči dokumenti', detail: 'Uvoz brez dokumentov sproža pravne in varnostne pomisleke.' },
  { re: /ve[cč]\s+lastnikov|multiple owners|3\.?\s*lastnik|4\.?\s*lastnik/i, label: '3+ prejšnjih lastnikov', detail: 'Pogosta menjava lastnikov lahko kaže na ponavljajoče se težave.' },
  // Ogled
  { re: /ogled\s+ni\s+mogo[cč]|no test drive|no viewings/i, label: 'Testna vožnja ni mogoča', detail: 'Zavrnitev ogleda je resna rdeča zastavica.' },
];

const POSITIVE_PATTERNS = [
  { re: /servisna\s+knjiga|service\s+(book|history|records?)|servisiran/i, label: 'Servisna knjiga prisotna', detail: 'Popolna servisna dokumentacija zmanjšuje negotovost.' },
  { re: /garancija|warranty|jamstvo/i, label: 'Garancija na voljo', detail: 'Prodajalec ali trgovec ponuja garancijo.' },
  { re: /tehni[cč]ni\s+pregled|tehnično\s+brezhibno|te\.pe\.|t\.p\.|MOT\s*ok/i, label: 'Tehnični pregled opravljen', detail: 'Vozilo ima veljavno potrdilo o tehnični brezhibnosti.' },
  { re: /novi\s+gum|new\s+tires?|nove\s+pnevmatike/i, label: 'Nove pnevmatike', detail: 'Nedavna zamenjava pnevmatik prihrani kratkoročne stroške.' },
  { re: /prvi\s+lastnik|first\s+owner|1\.\s*lastnik|en\s+lastnik/i, label: 'Prvi lastnik', detail: 'Vozila z enim lastnikom so pogosto bolje vzdrževana.' },
  { re: /ne\s*kadi|ne\s*dimi|no\s*smoke|runs\s*clean/i, label: 'Ne dimi / teče brezhibno', detail: 'Prodajalec potrjuje, da motor ne dimi.' },
  { re: /nova\s+sklopka|new\s+clutch|zamenjan\s+jermen|new\s+timing\s+belt/i, label: 'Nedavno zamenjani večji deli', detail: 'Dragi sestavni deli so bili nedavno zamenjani.' },
  { re: /registriran|registration\s+valid|veljavna\s+registracija/i, label: 'Veljavna registracija', detail: 'Vozilo je trenutno registrirano.' },
  { re: /garažiran|garažno|garaged|kept\s+indoors/i, label: 'Garažirano', detail: 'Shranjevanje v zaprtem prostoru podaljša življenjsko dobo.' },
  { re: /ne\s+kuri\s+olja|no\s+oil\s+consumption|oil\s+ok/i, label: 'Ne kuri olja', detail: 'Potrjuje celovitost motorja.' },
];

// ─── Mileage / Age analysis ──────────────────────────────────────────────────

function analyzeMileageAge(specs, score) {
  const kmStr = (specs.mileage || '').replace(/[^\d]/g, '');
  const km = kmStr ? parseInt(kmStr, 10) : null;
  const yearStr = (specs.year || '').replace(/[^\d]/g, '');
  const year = yearStr ? parseInt(yearStr, 10) : null;
  const currentYear = new Date().getFullYear();

  if (km === null) return;

  if (km < 80000) {
    score.positives.push({ label: 'Nizka kilometrina', detail: `${km.toLocaleString('sl-SI')} km je pod povprečjem.` });
    score.points += 15;
  } else if (km > 250000) {
    score.redFlags.push({ label: 'Zelo visoka kilometrina', detail: `${km.toLocaleString('sl-SI')} km - pričakujte večjo obrabo.` });
    score.points -= 20;
  } else if (km > 150000) {
    score.warnings.push({ label: 'Visoka kilometrina', detail: `${km.toLocaleString('sl-SI')} km - natančno preverite pogonski sklop.` });
    score.points -= 10;
  }

  if (km && year) {
    const age = currentYear - year;

    if (age <= 0) return;

    const annualKm = km / age;
    if (annualKm < 10000) {
      score.positives.push({ label: 'Podpovprečna letna kilometrina', detail: `~${Math.round(annualKm).toLocaleString('sl-SI')} km/leto.` });
      score.points += 10;
    } else if (annualKm > 30000) {
      score.warnings.push({ label: 'Nadpovprečna letna kilometrina', detail: `~${Math.round(annualKm).toLocaleString('sl-SI')} km/leto - možna uporaba kot taksi/dostava.` });
      score.points -= 8;
    }
  }
}

// ─── Price analysis ──────────────────────────────────────────────────────────

function analyzePrice(priceNum, specs, score) {
  if (!priceNum) return;

  const yearStr = (specs.year || '').replace(/[^\d]/g, '');
  const year = yearStr ? parseInt(yearStr, 10) : null;
  const currentYear = new Date().getFullYear();
  const age = year ? currentYear - year : null;

  if (age === null) {
    score.priceVerdict = {
      verdict: 'neznana',
      confidence: 10,
      explanation: 'Leto izdelave ni znano, zato cena ni ocenjena. Primerjajte jo z aktualnimi podobnimi oglasi.',
    };
    return;
  }

  let verdict = 'brez posebnega signala';
  let confidence = 25;
  let explanation = 'Cena ni primerjana z živo bazo podobnih oglasov. Ta signal je samo grob amortizacijski preizkus in ne nadomešča primerjave aktualnih oglasov.';

  const estimatedValue = Math.max(1500, 25000 * Math.pow(0.85, age));
  const ratio = priceNum / estimatedValue;

  if (ratio < 0.45) {
    verdict = 'nenavadno nizka';
    confidence = 30;
    explanation = `Cena je precej pod grobo amortizacijsko referenco za starost vozila. To ni dokaz napake, je pa razlog za preverjanje poškodb, dokumentacije, uvoza ali nujne prodaje.`;
    score.warnings.push({ label: 'Nenavadno nizka cena', detail: explanation });
    score.points -= 3;
  } else if (ratio > 1.7) {
    verdict = 'nenavadno visoka';
    confidence = 30;
    explanation = `Cena je precej nad grobo amortizacijsko referenco za starost vozila. Preverite, ali oprema, stanje, redkost ali nizka kilometrina res upravičujejo pribitek.`;
    score.warnings.push({ label: 'Cena zahteva primerjavo', detail: explanation });
    score.points -= 3;
  }

  score.priceVerdict = { verdict, confidence, explanation };
}

// ─── Text scan ───────────────────────────────────────────────────────────────

function scanText(text, score) {
  for (const pattern of RED_FLAG_PATTERNS) {
    if (pattern.re.test(text)) {
      score.redFlags.push({ label: pattern.label, detail: pattern.detail });
      score.points -= 12;
    }
  }
  for (const pattern of POSITIVE_PATTERNS) {
    if (pattern.re.test(text)) {
      score.positives.push({ label: pattern.label, detail: pattern.detail });
      score.points += 10;
    }
  }
}

// ─── Image count bonus ───────────────────────────────────────────────────────

function analyzeImages(images, score) {
  if (images.length >= 10) {
    score.positives.push({ label: 'Veliko fotografij', detail: `${images.length} fotografij - prodajalec je pregleden.` });
    score.points += 8;
  } else if (images.length <= 2) {
    score.warnings.push({ label: 'Zelo malo fotografij', detail: 'Malo fotografij otežuje oceno stanja vozila.' });
    score.points -= 6;
  }
}

// ─── Dealer vs private ───────────────────────────────────────────────────────

function analyzeSellerType(sellerInfo, score) {
  if (sellerInfo?.type === 'dealer') {
    score.positives.push({ label: 'Oglas trgovca', detail: 'Trgovci so pravno odgovorni in pogosto nudijo garancijo.' });
    score.points += 5;
  }
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function analyzeVehicle(vehicleData) {
  const score = {
    points: 50, // start neutral
    positives: [],
    warnings: [],
    redFlags: [],
    priceVerdict: null,
  };

  const fullText = [
    vehicleData.title,
    vehicleData.description,
    vehicleData.price,
    Object.values(vehicleData.specs ?? {}).join(' '),
    vehicleData.sellerInfo?.name,
  ]
    .filter(Boolean)
    .join(' ');

  scanText(fullText, score);
  analyzeMileageAge(vehicleData.specs ?? {}, score);
  analyzePrice(vehicleData.priceNum, vehicleData.specs ?? {}, score);
  analyzeImages(vehicleData.images ?? [], score);
  analyzeSellerType(vehicleData.sellerInfo, score);

  // Clamp 0–100
  const finalScore = Math.min(100, Math.max(0, score.points));

  let recommendation;
  if (finalScore >= 62) recommendation = 'low_risk';
  else if (finalScore >= 38) recommendation = 'inspect';
  else recommendation = 'high_risk';

  return {
    score: finalScore,
    positives: score.positives,
    warnings: score.warnings,
    redFlags: score.redFlags,
    priceVerdict: score.priceVerdict,
    recommendation,
  };
}
