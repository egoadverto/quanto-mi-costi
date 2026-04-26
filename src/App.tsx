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

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <header className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Ma quanto mi costi?!</h1>
            <p className="text-sm text-slate-600">App personale per tracciare costi, rifornimenti e spese dei tuoi veicoli.</p>
          </header>
          <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-xl font-semibold">Accedi</h2>
            <form onSubmit={login} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="login-email" className="text-sm font-medium text-slate-700">Email</label>
                <input id="login-email" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="email" placeholder="nome@esempio.it" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <p className="text-xs text-slate-500">Usa l&apos;email collegata al tuo account.</p>
              </div>
              <div className="space-y-1">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label>
                <input id="login-password" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="password" placeholder="Inserisci la tua password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <p className="text-xs text-slate-500">La password non viene mostrata durante la digitazione.</p>
              </div>
              <button className="w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white" type="submit">Accedi</button>
            </form>
          </section>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Ma quanto mi costi?!</h1>
              <p className="text-sm text-slate-600">App personale per tracciare costi, rifornimenti e spese dei tuoi veicoli.</p>
            </div>
            <button className="w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 sm:w-auto" onClick={logout}>Logout</button>
          </div>
        </header>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-700">Totale anno corrente</p><p className="mt-1 text-lg font-semibold">{euro.format(dashboard.totaleAnno)}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-700">Costo medio mensile</p><p className="mt-1 text-lg font-semibold">{euro.format(dashboard.costoMedioMensile)}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-700">Costo/km</p><p className="mt-1 text-lg font-semibold">{dashboard.costoKm ? `${dashboard.costoKm.toFixed(2)} €/km` : 'Dati insufficienti'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-700">Veicolo più costoso</p><p className="mt-1 text-sm">{dashboard.costoPerVeicolo ? `${dashboard.costoPerVeicolo.nome} (${euro.format(dashboard.costoPerVeicolo.totale)})` : 'Dati insufficienti'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-700">Ultima spesa</p><p className="mt-1 text-sm">{dashboard.ultimaSpesa ? `${dashboard.ultimaSpesa.data} - ${euro.format(dashboard.ultimaSpesa.importo)}` : 'Dati insufficienti'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-700">Ultimo rifornimento</p><p className="mt-1 text-sm">{dashboard.ultimoRifornimento ? `${dashboard.ultimoRifornimento.data} - ${euro.format(dashboard.ultimoRifornimento.costo_totale)}` : 'Dati insufficienti'}</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-medium text-slate-700">Efficienza media per veicolo</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {dashboard.efficienze.map((e) => (
                  <li key={e.veicolo}>{e.veicolo}: {e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'Dati insufficienti'} · {e.campioni > 1 ? `Basato su ${e.campioni} rifornimenti` : 'Stima approssimata'}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Rifornimenti / Ricariche</h2>
          <form onSubmit={addRifornimento} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="r-veicolo" className="text-sm font-medium text-slate-700">Veicolo</label>
              <select id="r-veicolo" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={rForm.veicolo_id} onChange={(e) => setRForm({ ...rForm, veicolo_id: e.target.value })} required><option value="">Seleziona veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
              <p className="text-xs text-slate-500">Scegli il mezzo su cui registrare il rifornimento.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="r-data" className="text-sm font-medium text-slate-700">Data</label>
              <input id="r-data" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="date" value={rForm.data} onChange={(e) => setRForm({ ...rForm, data: e.target.value })} required />
              <p className="text-xs text-slate-500">Indica la data del rifornimento o della ricarica.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="r-odometro" className="text-sm font-medium text-slate-700">Odometro</label>
              <input id="r-odometro" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" placeholder="Es. 45200" value={rForm.odometro} onChange={(e) => setRForm({ ...rForm, odometro: e.target.value })} required />
              <p className="text-xs text-slate-500">Valore chilometrico al momento del rifornimento.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="r-quantita" className="text-sm font-medium text-slate-700">Quantità</label>
              <input id="r-quantita" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" step="0.01" placeholder="Es. 35.50" value={rForm.quantita} onChange={(e) => setRForm({ ...rForm, quantita: e.target.value })} required />
              <p className="text-xs text-slate-500">Inserisci litri o kWh acquistati.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="r-unita" className="text-sm font-medium text-slate-700">Unità</label>
              <select id="r-unita" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={rForm.unita} onChange={(e) => setRForm({ ...rForm, unita: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
              <p className="text-xs text-slate-500">Seleziona l&apos;unità di misura usata.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="r-prezzo" className="text-sm font-medium text-slate-700">Prezzo unitario</label>
              <input id="r-prezzo" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" step="0.0001" placeholder="Es. 1.8790" value={rForm.prezzo_unitario} onChange={(e) => setRForm({ ...rForm, prezzo_unitario: e.target.value })} required />
              <p className="text-xs text-slate-500">Prezzo per litro o per kWh.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="r-costo" className="text-sm font-medium text-slate-700">Costo totale</label>
              <input id="r-costo" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" step="0.01" placeholder="Es. 66.70" value={rForm.costo_totale} onChange={(e) => setRForm({ ...rForm, costo_totale: e.target.value })} required />
              <p className="text-xs text-slate-500">Totale speso per questa operazione.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="r-fornitore" className="text-sm font-medium text-slate-700">Fornitore</label>
              <input id="r-fornitore" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Es. ENI / Enel X" value={rForm.fornitore} onChange={(e) => setRForm({ ...rForm, fornitore: e.target.value })} />
              <p className="text-xs text-slate-500">Nome distributore o operatore di ricarica.</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="r-note" className="text-sm font-medium text-slate-700">Note</label>
              <input id="r-note" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Info aggiuntive utili" value={rForm.note} onChange={(e) => setRForm({ ...rForm, note: e.target.value })} />
              <p className="text-xs text-slate-500">Campo opzionale per dettagli extra.</p>
            </div>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-2 sm:w-fit" type="submit">Salva rifornimento</button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Spese</h2>
          <form onSubmit={addSpesa} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label htmlFor="s-veicolo" className="text-sm font-medium text-slate-700">Veicolo</label>
              <select id="s-veicolo" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={sForm.veicolo_id} onChange={(e) => setSForm({ ...sForm, veicolo_id: e.target.value })} required><option value="">Seleziona veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
              <p className="text-xs text-slate-500">Veicolo a cui associare la spesa.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="s-data" className="text-sm font-medium text-slate-700">Data</label>
              <input id="s-data" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="date" value={sForm.data} onChange={(e) => setSForm({ ...sForm, data: e.target.value })} required />
              <p className="text-xs text-slate-500">Quando hai sostenuto la spesa.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="s-categoria" className="text-sm font-medium text-slate-700">Categoria</label>
              <select id="s-categoria" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={sForm.categoria} onChange={(e) => setSForm({ ...sForm, categoria: e.target.value })}>{categorieSpesa.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              <p className="text-xs text-slate-500">Seleziona la tipologia della spesa.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="s-descrizione" className="text-sm font-medium text-slate-700">Descrizione</label>
              <input id="s-descrizione" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Es. Cambio olio motore" value={sForm.descrizione} onChange={(e) => setSForm({ ...sForm, descrizione: e.target.value })} />
              <p className="text-xs text-slate-500">Breve descrizione per riconoscere la voce.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="s-importo" className="text-sm font-medium text-slate-700">Importo</label>
              <input id="s-importo" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" step="0.01" placeholder="Es. 145.00" value={sForm.importo} onChange={(e) => setSForm({ ...sForm, importo: e.target.value })} required />
              <p className="text-xs text-slate-500">Importo totale pagato in euro.</p>
            </div>
            <div className="space-y-1">
              <label htmlFor="s-odometro" className="text-sm font-medium text-slate-700">Odometro</label>
              <input id="s-odometro" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" type="number" placeholder="Es. 46050 (opzionale)" value={sForm.odometro} onChange={(e) => setSForm({ ...sForm, odometro: e.target.value })} />
              <p className="text-xs text-slate-500">Puoi lasciarlo vuoto se non disponibile.</p>
            </div>
            <div className="space-y-1 sm:col-span-2">
              <label htmlFor="s-note" className="text-sm font-medium text-slate-700">Note</label>
              <input id="s-note" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Note extra sulla spesa" value={sForm.note} onChange={(e) => setSForm({ ...sForm, note: e.target.value })} />
              <p className="text-xs text-slate-500">Informazioni aggiuntive opzionali.</p>
            </div>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-2 sm:w-fit" type="submit">Salva spesa</button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Storico dati</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Rifornimenti</h3>
              <ul className="space-y-3">{rifornimenti.map((r) => <li key={r.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><span className="text-sm">{r.data} · {euro.format(r.costo_totale)}</span><button className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => void deleteItem('rifornimenti', r.id)}>Elimina</button></div><button className="mt-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => void updateRifornimentoCosto(r.id, r.costo_totale)}>Modifica</button></li>)}</ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Spese</h3>
              <ul className="space-y-3">{spese.map((s) => <li key={s.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-3"><span className="text-sm">{s.data} · {euro.format(s.importo)}</span><button className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => void deleteItem('spese', s.id)}>Elimina</button></div><button className="mt-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => void updateSpesaImporto(s.id, s.importo)}>Modifica</button></li>)}</ul>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Veicoli</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold">Nuovo veicolo</h3>
              <form onSubmit={addVeicolo} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="v-nome" className="text-sm font-medium text-slate-700">Nome</label>
                  <input id="v-nome" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Es. Panda 1.2" value={vForm.nome} onChange={(e) => setVForm({ ...vForm, nome: e.target.value })} required />
                  <p className="text-xs text-slate-500">Nome identificativo del veicolo.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="v-marca" className="text-sm font-medium text-slate-700">Marca</label>
                  <input id="v-marca" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Es. Fiat" value={vForm.marca} onChange={(e) => setVForm({ ...vForm, marca: e.target.value })} />
                  <p className="text-xs text-slate-500">Produttore del mezzo.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="v-modello" className="text-sm font-medium text-slate-700">Modello</label>
                  <input id="v-modello" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Es. City Life" value={vForm.modello} onChange={(e) => setVForm({ ...vForm, modello: e.target.value })} />
                  <p className="text-xs text-slate-500">Versione o modello del veicolo.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="v-odometro-iniziale" className="text-sm font-medium text-slate-700">Odometro iniziale</label>
                  <input id="v-odometro-iniziale" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Es. 120000" type="number" value={vForm.odometro_iniziale} onChange={(e) => setVForm({ ...vForm, odometro_iniziale: e.target.value })} />
                  <p className="text-xs text-slate-500">Chilometri attuali alla creazione del veicolo.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="v-tipo-veicolo" className="text-sm font-medium text-slate-700">Tipo veicolo</label>
                  <select id="v-tipo-veicolo" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={vForm.tipo_veicolo} onChange={(e) => setVForm({ ...vForm, tipo_veicolo: e.target.value })}><option value="auto">Auto</option><option value="moto">Moto</option></select>
                  <p className="text-xs text-slate-500">Categoria generale del mezzo.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="v-tipo-energia" className="text-sm font-medium text-slate-700">Tipo energia</label>
                  <select id="v-tipo-energia" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={vForm.tipo_energia} onChange={(e) => setVForm({ ...vForm, tipo_energia: e.target.value })}><option value="benzina">Benzina</option><option value="diesel">Diesel</option><option value="elettrico">Elettrico</option></select>
                  <p className="text-xs text-slate-500">Alimentazione principale del veicolo.</p>
                </div>
                <div className="space-y-1">
                  <label htmlFor="v-unita-default" className="text-sm font-medium text-slate-700">Unità predefinita</label>
                  <select id="v-unita-default" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" value={vForm.unita_default} onChange={(e) => setVForm({ ...vForm, unita_default: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
                  <p className="text-xs text-slate-500">Unità usata nei rifornimenti del mezzo.</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label htmlFor="v-note" className="text-sm font-medium text-slate-700">Note</label>
                  <input id="v-note" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" placeholder="Annotazioni opzionali sul veicolo" value={vForm.note} onChange={(e) => setVForm({ ...vForm, note: e.target.value })} />
                  <p className="text-xs text-slate-500">Dettagli extra (allestimento, targa, uso, ...).</p>
                </div>
                <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white sm:col-span-2 sm:w-fit" type="submit">Salva veicolo</button>
              </form>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold">Elenco veicoli</h3>
              <ul className="space-y-3">{veicoli.map((v) => <li key={v.id} className="rounded-xl border border-slate-200 p-3"><div className="flex items-start justify-between gap-2"><span className="text-sm font-medium">{v.nome}</span><button className="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700" onClick={() => void deleteItem('veicoli', v.id)}>Elimina</button></div><button className="mt-2 rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => void updateVeicoloNome(v.id, v.nome)}>Modifica</button></li>)}</ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
