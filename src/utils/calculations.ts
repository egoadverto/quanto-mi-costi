export type Veicolo = {
  id: string;
  nome: string;
  marca: string | null;
  modello: string | null;
  tipo_veicolo: 'auto' | 'moto' | null;
  tipo_energia: 'elettrico' | 'benzina' | 'diesel' | null;
  unita_default: 'kWh' | 'L' | null;
  odometro_iniziale: number | null;
  data_acquisto: string | null;
  data_creazione: string | null;
  note: string | null;
};

export type Rifornimento = {
  id: string;
  veicolo_id: string;
  data: string;
  odometro: number;
  quantita: number;
  unita: 'kWh' | 'L' | null;
  prezzo_unitario: number;
  costo_totale: number;
  fornitore: string | null;
  note: string | null;
};

export type Spesa = {
  id: string;
  veicolo_id: string;
  data: string;
  categoria: string | null;
  descrizione: string | null;
  importo: number;
  odometro: number | null;
  note: string | null;
};

export type RifornimentoForm = {
  veicolo_id: string;
  data: string;
  odometro: string;
  quantita: string;
  unita: string;
  prezzo_unitario: string;
  costo_totale: string;
  fornitore: string;
  note: string;
};

export const sortByOdometer = (items: Rifornimento[]) => [...items].sort((a, b) => a.odometro - b.odometro);

export const calculateRifornimentoForm = (form: RifornimentoForm, field: keyof RifornimentoForm, value: string): RifornimentoForm => {
  const nextForm = { ...form, [field]: value };

  if (field === 'quantita' || field === 'prezzo_unitario') {
    const quantita = Number(nextForm.quantita);
    const prezzoUnitario = Number(nextForm.prezzo_unitario);
    if (!Number.isNaN(quantita) && !Number.isNaN(prezzoUnitario)) {
      nextForm.costo_totale = (Math.round(quantita * prezzoUnitario * 100) / 100).toFixed(2);
    }
  }

  if (field === 'costo_totale') {
    const quantita = Number(nextForm.quantita);
    const costoTotale = Number(nextForm.costo_totale);
    if (quantita > 0 && !Number.isNaN(costoTotale)) {
      nextForm.prezzo_unitario = (Math.round((costoTotale / quantita) * 10000) / 10000).toFixed(4);
    }
  }

  return nextForm;
};

export const calculateDashboard = (veicoli: Veicolo[], rifornimenti: Rifornimento[], spese: Spesa[]) => {
  const anno = new Date().getFullYear();
  const rAnno = rifornimenti.filter((r) => new Date(r.data).getFullYear() === anno);
  const sAnno = spese.filter((s) => new Date(s.data).getFullYear() === anno);
  const totaleAnno = rAnno.reduce((acc, item) => acc + item.costo_totale, 0) + sAnno.reduce((acc, item) => acc + item.importo, 0);
  const mesi = new Date().getMonth() + 1;
  const costoMedioMensile = mesi > 0 ? totaleAnno / mesi : 0;

  const kmGlobali = veicoli.reduce((acc, v) => {
    const list = sortByOdometer(rifornimenti.filter((r) => r.veicolo_id === v.id));
    if (list.length < 2) return acc;
    return acc + (list[list.length - 1].odometro - list[0].odometro);
  }, 0);

  const costoKm = kmGlobali > 0 ? totaleAnno / kmGlobali : null;

  const efficienze = veicoli.map((v) => {
    const list = sortByOdometer(rifornimenti.filter((r) => r.veicolo_id === v.id));
    if (list.length < 2) return { veicolo: v.nome, valore: null as number | null, unita: 'km/L', campioni: 0 };

    const valori: number[] = [];
    for (let i = 1; i < list.length; i += 1) {
      const kmPercorsi = list[i].odometro - list[i - 1].odometro;
      if (kmPercorsi > 0 && list[i].quantita > 0) valori.push(kmPercorsi / list[i].quantita);
    }

    const media = valori.length ? valori.reduce((a, b) => a + b, 0) / valori.length : null;
    const unita = list[0].unita === 'kWh' ? 'km/kWh' : 'km/L';
    return { veicolo: v.nome, valore: media, unita, campioni: list.length };
  });

  const ultimaSpesa = [...spese].sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;
  const ultimoRifornimento = [...rifornimenti].sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;

  const costoPerVeicolo = veicoli
    .map((v) => {
      const totaleRifornimenti = rifornimenti.filter((r) => r.veicolo_id === v.id).reduce((acc, item) => acc + item.costo_totale, 0);
      const totaleSpese = spese.filter((s) => s.veicolo_id === v.id).reduce((acc, item) => acc + item.importo, 0);
      return { nome: v.nome, totale: totaleRifornimenti + totaleSpese };
    })
    .sort((a, b) => b.totale - a.totale)[0] ?? null;

  return { totaleAnno, costoMedioMensile, costoKm, efficienze, ultimaSpesa, ultimoRifornimento, costoPerVeicolo };
};

export const calculateReport = (veicoli: Veicolo[], rifornimenti: Rifornimento[], spese: Spesa[], nomeVeicoloById: Record<string, string>) => {
  const perVeicoloMap = veicoli.reduce<Record<string, number>>((acc, v) => ({ ...acc, [v.nome]: 0 }), {});

  rifornimenti.forEach((r) => {
    const nome = nomeVeicoloById[r.veicolo_id] ?? 'Sconosciuto';
    perVeicoloMap[nome] = (perVeicoloMap[nome] ?? 0) + r.costo_totale;
  });

  spese.forEach((s) => {
    const nome = nomeVeicoloById[s.veicolo_id] ?? 'Sconosciuto';
    perVeicoloMap[nome] = (perVeicoloMap[nome] ?? 0) + s.importo;
  });

  const perCategoriaMap = spese.reduce<Record<string, number>>((acc, s) => {
    const categoria = s.categoria || 'altro';
    acc[categoria] = (acc[categoria] ?? 0) + s.importo;
    return acc;
  }, {});

  const perMeseMap = [...rifornimenti.map((r) => ({ data: r.data, importo: r.costo_totale })), ...spese.map((s) => ({ data: s.data, importo: s.importo }))].reduce<Record<string, number>>((acc, item) => {
    const key = item.data.slice(0, 7);
    acc[key] = (acc[key] ?? 0) + item.importo;
    return acc;
  }, {});

  const perVeicolo = Object.entries(perVeicoloMap).sort((a, b) => b[1] - a[1]);
  const perCategoria = Object.entries(perCategoriaMap).sort((a, b) => b[1] - a[1]);
  const perMese = Object.entries(perMeseMap).sort((a, b) => a[0].localeCompare(b[0]));

  return {
    perVeicolo,
    perCategoria,
    perMese,
    maxVeicolo: perVeicolo[0]?.[1] ?? 1,
    maxCategoria: perCategoria[0]?.[1] ?? 1,
    maxMese: perMese[0]?.[1] ?? 1
  };
};
