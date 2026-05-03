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

const initialVForm = { nome: '', marca: '', modello: '', tipo_veicolo: 'auto', tipo_energia: 'benzina', unita_default: 'L', odometro_iniziale: '0', data_acquisto: '', note: '' };
const initialRForm = { veicolo_id: '', data: '', odometro: '', quantita: '', unita: 'L', prezzo_unitario: '', costo_totale: '', fornitore: '', note: '' };
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
  const [editingVeicoloId, setEditingVeicoloId] = useState<string | null>(null);
  const [rForm, setRForm] = useState(initialRForm);
  const [sForm, setSForm] = useState(initialSForm);
const [currentPage, setCurrentPage] = useState<'riepilogo' | 'inserimento' | 'storico'>('riepilogo');
  const [storicoVeicoloId, setStoricoVeicoloId] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

const [filtroDataInizio, setFiltroDataInizio] = useState('');
  const [filtroDataFine, setFiltroDataFine] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  const [importPreview, setImportPreview] = useState<{veicoli: number; rifornimenti: number; spese: number} | null>(null);
  const [importResult, setImportResult] = useState<{veicoli: number; rifornimenti: number; spese: number; saltati: string[]} | null>(null);
  const [importConfirm, setImportConfirm] = useState(false);
  const [pendingBackup, setPendingBackup] = useState<{versione: number; veicoli: any[]; rifornimenti: any[]; spese: any[]} | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) void loadData();
  }, [session]);

  useEffect(() => {
    const readPageFromHash = () => {
      const page = window.location.hash.replace('#', '');
      if (page === 'inserimento' || page === 'storico' || page === 'riepilogo') setCurrentPage(page);
      else setCurrentPage('riepilogo');
      setMobileMenuOpen(false);
    };

    readPageFromHash();
    window.addEventListener('hashchange', readPageFromHash);
    return () => window.removeEventListener('hashchange', readPageFromHash);
  }, []);

  async function loadData() {
    const [v, r, s] = await Promise.all([
      supabase.from('veicoli').select('*').order('data_creazione', { ascending: false }),
      supabase.from('rifornimenti').select('*').order('data', { ascending: false }),
      supabase.from('spese').select('*').order('data', { ascending: false })
    ]);
    const loadError = v.error || r.error || s.error;
    if (loadError) {
      setError(loadError.message);
      return;
    }
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

    const veicoloPayload = {
      nome: vForm.nome.trim(),
      marca: vForm.marca.trim() || null,
      modello: vForm.modello.trim() || null,
      tipo_veicolo: vForm.tipo_veicolo,
      tipo_energia: vForm.tipo_energia,
      unita_default: vForm.unita_default,
      odometro_iniziale: Number(vForm.odometro_iniziale),
      data_acquisto: vForm.data_acquisto || null,
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
    const { error: deleteError } = await supabase.from(tabella).delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
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
      note: veicolo.note ?? ''
    });
  }

  function cancelEditVeicolo() {
    setEditingVeicoloId(null);
    setVForm(initialVForm);
  }

  async function updateRifornimentoFull(id: string, data: { veicolo_id: string; data: string; odometro: number; quantita: number; unita: string; prezzo_unitario: number; costo_totale: number; fornitore: string | null; note: string | null }) {
    const { error } = await supabase.from('rifornimenti').update(data).eq('id', id);
    if (error) {
      setError(error.message);
      return false;
    }
    await loadData();
    return true;
  }

  async function updateSpesaFull(id: string, data: { veicolo_id: string; data: string; categoria: string; descrizione: string | null; importo: number; odometro: number | null; note: string | null }) {
    const { error } = await supabase.from('spese').update(data).eq('id', id);
    if (error) {
      setError(error.message);
      return false;
    }
    await loadData();
    return true;
  }

  function updateRForm(field: keyof RifornimentoForm, value: string) {
    setRForm((currentForm) => calculateRifornimentoForm(currentForm, field, value));
  }

  function escapeCSV(value: string | null | undefined): string {
    const str = value ?? '';
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function downloadCSV(content: string, filename: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportVeicoli() {
    const header = 'nome;marca;modello;tipo_veicolo;tipo_energia;unita_default;odometro_iniziale;data_acquisto;note';
    const rows = veicoli.map(v =>
      [escapeCSV(v.nome), escapeCSV(v.marca), escapeCSV(v.modello), escapeCSV(v.tipo_veicolo), escapeCSV(v.tipo_energia), escapeCSV(v.unita_default), v.odometro_iniziale ?? '', v.data_acquisto ?? '', escapeCSV(v.note)].join(';')
    );
    downloadCSV([header, ...rows].join('\n'), 'veicoli.csv');
  }

  function exportRifornimenti() {
    const header = 'veicolo_nome;data;odometro;quantita;unita;prezzo_unitario;costo_totale;fornitore;note';
    const rows = rifornimenti.map(r =>
      [escapeCSV(nomeVeicoloById[r.veicolo_id] || ''), r.data, r.odometro, r.quantita, r.unita ?? '', r.prezzo_unitario, r.costo_totale, escapeCSV(r.fornitore), escapeCSV(r.note)].join(';')
    );
    downloadCSV([header, ...rows].join('\n'), 'rifornimenti.csv');
  }

  function exportSpese() {
    const header = 'veicolo_nome;data;categoria;descrizione;importo;odometro;note';
    const rows = spese.map(s =>
      [escapeCSV(nomeVeicoloById[s.veicolo_id] || ''), s.data, escapeCSV(s.categoria), escapeCSV(s.descrizione), s.importo, s.odometro ?? '', escapeCSV(s.note)].join(';')
    );
    downloadCSV([header, ...rows].join('\n'), 'spese.csv');
  }

  function exportBackup() {
    const backup = {
      versione: 1,
      dataEsportazione: new Date().toISOString(),
      veicoli: veicoli.map(v => ({
        nome: v.nome,
        marca: v.marca,
        modello: v.modello,
        tipo_veicolo: v.tipo_veicolo,
        tipo_energia: v.tipo_energia,
        unita_default: v.unita_default,
        odometro_iniziale: v.odometro_iniziale,
        data_acquisto: v.data_acquisto,
        note: v.note
      })),
      rifornimenti: rifornimenti.map(r => ({
        veicolo_nome: nomeVeicoloById[r.veicolo_id] || '',
        data: r.data,
        odometro: r.odometro,
        quantita: r.quantita,
        unita: r.unita,
        prezzo_unitario: r.prezzo_unitario,
        costo_totale: r.costo_totale,
        fornitore: r.fornitore,
        note: r.note
      })),
      spese: spese.map(s => ({
        veicolo_nome: nomeVeicoloById[s.veicolo_id] || '',
        data: s.data,
        categoria: s.categoria,
        descrizione: s.descrizione,
        importo: s.importo,
        odometro: s.odometro,
        note: s.note
      }))
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const date = new Date().toISOString().slice(0, 10);
    link.download = `quanto-mi-costi-backup-${date}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleBackupFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      setError('File non valido. Usa un file .json');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (!data.versione || data.versione !== 1) {
          setError('Versione backup non valida');
          return;
        }
        if (!Array.isArray(data.veicoli) || !Array.isArray(data.rifornimenti) || !Array.isArray(data.spese)) {
          setError('Struttura backup non valida');
          return;
        }
        setImportPreview({
          veicoli: data.veicoli.length,
          rifornimenti: data.rifornimenti.length,
          spese: data.spese.length
        });
        setImportResult(null);
        setImportConfirm(true);
        setPendingBackup(data);
      } catch {
        setError('Errore lettura file JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function confirmImport() {
    if (!pendingBackup || !session?.user.id) return;
    const data = pendingBackup;
    const errors: string[] = [];
    let importedVeicoli = 0;
    let importedRifornimenti = 0;
    let importedSpese = 0;

    const veicoloNameToId: Record<string, string> = {};
    for (const v of data.veicoli) {
      if (!v.nome) { errors.push('Veicolo senza nome, saltato'); continue; }
      const veicoloExists = veicoli.some(vx => vx.nome === v.nome);
      if (veicoloExists) { errors.push(`Veicolo "${v.nome}" già esistente, saltato`); continue; }
      const { data: inserted, error } = await supabase.from('veicoli').insert({
        nome: v.nome,
        marca: v.marca || null,
        modello: v.modello || null,
        tipo_veicolo: v.tipo_veicolo || 'auto',
        tipo_energia: v.tipo_energia || 'benzina',
        unita_default: v.unita_default || 'L',
        odometro_iniziale: v.odometro_iniziale || 0,
        data_acquisto: v.data_acquisto || null,
        note: v.note || null,
        user_id: session.user.id
      }).select().single();
      if (error) { errors.push(`Errore inserimento veicolo "${v.nome}"`); continue; }
      if (inserted?.id) veicoloNameToId[v.nome] = inserted.id;
      importedVeicoli++;
    }

    for (const r of data.rifornimenti) {
      if (!r.veicolo_nome || !r.data || r.quantita == null || r.costo_totale == null) {
        errors.push('Rifornimento incompleto, saltato'); continue;
      }
      const vid = veicoloNameToId[r.veicolo_nome];
      if (!vid) {
        const existingVid = veicoli.find(v => v.nome === r.veicolo_nome)?.id;
        if (existingVid) {
          veicoloNameToId[r.veicolo_nome] = existingVid;
        } else {
          errors.push(`Rifornimento per veicolo "${r.veicolo_nome}" non trovato, saltato`); continue;
        }
      }
      const { error } = await supabase.from('rifornimenti').insert({
        veicolo_id: veicoloNameToId[r.veicolo_nome],
        data: r.data,
        odometro: Number(r.odometro) || 0,
        quantita: Number(r.quantita),
        unita: r.unita || 'L',
        prezzo_unitario: Number(r.prezzo_unitario) || 0,
        costo_totale: Number(r.costo_totale),
        fornitore: r.fornitore || null,
        note: r.note || null,
        user_id: session.user.id
      });
      if (error) { errors.push(`Errore inserimento rifornimento: ${r.data}`); continue; }
      importedRifornimenti++;
    }

    for (const s of data.spese) {
      if (!s.veicolo_nome || !s.data || s.importo == null) {
        errors.push('Spesa incompleta, saltata'); continue;
      }
      const vid = veicoloNameToId[s.veicolo_nome];
      if (!vid) {
        const existingVid = veicoli.find(v => v.nome === s.veicolo_nome)?.id;
        if (existingVid) {
          veicoloNameToId[s.veicolo_nome] = existingVid;
        } else {
          errors.push(`Spesa per veicolo "${s.veicolo_nome}" non trovato, saltata`); continue;
        }
      }
      const { error } = await supabase.from('spese').insert({
        veicolo_id: veicoloNameToId[s.veicolo_nome],
        data: s.data,
        categoria: s.categoria || 'altro',
        descrizione: s.descrizione || null,
        importo: Number(s.importo),
        odometro: s.odometro ? Number(s.odometro) : null,
        note: s.note || null,
        user_id: session.user.id
      });
      if (error) { errors.push(`Errore inserimento spesa: ${s.data}`); continue; }
      importedSpese++;
    }

    setImportResult({ veicoli: importedVeicoli, rifornimenti: importedRifornimenti, spese: importedSpese, saltati: errors });
    setImportConfirm(false);
    setPendingBackup(null);
    await loadData();
  }

  function cancelImport() {
    setImportConfirm(false);
    setImportPreview(null);
    setPendingBackup(null);
  }

  const dashboard = useMemo(() => calculateDashboard(veicoli, rifornimenti, spese), [veicoli, rifornimenti, spese]);
  const nomeVeicoloById = useMemo(() => Object.fromEntries(veicoli.map((v) => [v.id, v.nome])), [veicoli]);
  const reportData = useMemo(() => calculateReport(veicoli, rifornimenti, spese, nomeVeicoloById), [nomeVeicoloById, rifornimenti, spese, veicoli]);
const rifornimentiFiltrati = useMemo(() => {
    let result = rifornimenti;
    if (storicoVeicoloId) result = result.filter((r) => r.veicolo_id === storicoVeicoloId);
    if (filtroDataInizio) result = result.filter((r) => r.data >= filtroDataInizio);
    if (filtroDataFine) result = result.filter((r) => r.data <= filtroDataFine);
    return result;
  }, [rifornimenti, storicoVeicoloId, filtroDataInizio, filtroDataFine]);
  const speseFiltrate = useMemo(() => {
    let result = spese;
    if (storicoVeicoloId) result = result.filter((s) => s.veicolo_id === storicoVeicoloId);
    if (filtroDataInizio) result = result.filter((s) => s.data >= filtroDataInizio);
    if (filtroDataFine) result = result.filter((s) => s.data <= filtroDataFine);
    if (filtroCategoria) result = result.filter((s) => s.categoria === filtroCategoria);
    return result;
  }, [spese, storicoVeicoloId, filtroDataInizio, filtroDataFine, filtroCategoria]);

  const reportDataFiltrato = useMemo(() => calculateReport(veicoli, rifornimentiFiltrati, speseFiltrate, nomeVeicoloById), [veicoli, rifornimentiFiltrati, speseFiltrate, nomeVeicoloById]);

  function resetFiltri() {
    setStoricoVeicoloId('');
    setFiltroDataInizio('');
    setFiltroDataFine('');
    setFiltroCategoria('');
  }

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
            <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
              <button
                className="app-nav-link rounded-xl px-3 py-2 text-sm font-semibold sm:hidden"
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-label="Apri menu pagine"
                aria-expanded={mobileMenuOpen}
              >
                ☰ Menu
              </button>
              <button className="app-button-primary rounded-xl px-4 py-2 text-sm" onClick={logout}>Logout</button>
            </div>
          </div>
          <nav className={`mt-4 ${mobileMenuOpen ? 'block' : 'hidden'} text-sm sm:block`}>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <a href="#riepilogo" className={`app-nav-link rounded-xl px-3 py-2 text-center font-semibold ${currentPage === 'riepilogo' ? 'app-nav-link-active' : ''}`}>Riepilogo</a>
            <a href="#inserimento" className={`app-nav-link rounded-xl px-3 py-2 text-center font-semibold ${currentPage === 'inserimento' ? 'app-nav-link-active' : ''}`}>Inserimento dati</a>
            <a href="#storico" className={`app-nav-link rounded-xl px-3 py-2 text-center font-semibold ${currentPage === 'storico' ? 'app-nav-link-active' : ''}`}>Riepilogo inserimenti</a>
            </div>
          </nav>
        </header>

        {error && <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        {currentPage === 'riepilogo' && <>
          <Dashboard dashboard={dashboard} />
          <Report reportData={reportData} efficienze={dashboard.efficienze} />
        </>}

        {currentPage === 'inserimento' && <>
          <Rifornimenti
            veicoli={veicoli}
            rifornimenti={rifornimenti}
            nomeVeicoloById={nomeVeicoloById}
            form={rForm}
            showForm
            showList={false}
            onSubmit={addRifornimento}
            onFormChange={updateRForm}
            onQuickSet={setRForm}
            onUpdateFull={updateRifornimentoFull}
            onDelete={async (id) => deleteItem('rifornimenti', id)}
          />
          <Spese
            veicoli={veicoli}
            spese={spese}
            nomeVeicoloById={nomeVeicoloById}
            categorieSpesa={categorieSpesa}
            form={sForm}
            showForm
            showList={false}
            onSubmit={addSpesa}
            onFormSet={setSForm}
            onUpdateFull={updateSpesaFull}
            onDelete={async (id) => deleteItem('spese', id)}
          />
<Veicoli
            veicoli={veicoli}
            form={vForm}
            isEditing={Boolean(editingVeicoloId)}
            showForm
            showList
            onSubmit={saveVeicolo}
            onFormSet={setVForm}
            onCancelEdit={cancelEditVeicolo}
            onDelete={async (id) => deleteItem('veicoli', id)}
            onEdit={startEditVeicolo}
          />
          <section className="panel-highlight p-5 space-y-4">
            <h2 className="text-xl font-semibold">Backup e ripristino</h2>
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary" onClick={exportBackup}>Esporta backup JSON</button>
              <label className="btn-secondary cursor-pointer">
                <span>Ripristina da backup</span>
                <input type="file" accept=".json" className="hidden" onChange={handleBackupFile} />
              </label>
            </div>
            {importPreview && importConfirm && (
              <div className="space-y-2 border-t border-[var(--border)] pt-3">
                <p className="text-sm font-medium">Anteprima backup:</p>
                <p className="text-sm text-[var(--text-secondary)]">{importPreview.veicoli} veicoli, {importPreview.rifornimenti} rifornimenti, {importPreview.spese} spese</p>
                <div className="flex gap-2">
                  <button className="btn-primary text-sm" onClick={confirmImport}>Conferma ripristino</button>
                  <button className="btn-secondary text-sm" onClick={cancelImport}>Annulla</button>
                </div>
              </div>
            )}
            {importResult && (
              <div className="space-y-2 border-t border-[var(--border)] pt-3">
                <p className="text-sm font-medium">Ripristino completato:</p>
                <p className="text-sm text-[var(--text-secondary)]">{importResult.veicoli} veicoli importati</p>
                <p className="text-sm text-[var(--text-secondary)]">{importResult.rifornimenti} rifornimenti importati</p>
                <p className="text-sm text-[var(--text-secondary)]">{importResult.spese} spese importate</p>
                {importResult.saltati.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-[var(--danger)]">Record saltati ({importResult.saltati.length}):</p>
                    <ul className="text-xs text-[var(--text-secondary)] max-h-24 overflow-y-auto">
                      {importResult.saltati.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                  </div>
                )}
                <button className="btn-secondary text-sm" onClick={() => setImportResult(null)}>Chiudi</button>
              </div>
            )}
          </section>
          <section className="panel-highlight p-5 space-y-4">
            <h2 className="text-xl font-semibold">Esportazione CSV</h2>
            <div className="flex flex-wrap gap-3">
              <button className="btn-secondary" onClick={exportVeicoli}>Esporta veicoli CSV</button>
              <button className="btn-secondary" onClick={exportRifornimenti}>Esporta rifornimenti CSV</button>
              <button className="btn-secondary" onClick={exportSpese}>Esporta spese CSV</button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">Import CSV non ancora implementato</p>
          </section>
        </>}

{currentPage === 'storico' && <>
          <section className="panel-highlight p-5 space-y-4">
            <h2 className="text-xl font-semibold">Filtri</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Veicolo</span>
                <select className="app-input" value={storicoVeicoloId} onChange={(e) => setStoricoVeicoloId(e.target.value)}>
                  <option value="">Tutti i veicoli</option>
                  {veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Data inizio</span>
                <input className="app-input" type="date" value={filtroDataInizio} onChange={(e) => setFiltroDataInizio(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Data fine</span>
                <input className="app-input" type="date" value={filtroDataFine} onChange={(e) => setFiltroDataFine(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-[var(--text-secondary)]">Categoria</span>
                <select className="app-input" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                  <option value="">Tutte le categorie</option>
                  {categorieSpesa.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button className="btn-secondary text-sm" onClick={resetFiltri}>Reset filtri</button>
          </section>
          <Report reportData={reportDataFiltrato} efficienze={dashboard.efficienze} />
          <Rifornimenti
            veicoli={veicoli}
            rifornimenti={rifornimentiFiltrati}
            nomeVeicoloById={nomeVeicoloById}
            form={rForm}
            showForm={false}
            showList
            onSubmit={addRifornimento}
            onFormChange={updateRForm}
            onQuickSet={setRForm}
            onUpdateFull={updateRifornimentoFull}
            onDelete={async (id) => deleteItem('rifornimenti', id)}
          />
          <Spese
            veicoli={veicoli}
            spese={speseFiltrate}
            nomeVeicoloById={nomeVeicoloById}
            categorieSpesa={categorieSpesa}
            form={sForm}
            showForm={false}
            showList
            onSubmit={addSpesa}
            onFormSet={setSForm}
            onUpdateFull={updateSpesaFull}
            onDelete={async (id) => deleteItem('spese', id)}
          />
        </>}
      </div>
    </main>
  );
}

export default App;
