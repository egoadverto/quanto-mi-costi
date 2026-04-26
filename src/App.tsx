import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type Veicolo = {
  id: string;
  nome: string;
  marca: string | null;
  modello: string | null;
  tipo_veicolo: 'auto' | 'moto' | null;
  tipo_energia: 'elettrico' | 'benzina' | 'diesel' | null;
  unita_default: 'kWh' | 'L' | null;
  odometro_iniziale: number | null;
  data_creazione: string | null;
  note: string | null;
};

type Rifornimento = {
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

type Spesa = {
  id: string;
  veicolo_id: string;
  data: string;
  categoria: string | null;
  descrizione: string | null;
  importo: number;
  odometro: number | null;
  note: string | null;
};

const categorieSpesa = ['assicurazione','bollo','manutenzione','tagliando','gomme','revisione','accessori','parcheggio','pedaggi','lavaggio','altro'];

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);
  const [rifornimenti, setRifornimenti] = useState<Rifornimento[]>([]);
  const [spese, setSpese] = useState<Spesa[]>([]);

  const [vForm, setVForm] = useState({ nome: '', marca: '', modello: '', tipo_veicolo: 'auto', tipo_energia: 'benzina', unita_default: 'L', odometro_iniziale: '0', note: '' });
  const [rForm, setRForm] = useState({ veicolo_id: '', data: '', odometro: '', quantita: '', unita: 'L', prezzo_unitario: '', costo_totale: '', fornitore: '', note: '' });
  const [sForm, setSForm] = useState({ veicolo_id: '', data: '', categoria: 'manutenzione', descrizione: '', importo: '', odometro: '', note: '' });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      void loadData();
    }
  }, [session]);

  async function loadData() {
    const [v, r, s] = await Promise.all([
      supabase.from('veicoli').select('*').order('data_creazione', { ascending: false }),
      supabase.from('rifornimenti').select('*').order('data', { ascending: false }),
      supabase.from('spese').select('*').order('data', { ascending: false })
    ]);
    if (v.data) setVeicoli(v.data as Veicolo[]);
    if (r.data) setRifornimenti(r.data as Rifornimento[]);
    if (s.data) setSpese(s.data as Spesa[]);
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function addVeicolo(e: FormEvent) {
    e.preventDefault();
    if (!vForm.nome.trim()) return setError('Nome veicolo obbligatorio');
    if (Number.isNaN(Number(vForm.odometro_iniziale))) return setError('Odometro non valido');
    const { error: insertError } = await supabase.from('veicoli').insert([{ ...vForm, user_id: session?.user.id, odometro_iniziale: Number(vForm.odometro_iniziale) }]);
    if (insertError) return setError(insertError.message);
    setVForm({ nome: '', marca: '', modello: '', tipo_veicolo: 'auto', tipo_energia: 'benzina', unita_default: 'L', odometro_iniziale: '0', note: '' });
    await loadData();
  }

  async function addRifornimento(e: FormEvent) {
    e.preventDefault();
    if (Number(rForm.quantita) <= 0) return setError('Quantità deve essere > 0');
    if (Number(rForm.prezzo_unitario) < 0 || Number(rForm.costo_totale) < 0) return setError('Prezzi non validi');
    if (Number.isNaN(Number(rForm.odometro))) return setError('Odometro non valido');
    const { error: insertError } = await supabase.from('rifornimenti').insert([{ ...rForm, user_id: session?.user.id, odometro: Number(rForm.odometro), quantita: Number(rForm.quantita), prezzo_unitario: Number(rForm.prezzo_unitario), costo_totale: Number(rForm.costo_totale) }]);
    if (insertError) return setError(insertError.message);
    setRForm({ veicolo_id: '', data: '', odometro: '', quantita: '', unita: 'L', prezzo_unitario: '', costo_totale: '', fornitore: '', note: '' });
    await loadData();
  }

  async function addSpesa(e: FormEvent) {
    e.preventDefault();
    if (Number(sForm.importo) < 0) return setError('Importo non valido');
    const odometro = sForm.odometro === '' ? null : Number(sForm.odometro);
    if (odometro !== null && Number.isNaN(odometro)) return setError('Odometro non valido');
    const { error: insertError } = await supabase.from('spese').insert([{ ...sForm, user_id: session?.user.id, importo: Number(sForm.importo), odometro }]);
    if (insertError) return setError(insertError.message);
    setSForm({ veicolo_id: '', data: '', categoria: 'manutenzione', descrizione: '', importo: '', odometro: '', note: '' });
    await loadData();
  }

  async function deleteItem(tabella: 'veicoli' | 'rifornimenti' | 'spese', id: string) {
    await supabase.from(tabella).delete().eq('id', id);
    await loadData();
  }

  async function updateVeicoloNome(id: string, nomeAttuale: string) {
    const nuovoNome = window.prompt('Nuovo nome veicolo', nomeAttuale);
    if (!nuovoNome || !nuovoNome.trim()) return;
    await supabase.from('veicoli').update({ nome: nuovoNome.trim() }).eq('id', id);
    await loadData();
  }

  async function updateRifornimentoCosto(id: string, costoAttuale: number) {
    const nuovoCosto = window.prompt('Nuovo costo totale', String(costoAttuale));
    if (nuovoCosto === null) return;
    const costo = Number(nuovoCosto);
    if (Number.isNaN(costo) || costo < 0) return setError('Costo totale non valido');
    await supabase.from('rifornimenti').update({ costo_totale: costo }).eq('id', id);
    await loadData();
  }

  async function updateSpesaImporto(id: string, importoAttuale: number) {
    const nuovoImporto = window.prompt('Nuovo importo', String(importoAttuale));
    if (nuovoImporto === null) return;
    const importo = Number(nuovoImporto);
    if (Number.isNaN(importo) || importo < 0) return setError('Importo non valido');
    await supabase.from('spese').update({ importo }).eq('id', id);
    await loadData();
  }

  function updateRForm(field: keyof typeof rForm, value: string) {
    const nextForm = { ...rForm, [field]: value };
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
    setRForm(nextForm);
  }

  const dashboard = useMemo(() => {
    const anno = new Date().getFullYear();
    const rAnno = rifornimenti.filter((r) => new Date(r.data).getFullYear() === anno);
    const sAnno = spese.filter((s) => new Date(s.data).getFullYear() === anno);
    const totaleAnno = rAnno.reduce((acc, r) => acc + r.costo_totale, 0) + sAnno.reduce((acc, s) => acc + s.importo, 0);
    const mesi = new Date().getMonth() + 1;
    const costoMedioMensile = mesi > 0 ? totaleAnno / mesi : 0;

    const kmGlobali = veicoli.reduce((acc, v) => {
      const list = rifornimenti.filter((r) => r.veicolo_id === v.id).sort((a, b) => a.odometro - b.odometro);
      if (list.length < 2) return acc;
      return acc + (list[list.length - 1].odometro - list[0].odometro);
    }, 0);
    const costoKm = kmGlobali > 0 ? totaleAnno / kmGlobali : null;

    const efficienze = veicoli.map((v) => {
      const list = rifornimenti.filter((r) => r.veicolo_id === v.id).sort((a, b) => a.odometro - b.odometro);
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

    const costoPerVeicolo = veicoli.map((v) => {
      const cr = rifornimenti.filter((r) => r.veicolo_id === v.id).reduce((acc, r) => acc + r.costo_totale, 0);
      const cs = spese.filter((s) => s.veicolo_id === v.id).reduce((acc, s) => acc + s.importo, 0);
      return { nome: v.nome, totale: cr + cs };
    }).sort((a, b) => b.totale - a.totale)[0] ?? null;

    return { totaleAnno, costoMedioMensile, costoKm, efficienze, ultimaSpesa, ultimoRifornimento, costoPerVeicolo };
  }, [veicoli, rifornimenti, spese]);

  const nomeVeicoloById = useMemo(() => Object.fromEntries(veicoli.map((v) => [v.id, v.nome])), [veicoli]);

  const reportData = useMemo(() => {
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

    const perMeseMap = [...rifornimenti.map((r) => ({ data: r.data, importo: r.costo_totale })), ...spese.map((s) => ({ data: s.data, importo: s.importo }))]
      .reduce<Record<string, number>>((acc, item) => {
        const key = item.data.slice(0, 7);
        acc[key] = (acc[key] ?? 0) + item.importo;
        return acc;
      }, {});

    const perVeicolo = Object.entries(perVeicoloMap).sort((a, b) => b[1] - a[1]);
    const perCategoria = Object.entries(perCategoriaMap).sort((a, b) => b[1] - a[1]);
    const perMese = Object.entries(perMeseMap).sort((a, b) => a[0].localeCompare(b[0]));
    const maxVeicolo = perVeicolo[0]?.[1] ?? 1;
    const maxCategoria = perCategoria[0]?.[1] ?? 1;
    const maxMese = perMese[0]?.[1] ?? 1;

    return { perVeicolo, perCategoria, perMese, maxVeicolo, maxCategoria, maxMese };
  }, [nomeVeicoloById, rifornimenti, spese, veicoli]);

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 text-[#12343b]">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold text-[#12343b]">Ma quanto mi costi?!</h1>
            <p className="text-sm text-[#12343b]/70">Costi, rifornimenti e report dei tuoi veicoli</p>
          </header>
          <section className="mx-auto w-full max-w-md rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold text-[#12343b]">Accesso</h2>
            <form onSubmit={login} className="space-y-3">
              <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button className="w-full rounded-xl bg-[#2d545e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12343b]" type="submit">Accedi</button>
            </form>
            {error && <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-[#12343b]">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <header className="rounded-2xl border border-[#12343b] bg-[#2d545e] p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Ma quanto mi costi?!</h1>
              <p className="text-sm text-white/80">Costi, rifornimenti e report dei tuoi veicoli</p>
            </div>
            <button className="rounded-xl bg-[#12343b] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f2a2f]" onClick={logout}>Logout</button>
          </div>
          <nav className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <a href="#dashboard" className="rounded-xl border border-[#e1b382] bg-[#e1b382] px-3 py-2 text-center font-semibold text-[#12343b]">Dashboard</a>
            <a href="#rifornimenti" className="rounded-xl border border-[#e1b382] bg-white px-3 py-2 text-center font-semibold text-[#2d545e]">Rifornimenti</a>
            <a href="#spese" className="rounded-xl border border-[#e1b382] bg-white px-3 py-2 text-center font-semibold text-[#2d545e]">Spese</a>
            <a href="#report" className="rounded-xl border border-[#e1b382] bg-white px-3 py-2 text-center font-semibold text-[#2d545e]">Report</a>
            <a href="#veicoli" className="rounded-xl border border-[#e1b382] bg-white px-3 py-2 text-center font-semibold text-[#2d545e]">Veicoli</a>
          </nav>
        </header>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section id="dashboard" className="space-y-3">
        <h2 className="text-xl font-semibold text-[#12343b]">Dashboard</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm"><p className="text-xs text-[#12343b]/70">Totale anno</p><p className="text-lg font-semibold text-[#2d545e]">{euro.format(dashboard.totaleAnno)}</p></div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm"><p className="text-xs text-[#12343b]/70">Costo medio mensile</p><p className="text-lg font-semibold text-[#2d545e]">{euro.format(dashboard.costoMedioMensile)}</p></div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm"><p className="text-xs text-[#12343b]/70">Costo/km</p><p className="text-lg font-semibold text-[#2d545e]">{dashboard.costoKm ? `${dashboard.costoKm.toFixed(2)} €/km` : 'N/D'}</p></div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm"><p className="text-xs text-[#12343b]/70">Veicolo più costoso</p><p className="text-sm font-semibold text-[#2d545e]">{dashboard.costoPerVeicolo ? dashboard.costoPerVeicolo.nome : 'N/D'}</p></div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm"><p className="text-xs text-[#12343b]/70">Ultimo rifornimento</p><p className="text-sm">{dashboard.ultimoRifornimento ? `${dashboard.ultimoRifornimento.data} · ${euro.format(dashboard.ultimoRifornimento.costo_totale)}` : 'N/D'}</p></div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm"><p className="text-xs text-[#12343b]/70">Ultima spesa</p><p className="text-sm">{dashboard.ultimaSpesa ? `${dashboard.ultimaSpesa.data} · ${euro.format(dashboard.ultimaSpesa.importo)}` : 'N/D'}</p></div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm lg:col-span-2"><p className="text-xs text-[#12343b]/70">Efficienza media</p><ul className="mt-1 space-y-1 text-sm">{dashboard.efficienze.map((e) => <li key={e.veicolo}>{e.veicolo}: {e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'N/D'}</li>)}</ul></div>
        </div>
      </section>

      <section id="rifornimenti" className="space-y-3">
        <h2 className="text-xl font-semibold text-[#12343b]">Rifornimenti</h2>
        <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
          <form onSubmit={addRifornimento} className="grid gap-3 sm:grid-cols-2">
            <select className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" value={rForm.veicolo_id} onChange={(e) => setRForm({ ...rForm, veicolo_id: e.target.value })} required><option value="">Veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="date" value={rForm.data} onChange={(e) => setRForm({ ...rForm, data: e.target.value })} required />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="number" placeholder="Odometro" value={rForm.odometro} onChange={(e) => setRForm({ ...rForm, odometro: e.target.value })} required />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="number" step="0.01" placeholder="Quantità" value={rForm.quantita} onChange={(e) => setRForm({ ...rForm, quantita: e.target.value })} required />
            <select className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" value={rForm.unita} onChange={(e) => setRForm({ ...rForm, unita: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="number" step="0.0001" placeholder="Prezzo unitario" value={rForm.prezzo_unitario} onChange={(e) => setRForm({ ...rForm, prezzo_unitario: e.target.value })} required />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="number" step="0.01" placeholder="Costo totale" value={rForm.costo_totale} onChange={(e) => setRForm({ ...rForm, costo_totale: e.target.value })} required />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" placeholder="Fornitore" value={rForm.fornitore} onChange={(e) => setRForm({ ...rForm, fornitore: e.target.value })} />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382] sm:col-span-2" placeholder="Note" value={rForm.note} onChange={(e) => setRForm({ ...rForm, note: e.target.value })} />
            <button className="rounded-xl bg-[#2d545e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12343b] sm:col-span-2 sm:w-fit" type="submit">Salva rifornimento</button>
          </form>
        </div>
        <div className="grid gap-3">
          {rifornimenti.map((r) => {
            const veicoloNome = nomeVeicoloById[r.veicolo_id] ?? 'Veicolo';
            const precedente = rifornimenti
              .filter((x) => x.veicolo_id === r.veicolo_id && x.odometro < r.odometro)
              .sort((a, b) => b.odometro - a.odometro)[0];
            const eff = precedente && r.quantita > 0 ? (r.odometro - precedente.odometro) / r.quantita : null;
            return (
              <article key={r.id} className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">{veicoloNome}</p>
                    <p className="text-[#12343b]/70">{r.data}</p>
                    <p>{r.quantita} {r.unita} · {r.prezzo_unitario.toFixed(4)} €/u</p>
                    <p>Costo totale: <strong>{euro.format(r.costo_totale)}</strong></p>
                    <p className="text-[#12343b]/70">Efficienza: {eff ? `${eff.toFixed(2)} ${r.unita === 'kWh' ? 'km/kWh' : 'km/L'}` : 'N/D'}</p>
                  </div>
                  <div className="space-y-2">
                    <button className="rounded-xl border border-[#2d545e] px-3 py-2 text-sm font-semibold text-[#2d545e]" onClick={() => void updateRifornimentoCosto(r.id, r.costo_totale)}>Modifica</button>
                    <button className="block rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => void deleteItem('rifornimenti', r.id)}>Elimina</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="spese" className="space-y-3">
        <h2 className="text-xl font-semibold text-[#12343b]">Spese</h2>
        <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
          <form onSubmit={addSpesa} className="grid gap-3 sm:grid-cols-2">
            <select className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" value={sForm.veicolo_id} onChange={(e) => setSForm({ ...sForm, veicolo_id: e.target.value })} required><option value="">Veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="date" value={sForm.data} onChange={(e) => setSForm({ ...sForm, data: e.target.value })} required />
            <select className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" value={sForm.categoria} onChange={(e) => setSForm({ ...sForm, categoria: e.target.value })}>{categorieSpesa.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" placeholder="Descrizione" value={sForm.descrizione} onChange={(e) => setSForm({ ...sForm, descrizione: e.target.value })} />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="number" step="0.01" placeholder="Importo" value={sForm.importo} onChange={(e) => setSForm({ ...sForm, importo: e.target.value })} required />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" type="number" placeholder="Odometro (opzionale)" value={sForm.odometro} onChange={(e) => setSForm({ ...sForm, odometro: e.target.value })} />
            <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382] sm:col-span-2" placeholder="Note" value={sForm.note} onChange={(e) => setSForm({ ...sForm, note: e.target.value })} />
            <button className="rounded-xl bg-[#2d545e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12343b] sm:col-span-2 sm:w-fit" type="submit">Salva spesa</button>
          </form>
        </div>
        <div className="grid gap-3">
          {spese.map((s) => (
            <article key={s.id} className="rounded-2xl border border-[#c89666] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{s.categoria || 'altro'} · {nomeVeicoloById[s.veicolo_id] ?? 'Veicolo'}</p>
                  <p className="text-[#12343b]/70">{s.data}</p>
                  <p>Importo: <strong>{euro.format(s.importo)}</strong></p>
                </div>
                <div className="space-y-2">
                  <button className="rounded-xl border border-[#2d545e] px-3 py-2 text-sm font-semibold text-[#2d545e]" onClick={() => void updateSpesaImporto(s.id, s.importo)}>Modifica</button>
                  <button className="block rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => void deleteItem('spese', s.id)}>Elimina</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="report" className="space-y-3">
        <h2 className="text-xl font-semibold text-[#12343b]">Report</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">Costo totale per veicolo</h3>
            <div className="space-y-2">{reportData.perVeicolo.map(([nome, valore]) => <div key={nome}><div className="mb-1 flex justify-between text-sm"><span>{nome}</span><span>{euro.format(valore)}</span></div><div className="h-2 rounded bg-[#e1b382]/30"><div className="h-2 rounded bg-[#2d545e]" style={{ width: `${Math.max(6, (valore / reportData.maxVeicolo) * 100)}%` }} /></div></div>)}</div>
          </div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">Costo totale per categoria</h3>
            <div className="space-y-2">{reportData.perCategoria.map(([categoria, valore]) => <div key={categoria}><div className="mb-1 flex justify-between text-sm"><span>{categoria}</span><span>{euro.format(valore)}</span></div><div className="h-2 rounded bg-[#e1b382]/30"><div className="h-2 rounded bg-[#2d545e]" style={{ width: `${Math.max(6, (valore / reportData.maxCategoria) * 100)}%` }} /></div></div>)}</div>
          </div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">Totali mensili</h3>
            <div className="space-y-2">{reportData.perMese.map(([mese, valore]) => <div key={mese}><div className="mb-1 flex justify-between text-sm"><span>{mese}</span><span>{euro.format(valore)}</span></div><div className="h-2 rounded bg-[#e1b382]/30"><div className="h-2 rounded bg-[#2d545e]" style={{ width: `${Math.max(6, (valore / reportData.maxMese) * 100)}%` }} /></div></div>)}</div>
          </div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">Efficienza media per veicolo</h3>
            <div className="space-y-2 text-sm">{dashboard.efficienze.map((e) => <div key={e.veicolo} className="flex items-center justify-between rounded-xl border border-[#c89666] px-3 py-2"><span>{e.veicolo}</span><span className="font-semibold">{e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'N/D'}</span></div>)}</div>
          </div>
        </div>
      </section>

      <section id="veicoli" className="space-y-3">
        <h2 className="text-xl font-semibold text-[#12343b]">Veicoli</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">Nuovo veicolo</h3>
            <form onSubmit={addVeicolo} className="grid gap-3 sm:grid-cols-2">
              <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" placeholder="Nome*" value={vForm.nome} onChange={(e) => setVForm({ ...vForm, nome: e.target.value })} required />
              <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" placeholder="Marca" value={vForm.marca} onChange={(e) => setVForm({ ...vForm, marca: e.target.value })} />
              <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" placeholder="Modello" value={vForm.modello} onChange={(e) => setVForm({ ...vForm, modello: e.target.value })} />
              <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" placeholder="Odometro iniziale" type="number" value={vForm.odometro_iniziale} onChange={(e) => setVForm({ ...vForm, odometro_iniziale: e.target.value })} />
              <select className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" value={vForm.tipo_veicolo} onChange={(e) => setVForm({ ...vForm, tipo_veicolo: e.target.value })}><option value="auto">Auto</option><option value="moto">Moto</option></select>
              <select className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" value={vForm.tipo_energia} onChange={(e) => setVForm({ ...vForm, tipo_energia: e.target.value })}><option value="benzina">Benzina</option><option value="diesel">Diesel</option><option value="elettrico">Elettrico</option></select>
              <select className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382]" value={vForm.unita_default} onChange={(e) => setVForm({ ...vForm, unita_default: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
              <input className="w-full rounded-xl border border-[#c89666] px-3 py-2 text-sm focus:border-[#c89666] focus:outline-none focus:ring-2 focus:ring-[#e1b382] sm:col-span-2" placeholder="Note" value={vForm.note} onChange={(e) => setVForm({ ...vForm, note: e.target.value })} />
              <button className="rounded-xl bg-[#2d545e] px-4 py-2 text-sm font-semibold text-white hover:bg-[#12343b] sm:col-span-2 sm:w-fit" type="submit">Salva veicolo</button>
            </form>
          </div>
          <div className="rounded-2xl border border-[#c89666] bg-white p-5 shadow-sm">
            <h3 className="mb-3 font-semibold">Elenco veicoli</h3>
            <ul className="space-y-2">{veicoli.map((v) => <li key={v.id} className="rounded-xl border border-[#c89666] p-3"><div className="flex items-start justify-between gap-2"><span className="text-sm font-semibold text-[#2d545e]">{v.nome}</span><button className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => void deleteItem('veicoli', v.id)}>Elimina</button></div><button className="mt-2 rounded-xl border border-[#2d545e] px-3 py-2 text-sm font-semibold text-[#2d545e]" onClick={() => void updateVeicoloNome(v.id, v.nome)}>Modifica</button></li>)}</ul>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}

export default App;
