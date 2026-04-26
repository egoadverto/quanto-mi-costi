import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard';
import Report from './components/Report';
import Rifornimenti from './components/Rifornimenti';
import Spese from './components/Spese';
import Veicoli from './components/Veicoli';
import { supabase } from './supabaseClient';
import { calculateDashboard, calculateReport, calculateRifornimentoForm, RifornimentoForm, Rifornimento, Spesa, Veicolo } from './utils/calculations';

const categorieSpesa = ['assicurazione','bollo','manutenzione','tagliando','gomme','revisione','accessori','parcheggio','pedaggi','lavaggio','altro'];

const initialVForm = { nome: '', marca: '', modello: '', tipo_veicolo: 'auto', tipo_energia: 'benzina', unita_default: 'L', odometro_iniziale: '0', note: '' };
const initialRForm: RifornimentoForm = { veicolo_id: '', data: '', odometro: '', quantita: '', unita: 'L', prezzo_unitario: '', costo_totale: '', fornitore: '', note: '' };
const initialSForm = { veicolo_id: '', data: '', categoria: 'manutenzione', descrizione: '', importo: '', odometro: '', note: '' };

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);
  const [rifornimenti, setRifornimenti] = useState<Rifornimento[]>([]);
  const [spese, setSpese] = useState<Spesa[]>([]);

  const [vForm, setVForm] = useState(initialVForm);
  const [rForm, setRForm] = useState(initialRForm);
  const [sForm, setSForm] = useState(initialSForm);

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
    setVForm(initialVForm);
    await loadData();
  }

  async function addRifornimento(e: FormEvent) {
    e.preventDefault();
    if (Number(rForm.quantita) <= 0) return setError('Quantità deve essere > 0');
    if (Number(rForm.prezzo_unitario) < 0 || Number(rForm.costo_totale) < 0) return setError('Prezzi non validi');
    if (Number.isNaN(Number(rForm.odometro))) return setError('Odometro non valido');
    const { error: insertError } = await supabase.from('rifornimenti').insert([{ ...rForm, user_id: session?.user.id, odometro: Number(rForm.odometro), quantita: Number(rForm.quantita), prezzo_unitario: Number(rForm.prezzo_unitario), costo_totale: Number(rForm.costo_totale) }]);
    if (insertError) return setError(insertError.message);
    setRForm(initialRForm);
    await loadData();
  }

  async function addSpesa(e: FormEvent) {
    e.preventDefault();
    if (Number(sForm.importo) < 0) return setError('Importo non valido');
    const odometro = sForm.odometro === '' ? null : Number(sForm.odometro);
    if (odometro !== null && Number.isNaN(odometro)) return setError('Odometro non valido');
    const { error: insertError } = await supabase.from('spese').insert([{ ...sForm, user_id: session?.user.id, importo: Number(sForm.importo), odometro }]);
    if (insertError) return setError(insertError.message);
    setSForm(initialSForm);
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

  function updateRForm(field: keyof RifornimentoForm, value: string) {
    setRForm((currentForm) => calculateRifornimentoForm(currentForm, field, value));
  }

  const dashboard = useMemo(() => calculateDashboard(veicoli, rifornimenti, spese), [veicoli, rifornimenti, spese]);
  const nomeVeicoloById = useMemo(() => Object.fromEntries(veicoli.map((v) => [v.id, v.nome])), [veicoli]);
  const reportData = useMemo(() => calculateReport(veicoli, rifornimenti, spese, nomeVeicoloById), [nomeVeicoloById, rifornimenti, spese, veicoli]);

  if (!session) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold">Ma quanto mi costi?!</h1>
            <p className="text-sm text-slate-600">Costi, rifornimenti e report dei tuoi veicoli</p>
          </header>
          <section className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Accesso</h2>
            <form onSubmit={login} className="space-y-3">
              <input className="field-default" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="field-default" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button className="btn-primary w-full" type="submit">Accedi</button>
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

        <Dashboard dashboard={dashboard} />
        <Rifornimenti
          veicoli={veicoli}
          rifornimenti={rifornimenti}
          nomeVeicoloById={nomeVeicoloById}
          form={rForm}
          onSubmit={addRifornimento}
          onFormChange={updateRForm}
          onQuickSet={setRForm}
          onUpdateCosto={updateRifornimentoCosto}
          onDelete={async (id) => deleteItem('rifornimenti', id)}
        />
        <Spese
          veicoli={veicoli}
          spese={spese}
          nomeVeicoloById={nomeVeicoloById}
          categorieSpesa={categorieSpesa}
          form={sForm}
          onSubmit={addSpesa}
          onFormSet={setSForm}
          onUpdateImporto={updateSpesaImporto}
          onDelete={async (id) => deleteItem('spese', id)}
        />
        <Report reportData={reportData} efficienze={dashboard.efficienze} />
        <Veicoli
          veicoli={veicoli}
          form={vForm}
          onSubmit={addVeicolo}
          onFormSet={setVForm}
          onDelete={async (id) => deleteItem('veicoli', id)}
          onUpdateNome={updateVeicoloNome}
        />
      </div>
    </main>
  );
}

export default App;
