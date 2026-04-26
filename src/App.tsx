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

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const initialVForm = { nome: '', marca: '', modello: '', tipo_veicolo: 'auto', tipo_energia: 'benzina', unita_default: 'L', odometro_iniziale: '0', data_acquisto: '', km_iniziali: '', note: '' };
const initialRForm = { veicolo_id: '', data: '', odometro: '', quantita: '', unita: 'L', prezzo_unitario: '', costo_totale: '', fornitore: '', note: '' };
const initialSForm = { veicolo_id: '', data: '', categoria: 'manutenzione', descrizione: '', importo: '', odometro: '', note: '' };

const sortByOdometer = (items: Rifornimento[]) => [...items].sort((a, b) => a.odometro - b.odometro);
const sumRifornimenti = (items: Rifornimento[]) => items.reduce((acc, item) => acc + item.costo_totale, 0);
const sumSpese = (items: Spesa[]) => items.reduce((acc, item) => acc + item.importo, 0);

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);
  const [rifornimenti, setRifornimenti] = useState<Rifornimento[]>([]);
  const [spese, setSpese] = useState<Spesa[]>([]);

  const [vForm, setVForm] = useState(initialVForm);
  const [editingVeicoloId, setEditingVeicoloId] = useState<string | null>(null);
  const [rForm, setRForm] = useState(initialRForm);
  const [sForm, setSForm] = useState(initialSForm);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) void loadData();
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

  async function saveVeicolo(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!vForm.nome.trim()) return setError('Nome veicolo obbligatorio');
    if (Number.isNaN(Number(vForm.odometro_iniziale))) return setError('Odometro non valido');
    if (vForm.km_iniziali.trim() !== '' && Number.isNaN(Number(vForm.km_iniziali))) return setError('Km iniziali non validi');

    const veicoloPayload = {
      nome: vForm.nome.trim(),
      marca: vForm.marca.trim() || null,
      modello: vForm.modello.trim() || null,
      tipo_veicolo: vForm.tipo_veicolo,
      tipo_energia: vForm.tipo_energia,
      unita_default: vForm.unita_default,
      odometro_iniziale: Number(vForm.odometro_iniziale),
      data_acquisto: vForm.data_acquisto || null,
      km_iniziali: vForm.km_iniziali.trim() === '' ? null : Number(vForm.km_iniziali),
      note: vForm.note.trim() || null
    };

    const query = editingVeicoloId
      ? supabase.from('veicoli').update(veicoloPayload).eq('id', editingVeicoloId)
      : supabase.from('veicoli').insert([{ ...veicoloPayload, user_id: session?.user.id }]);
    const { error: saveError } = await query;
    if (saveError) return setError(saveError.message);

    setVForm(initialVForm);
    setEditingVeicoloId(null);
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

  function startEditVeicolo(id: string) {
    const veicolo = veicoli.find((v) => v.id === id);
    if (!veicolo) return;
    setEditingVeicoloId(id);
    setVForm({
      nome: veicolo.nome ?? '',
      marca: veicolo.marca ?? '',
      modello: veicolo.modello ?? '',
      tipo_veicolo: veicolo.tipo_veicolo ?? 'auto',
      tipo_energia: veicolo.tipo_energia ?? 'benzina',
      unita_default: veicolo.unita_default ?? 'L',
      odometro_iniziale: String(veicolo.odometro_iniziale ?? 0),
      data_acquisto: veicolo.data_acquisto ?? '',
      km_iniziali: veicolo.km_iniziali === null || veicolo.km_iniziali === undefined ? '' : String(veicolo.km_iniziali),
      note: veicolo.note ?? ''
    });
  }

  function cancelEditVeicolo() {
    setEditingVeicoloId(null);
    setVForm(initialVForm);
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
      <main className="min-h-screen app-page">
        <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
          <header className="space-y-1">
            <h1 className="text-3xl font-bold">Ma quanto mi costi?!</h1>
            <p className="text-sm text-[var(--text-secondary)]">Costi, rifornimenti e report dei tuoi veicoli</p>
          </header>
          <section className="app-card mx-auto w-full max-w-md shadow-sm">
            <h2 className="mb-3 text-xl font-semibold">Accesso</h2>
            <form onSubmit={login} className="space-y-3">
              <input className="field-default" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <input className="field-default" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button className="btn-primary w-full" type="submit">Accedi</button>
            </form>
            {error && <p className="mt-3 text-sm app-button-danger rounded-xl p-2">{error}</p>}
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen app-page">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <header className="app-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Ma quanto mi costi?!</h1>
              <p className="text-sm text-[var(--text-secondary)]">Costi, rifornimenti e report dei tuoi veicoli</p>
            </div>
            <button className="app-button-primary rounded-xl px-4 py-2 text-sm" onClick={logout}>Logout</button>
          </div>
          <nav className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <a href="#dashboard" className="app-nav-link app-nav-link-active rounded-xl px-3 py-2 text-center font-semibold">Dashboard</a>
            <a href="#rifornimenti" className="app-nav-link rounded-xl px-3 py-2 text-center font-semibold">Rifornimenti</a>
            <a href="#spese" className="app-nav-link rounded-xl px-3 py-2 text-center font-semibold">Spese</a>
            <a href="#report" className="app-nav-link rounded-xl px-3 py-2 text-center font-semibold">Report</a>
            <a href="#veicoli" className="app-nav-link rounded-xl px-3 py-2 text-center font-semibold">Veicoli</a>
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
          isEditing={Boolean(editingVeicoloId)}
          onSubmit={saveVeicolo}
          onFormSet={setVForm}
          onCancelEdit={cancelEditVeicolo}
          onDelete={async (id) => deleteItem('veicoli', id)}
          onEdit={startEditVeicolo}
        />
      </div>
    </main>
  );
}

export default App;
