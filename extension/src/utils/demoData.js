const DAY = 24 * 60 * 60 * 1000;

export function createDemoState(now = Date.now()) {
  return {
    ag_folders: [
      { id: 'all', name: 'Vsa vozila', color: '#f47920', locked: true },
      { id: 'favourites', name: 'Priljubljeni', color: '#f59e0b', locked: false },
      { id: 'shortlist', name: 'Ogled ta teden', color: '#22c55e', locked: false },
      { id: 'watchlist', name: 'Spremljaj ceno', color: '#3b82f6', locked: false },
    ],
    ag_settings: {
      checkIntervalMinutes: 45,
      notificationsEnabled: true,
      lastChecked: now - 18 * 60 * 1000,
    },
    ag_notifications: [
      {
        id: 'demo_notif_1',
        type: 'price_change',
        vehicleId: 'demo_bmw_3',
        message: 'BMW 320d Touring xDrive je znižan za 1.200 EUR.',
        oldPrice: 25900,
        newPrice: 24700,
        read: false,
        createdAt: now - 42 * 60 * 1000,
      },
      {
        id: 'demo_notif_2',
        type: 'sold',
        vehicleId: 'demo_golf',
        message: 'Volkswagen Golf 1.5 TSI Style je označen kot prodan.',
        read: false,
        createdAt: now - 5 * 60 * 60 * 1000,
      },
      {
        id: 'demo_notif_3',
        type: 'saved',
        vehicleId: 'demo_cx5',
        message: 'Mazda CX-5 CD150 Revolution Top je shranjena v mapo Ogled ta teden.',
        read: true,
        createdAt: now - DAY,
      },
    ],
    ag_vehicles: [
      buildVehicle({
        id: 'demo_bmw_3',
        title: 'BMW 320d Touring xDrive Advantage',
        priceNum: 24700,
        previousPrice: 25900,
        status: 'price_change',
        folderId: 'watchlist',
        savedAt: now - 2 * DAY,
        lastChecked: now - 18 * 60 * 1000,
        image:
          'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1000&q=80',
        specs: {
          year: '2019',
          mileage: '118000 km',
          fuel: 'Dizel',
          engine: '1995 ccm',
          power: '140 kW (190 KM)',
          transmission: 'Avtomatski',
          color: 'Mineralno siva metalik',
          bodyType: 'Karavan',
          drive: 'xDrive 4x4',
          rawText:
            'servisna knjiga, garancija, LED zarometi, navigacija, tempomat, kamera za vzvratno voznjo, ogrevani sedezi, ALU platisca',
        },
        sellerInfo: {
          name: 'Avto Center Sever',
          phone: '+386 40 555 120',
          location: 'Ljubljana',
          type: 'dealer',
        },
        description:
          'Redno servisiran touring z znano zgodovino, veljavno registracijo in kompletom zimskih pnevmatik. Vozilo je garazirano, ne kadi in ima sveze opravljen servis.',
      }),
      buildVehicle({
        id: 'demo_cx5',
        title: 'Mazda CX-5 CD150 Revolution Top',
        priceNum: 21490,
        previousPrice: 21490,
        status: 'active',
        folderId: 'shortlist',
        savedAt: now - 4 * DAY,
        lastChecked: now - 18 * 60 * 1000,
        image:
          'https://images.unsplash.com/photo-1542362567-b07e54358753?auto=format&fit=crop&w=1000&q=80',
        specs: {
          year: '2020',
          mileage: '76000 km',
          fuel: 'Dizel',
          engine: '2191 ccm',
          power: '110 kW (150 KM)',
          transmission: 'Ročni',
          color: 'Rdeča metalik',
          bodyType: 'SUV',
          drive: 'Sprednji pogon',
          rawText:
            'prvi lastnik, servisna knjiga, tehnicni pregled, Apple CarPlay, Android Auto, senzor za dez, parkirni senzorji, LED zarometi, ISOFIX',
        },
        sellerInfo: {
          name: 'Zasebni prodajalec',
          phone: '+386 31 210 884',
          location: 'Maribor',
          type: 'private',
        },
        description:
          'Prvi lastnik, slovensko vozilo, brez skritih napak. Vsa dokumentacija je na voljo, ogled in testna voznja sta mozna po dogovoru.',
      }),
      buildVehicle({
        id: 'demo_audi_a4',
        title: 'Audi A4 Avant 2.0 TDI S tronic',
        priceNum: 18800,
        previousPrice: 18800,
        status: 'active',
        folderId: 'favourites',
        savedAt: now - 6 * DAY,
        lastChecked: now - 18 * 60 * 1000,
        image:
          'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=80',
        specs: {
          year: '2018',
          mileage: '149000 km',
          fuel: 'Dizel',
          engine: '1968 ccm',
          power: '110 kW (150 KM)',
          transmission: 'Avtomatski',
          color: 'Črna metalik',
          bodyType: 'Karavan',
          drive: 'Sprednji pogon',
          rawText:
            'servisna knjiga, navigacija, bluetooth, tempomat, xenon, električni pomik stekel, ALU platisca 17 col',
        },
        sellerInfo: {
          name: 'Mobilis d.o.o.',
          phone: '+386 2 444 772',
          location: 'Celje',
          type: 'dealer',
        },
        description:
          'Urejen karavan z avtomatskim menjalnikom in dobro opremo. Cena je primerna za stanje, priporocen je pregled servisnih racunov pred nakupom.',
      }),
      buildVehicle({
        id: 'demo_golf',
        title: 'Volkswagen Golf 1.5 TSI Style',
        priceNum: 19950,
        previousPrice: 19950,
        status: 'sold',
        folderId: 'all',
        savedAt: now - 9 * DAY,
        lastChecked: now - 5 * 60 * 60 * 1000,
        image:
          'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1000&q=80',
        specs: {
          year: '2021',
          mileage: '52000 km',
          fuel: 'Bencin',
          engine: '1498 ccm',
          power: '96 kW (130 KM)',
          transmission: 'Ročni',
          color: 'Bela',
          bodyType: 'Kombilimuzina',
          drive: 'Sprednji pogon',
          rawText:
            'garancija, prvi lastnik, registriran, avtomatska klima, aktivni tempomat, lane keep, prometni znaki, kamera za vzvratno voznjo',
        },
        sellerInfo: {
          name: 'Avtohiša Primorska',
          phone: '+386 5 700 454',
          location: 'Koper',
          type: 'dealer',
        },
        description:
          'Oglas je bil med zadnjim preverjanjem oznacen kot prodan. Podatki ostanejo v garazi zaradi zgodovine in primerjave cen.',
      }),
      buildVehicle({
        id: 'demo_clio',
        title: 'Renault Clio TCe Intens',
        priceNum: 11900,
        previousPrice: 12500,
        status: 'active',
        folderId: 'shortlist',
        savedAt: now - 12 * DAY,
        lastChecked: now - 18 * 60 * 1000,
        image:
          'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80',
        specs: {
          year: '2019',
          mileage: '68000 km',
          fuel: 'Bencin',
          engine: '999 ccm',
          power: '74 kW (100 KM)',
          transmission: 'Ročni',
          color: 'Modra',
          bodyType: 'Kombilimuzina',
          drive: 'Sprednji pogon',
          rawText:
            'tehnicni pregled, bluetooth, USB, klimatska naprava, parkirni senzorji, ISOFIX, nove pnevmatike',
        },
        sellerInfo: {
          name: 'Zasebni prodajalec',
          phone: '+386 41 443 909',
          location: 'Novo mesto',
          type: 'private',
        },
        description:
          'Majhen mestni avto z nizko porabo, sveze menjane pnevmatike in redno vzdrzevanje. Cena ni fiksna, ogled je mozen popoldne.',
      }),
    ],
  };
}

function buildVehicle({
  id,
  title,
  priceNum,
  previousPrice,
  status,
  folderId,
  savedAt,
  lastChecked,
  image,
  specs,
  sellerInfo,
  description,
}) {
  return {
    id,
    title,
    url: `https://www.avto.net/Ads/details.asp?id=${encodeURIComponent(id)}`,
    price: `${priceNum.toLocaleString('sl-SI')} EUR`,
    priceNum,
    status,
    folderId,
    savedAt,
    lastChecked,
    mileage: specs.mileage,
    images: [
      image,
      image.replace('w=1000', 'w=700'),
      image.replace('q=80', 'q=70'),
    ],
    specs,
    sellerInfo,
    description,
    priceHistory: [
      { price: previousPrice, ts: savedAt },
      { price: priceNum, ts: lastChecked },
    ],
  };
}
