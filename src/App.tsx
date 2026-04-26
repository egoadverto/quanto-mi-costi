import { FormEvent, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

type Veicolo = {
  id: string;
  user_id: string;
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
  user_id: string;
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
  user_id: string;
  veicolo_id: string;
  data: string;
  categoria: string | null;
  descrizione: string | null;
  importo: number;
  odometro: number | null;
  note: string | null;
};

type VeicoloForm = {
  nome: string;
  marca: string;
  modello: string;
  tipo_veicolo: 'auto' | 'moto';
  tipo_energia: 'elettrico' | 'benzina' | 'diesel';
  unita_default: 'kWh' | 'L';
  odometro_iniziale: string;
  note: string;
};

type RifornimentoForm = {
  veicolo_id: string;
  data: string;
  odometro: string;
  quantita: string;
  unita: 'kWh' | 'L';
  prezzo_unitario: string;
  costo_totale: string;
  fornitore: string;
  note: string;
};

type SpesaForm = {
  veicolo_id: string;
  data: string;
  categoria: string;
  descrizione: string;
  importo: string;
  odometro: string;
  note: string;
};

const categorieSpesa = [
  'assicurazione',
  'bollo',
  'manutenzione',
  'tagliando',
  'gomme',
  'revisione',
  'accessori',
  'parcheggio',
  'pedaggi',
  'lavaggio',
  'altro'
] as const;

const veicoloInit: VeicoloForm = {
  nome: '',
  marca: '',
  modello: '',
  tipo_veicolo: 'auto',
  tipo_energia: 'benzina',
  unita_default: 'L',
  odometro_iniziale: '0',
  note: ''
};

const rifornimentoInit: RifornimentoForm = {
  veicolo_id: '',
  data: '',
  odometro: '',
  quantita: '',
  unita: 'L',
  prezzo_unitario: '',
  costo_totale: '',
  fornitore: '',
  note: ''
};

const spesaInit: SpesaForm = {
  veicolo_id: '',
  data: '',
  categoria: 'manutenzione',
  descrizione: '',
  importo: '',
  odometro: '',
  note: ''
};

const eur = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [veicoli, setVeicoli] = useState<Veicolo[]>([]);
  const [rifornimenti, setRifornimenti] = useState<Rifornimento[]>([]);
  const [spese, setSpese] = useState<Spesa[]>([]);

  const [veicoloForm, setVeicoloForm] = useState<VeicoloForm>(veicoloInit);
  const [rifornimentoForm, setRifornimentoForm] = useState<RifornimentoForm>(rifornimentoInit);
  const [spesaForm, setSpesaForm] = useState<SpesaForm>(spesaInit);

  const [editingVeicoloId, setEditingVeicoloId] = useState<string | null>(null);
  const [editingRifornimentoId, setEditingRifornimentoId] = useState<string | null>(null);
  const [editingSpesaId, setEditingSpesaId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_evt, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user.id) {
      void loadData();
    }
  }, [session?.user.id]);

  async function loadData() {
    setLoading(true);
    setError('');
    const [v, r, s] = await Promise.all([
      supabase.from('veicoli').select('*').order('data_creazione', { ascending: false }),
      supabase.from('rifornimenti').select('*').order('data', { ascending: false }),
      supabase.from('spese').select('*').order('data', { ascending: false })
    ]);
    if (v.error || r.error || s.error) {
      setError(v.error?.message || r.error?.message || s.error?.message || 'Errore caricamento dati');
    }
    if (v.data) setVeicoli(v.data as Veicolo[]);
    if (r.data) setRifornimenti(r.data as Rifornimento[]);
    if (s.data) setSpese(s.data as Spesa[]);
    setLoading(false);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setError('');
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) setError(authError.message);
  }

  async function signUp() {
    setError('');
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) setError(signUpError.message);
    else setError('Registrazione avviata. Controlla la tua email per confermare.');
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  function validateVeicolo() {
    if (!veicoloForm.nome.trim()) return 'nome veicolo required';
    if (Number.isNaN(Number(veicoloForm.odometro_iniziale))) return 'odometro numeric';
    return null;
  }

  async function saveVeicolo(e: FormEvent) {
    e.preventDefault();
    const validation = validateVeicolo();
    if (validation) return setError(validation);
    const payload = {
      user_id: session?.user.id,
      nome: veicoloForm.nome.trim(),
      marca: veicoloForm.marca || null,
      modello: veicoloForm.modello || null,
      tipo_veicolo: veicoloForm.tipo_veicolo,
      tipo_energia: veicoloForm.tipo_energia,
      unita_default: veicoloForm.unita_default,
      odometro_iniziale: Number(veicoloForm.odometro_iniziale),
      note: veicoloForm.note || null
    };
    const query = editingVeicoloId
      ? supabase.from('veicoli').update(payload).eq('id', editingVeicoloId)
      : supabase.from('veicoli').insert([payload]);
    const { error: dbError } = await query;
    if (dbError) return setError(dbError.message);
    setVeicoloForm(veicoloInit);
    setEditingVeicoloId(null);
    await loadData();
  }

  function validateRifornimento() {
    if (!rifornimentoForm.veicolo_id) return 'Seleziona veicolo';
    if (Number.isNaN(Number(rifornimentoForm.odometro))) return 'odometro numeric';
    if (Number(rifornimentoForm.quantita) <= 0) return 'quantita > 0';
    if (Number(rifornimentoForm.prezzo_unitario) < 0) return 'prezzo_unitario >= 0';
    if (Number(rifornimentoForm.costo_totale) < 0) return 'costo_totale >= 0';
    return null;
  }

  async function saveRifornimento(e: FormEvent) {
    e.preventDefault();
    const validation = validateRifornimento();
    if (validation) return setError(validation);
    const payload = {
      user_id: session?.user.id,
      veicolo_id: rifornimentoForm.veicolo_id,
      data: rifornimentoForm.data,
      odometro: Number(rifornimentoForm.odometro),
      quantita: Number(rifornimentoForm.quantita),
      unita: rifornimentoForm.unita,
      prezzo_unitario: Number(rifornimentoForm.prezzo_unitario),
      costo_totale: Number(rifornimentoForm.costo_totale),
      fornitore: rifornimentoForm.fornitore || null,
      note: rifornimentoForm.note || null
    };
    const query = editingRifornimentoId
      ? supabase.from('rifornimenti').update(payload).eq('id', editingRifornimentoId)
      : supabase.from('rifornimenti').insert([payload]);
    const { error: dbError } = await query;
    if (dbError) return setError(dbError.message);
    setRifornimentoForm(rifornimentoInit);
    setEditingRifornimentoId(null);
    await loadData();
  }

  function validateSpesa() {
    if (!spesaForm.veicolo_id) return 'Seleziona veicolo';
    if (Number(spesaForm.importo) < 0) return 'importo >= 0';
    if (spesaForm.odometro && Number.isNaN(Number(spesaForm.odometro))) return 'odometro numeric';
    return null;
  }

  async function saveSpesa(e: FormEvent) {
    e.preventDefault();
    const validation = validateSpesa();
    if (validation) return setError(validation);
    const payload = {
      user_id: session?.user.id,
      veicolo_id: spesaForm.veicolo_id,
      data: spesaForm.data,
      categoria: spesaForm.categoria,
      descrizione: spesaForm.descrizione || null,
      importo: Number(spesaForm.importo),
      odometro: spesaForm.odometro ? Number(spesaForm.odometro) : null,
      note: spesaForm.note || null
    };
    const query = editingSpesaId
      ? supabase.from('spese').update(payload).eq('id', editingSpesaId)
      : supabase.from('spese').insert([payload]);
    const { error: dbError } = await query;
    if (dbError) return setError(dbError.message);
    setSpesaForm(spesaInit);
    setEditingSpesaId(null);
    await loadData();
  }

  async function removeItem(tabella: 'veicoli' | 'rifornimenti' | 'spese', id: string) {
    const { error: dbError } = await supabase.from(tabella).delete().eq('id', id);
    if (dbError) return setError(dbError.message);
    await loadData();
  }

  const dashboard = useMemo(() => {
    const annoCorrente = new Date().getFullYear();
    const rAnno = rifornimenti.filter((r) => new Date(r.data).getFullYear() === annoCorrente);
    const sAnno = spese.filter((s) => new Date(s.data).getFullYear() === annoCorrente);

    const totaleAnno = rAnno.reduce((sum, item) => sum + item.costo_totale, 0) + sAnno.reduce((sum, item) => sum + item.importo, 0);
    const costoMedioMensile = totaleAnno / (new Date().getMonth() + 1);

    const kmTotali = veicoli.reduce((sum, v) => {
      const list = rifornimenti.filter((r) => r.veicolo_id === v.id).sort((a, b) => a.odometro - b.odometro);
      if (list.length < 2) return sum;
      return sum + (list[list.length - 1].odometro - list[0].odometro);
    }, 0);

    const costoKm = kmTotali > 0 ? totaleAnno / kmTotali : null;

    const efficienzaMediaPerVeicolo = veicoli.map((v) => {
      const list = rifornimenti.filter((r) => r.veicolo_id === v.id).sort((a, b) => a.odometro - b.odometro);
      const efficienze: number[] = [];
      for (let i = 1; i < list.length; i += 1) {
        const kmPercorsi = list[i].odometro - list[i - 1].odometro;
        if (kmPercorsi > 0 && list[i].quantita > 0) {
          efficienze.push(kmPercorsi / list[i].quantita);
        }
      }
      const media = efficienze.length > 0 ? efficienze.reduce((a, b) => a + b, 0) / efficienze.length : null;
      const metrica = list[0]?.unita === 'kWh' ? 'km/kWh' : 'km/L';
      return {
        veicolo: v.nome,
        media,
        metrica,
        campioni: list.length
      };
    });

    const ultimaSpesa = [...spese].sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;
    const ultimoRifornimento = [...rifornimenti].sort((a, b) => b.data.localeCompare(a.data))[0] ?? null;
    const veicoloPiuCostoso = veicoli
      .map((v) => {
        const costiRifornimenti = rifornimenti.filter((r) => r.veicolo_id === v.id).reduce((sum, item) => sum + item.costo_totale, 0);
        const costiSpese = spese.filter((s) => s.veicolo_id === v.id).reduce((sum, item) => sum + item.importo, 0);
        return { nome: v.nome, totale: costiRifornimenti + costiSpese };
      })
      .sort((a, b) => b.totale - a.totale)[0] ?? null;

    return { totaleAnno, costoMedioMensile, costoKm, efficienzaMediaPerVeicolo, ultimaSpesa, ultimoRifornimento, veicoloPiuCostoso };
  }, [veicoli, rifornimenti, spese]);

  const helper = 'w-full rounded-md border border-slate-300 p-2 text-sm';

  if (!session) {
    return (
      <main className="mx-auto max-w-md p-4">
        <h1 className="mb-4 text-2xl font-bold">Ma quanto mi costi?!</h1>
        <p className="mb-4 text-sm text-slate-600">App personale per tracciare i costi del tuo veicolo.</p>
        <form onSubmit={signIn} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <input className={helper} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={helper} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="w-full rounded-md bg-slate-900 p-2 text-white">Accedi</button>
          <button type="button" className="w-full rounded-md border border-slate-300 p-2" onClick={() => void signUp()}>Registrati</button>
          {error && <p className="text-sm text-red-700">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <header className="flex items-center justify-between rounded-xl bg-white p-4 shadow">
        <div>
          <h1 className="text-2xl font-bold">Ma quanto mi costi?!</h1>
          <p className="text-xs text-slate-600">Solo uso personale • Privacy-first con Supabase RLS</p>
        </div>
        <button className="rounded-md bg-slate-900 px-3 py-2 text-white" onClick={() => void logout()}>Logout</button>
      </header>

      {error && <p className="rounded-md bg-red-100 p-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="rounded-md bg-blue-100 p-2 text-sm text-blue-700">Caricamento...</p>}

      <section className="grid gap-2 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
        <p><strong>Totale anno corrente:</strong> {eur.format(dashboard.totaleAnno)}</p>
        <p><strong>Costo medio mensile:</strong> {eur.format(dashboard.costoMedioMensile)}</p>
        <p><strong>Costo/km:</strong> {dashboard.costoKm ? `${dashboard.costoKm.toFixed(3)} €/km` : 'Dati insufficienti'}</p>
        <p><strong>Veicolo più costoso:</strong> {dashboard.veicoloPiuCostoso ? `${dashboard.veicoloPiuCostoso.nome} (${eur.format(dashboard.veicoloPiuCostoso.totale)})` : 'Dati insufficienti'}</p>
        <p><strong>Ultima spesa:</strong> {dashboard.ultimaSpesa ? `${dashboard.ultimaSpesa.data} • ${eur.format(dashboard.ultimaSpesa.importo)}` : 'Dati insufficienti'}</p>
        <p><strong>Ultimo rifornimento:</strong> {dashboard.ultimoRifornimento ? `${dashboard.ultimoRifornimento.data} • ${eur.format(dashboard.ultimoRifornimento.costo_totale)}` : 'Dati insufficienti'}</p>
        <div className="sm:col-span-2">
          <strong>Efficienza media per veicolo:</strong>
          <ul className="ml-5 list-disc">
            {dashboard.efficienzaMediaPerVeicolo.map((item) => (
              <li key={item.veicolo}>
                {item.veicolo}: {item.media ? `${item.media.toFixed(2)} ${item.metrica}` : 'Dati insufficienti'} · {item.campioni > 1 ? `Basato su ${item.campioni} rifornimenti` : 'Stima approssimata'}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">Veicoli</h2>
          <form onSubmit={saveVeicolo} className="space-y-2">
            <input className={helper} placeholder="Nome*" required value={veicoloForm.nome} onChange={(e) => setVeicoloForm({ ...veicoloForm, nome: e.target.value })} />
            <input className={helper} placeholder="Marca" value={veicoloForm.marca} onChange={(e) => setVeicoloForm({ ...veicoloForm, marca: e.target.value })} />
            <input className={helper} placeholder="Modello" value={veicoloForm.modello} onChange={(e) => setVeicoloForm({ ...veicoloForm, modello: e.target.value })} />
            <input className={helper} type="number" placeholder="Odometro iniziale" value={veicoloForm.odometro_iniziale} onChange={(e) => setVeicoloForm({ ...veicoloForm, odometro_iniziale: e.target.value })} />
            <select className={helper} value={veicoloForm.tipo_veicolo} onChange={(e) => setVeicoloForm({ ...veicoloForm, tipo_veicolo: e.target.value as VeicoloForm['tipo_veicolo'] })}><option value="auto">auto</option><option value="moto">moto</option></select>
            <select className={helper} value={veicoloForm.tipo_energia} onChange={(e) => setVeicoloForm({ ...veicoloForm, tipo_energia: e.target.value as VeicoloForm['tipo_energia'] })}><option value="benzina">benzina</option><option value="diesel">diesel</option><option value="elettrico">elettrico</option></select>
            <select className={helper} value={veicoloForm.unita_default} onChange={(e) => setVeicoloForm({ ...veicoloForm, unita_default: e.target.value as VeicoloForm['unita_default'] })}><option value="L">L</option><option value="kWh">kWh</option></select>
            <textarea className={helper} placeholder="Note" value={veicoloForm.note} onChange={(e) => setVeicoloForm({ ...veicoloForm, note: e.target.value })} />
            <div className="flex gap-2">
              <button className="flex-1 rounded-md bg-slate-900 p-2 text-white" type="submit">{editingVeicoloId ? 'Aggiorna' : 'Aggiungi'}</button>
              {editingVeicoloId && <button className="rounded-md border px-3" type="button" onClick={() => { setEditingVeicoloId(null); setVeicoloForm(veicoloInit); }}>Annulla</button>}
            </div>
          </form>
          <ul className="mt-3 space-y-2 text-sm">
            {veicoli.map((v) => (
              <li key={v.id} className="rounded border p-2">
                <p className="font-medium">{v.nome}</p>
                <p>{v.marca ?? '-'} {v.modello ?? ''}</p>
                <div className="mt-1 flex gap-3">
                  <button className="text-blue-700" onClick={() => { setEditingVeicoloId(v.id); setVeicoloForm({ nome: v.nome, marca: v.marca ?? '', modello: v.modello ?? '', tipo_veicolo: v.tipo_veicolo ?? 'auto', tipo_energia: v.tipo_energia ?? 'benzina', unita_default: v.unita_default ?? 'L', odometro_iniziale: String(v.odometro_iniziale ?? 0), note: v.note ?? '' }); }}>Modifica</button>
                  <button className="text-red-700" onClick={() => void removeItem('veicoli', v.id)}>Elimina</button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">Rifornimenti</h2>
          <form onSubmit={saveRifornimento} className="space-y-2">
            <select className={helper} required value={rifornimentoForm.veicolo_id} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, veicolo_id: e.target.value })}><option value="">Seleziona veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
            <input className={helper} required type="date" value={rifornimentoForm.data} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, data: e.target.value })} />
            <input className={helper} required type="number" placeholder="Odometro" value={rifornimentoForm.odometro} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, odometro: e.target.value })} />
            <input className={helper} required type="number" step="0.01" placeholder="Quantità" value={rifornimentoForm.quantita} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, quantita: e.target.value })} />
            <select className={helper} value={rifornimentoForm.unita} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, unita: e.target.value as RifornimentoForm['unita'] })}><option value="L">L</option><option value="kWh">kWh</option></select>
            <input className={helper} required type="number" step="0.0001" placeholder="Prezzo unitario" value={rifornimentoForm.prezzo_unitario} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, prezzo_unitario: e.target.value })} />
            <input className={helper} required type="number" step="0.01" placeholder="Costo totale" value={rifornimentoForm.costo_totale} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, costo_totale: e.target.value })} />
            <input className={helper} placeholder="Fornitore" value={rifornimentoForm.fornitore} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, fornitore: e.target.value })} />
            <textarea className={helper} placeholder="Note" value={rifornimentoForm.note} onChange={(e) => setRifornimentoForm({ ...rifornimentoForm, note: e.target.value })} />
            <div className="flex gap-2">
              <button className="flex-1 rounded-md bg-slate-900 p-2 text-white" type="submit">{editingRifornimentoId ? 'Aggiorna' : 'Aggiungi'}</button>
              {editingRifornimentoId && <button className="rounded-md border px-3" type="button" onClick={() => { setEditingRifornimentoId(null); setRifornimentoForm(rifornimentoInit); }}>Annulla</button>}
            </div>
          </form>
          <ul className="mt-3 space-y-2 text-sm">
            {rifornimenti.map((r) => (
              <li key={r.id} className="rounded border p-2">
                <p>{r.data} • {eur.format(r.costo_totale)}</p>
                <p>{r.quantita} {r.unita}</p>
                <div className="mt-1 flex gap-3">
                  <button className="text-blue-700" onClick={() => { setEditingRifornimentoId(r.id); setRifornimentoForm({ veicolo_id: r.veicolo_id, data: r.data, odometro: String(r.odometro), quantita: String(r.quantita), unita: r.unita ?? 'L', prezzo_unitario: String(r.prezzo_unitario), costo_totale: String(r.costo_totale), fornitore: r.fornitore ?? '', note: r.note ?? '' }); }}>Modifica</button>
                  <button className="text-red-700" onClick={() => void removeItem('rifornimenti', r.id)}>Elimina</button>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-xl bg-white p-4 shadow">
          <h2 className="mb-2 font-semibold">Spese</h2>
          <form onSubmit={saveSpesa} className="space-y-2">
            <select className={helper} required value={spesaForm.veicolo_id} onChange={(e) => setSpesaForm({ ...spesaForm, veicolo_id: e.target.value })}><option value="">Seleziona veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
            <input className={helper} required type="date" value={spesaForm.data} onChange={(e) => setSpesaForm({ ...spesaForm, data: e.target.value })} />
            <select className={helper} value={spesaForm.categoria} onChange={(e) => setSpesaForm({ ...spesaForm, categoria: e.target.value })}>{categorieSpesa.map((c) => <option key={c} value={c}>{c}</option>)}</select>
            <input className={helper} placeholder="Descrizione" value={spesaForm.descrizione} onChange={(e) => setSpesaForm({ ...spesaForm, descrizione: e.target.value })} />
            <input className={helper} required type="number" step="0.01" placeholder="Importo" value={spesaForm.importo} onChange={(e) => setSpesaForm({ ...spesaForm, importo: e.target.value })} />
            <input className={helper} type="number" placeholder="Odometro" value={spesaForm.odometro} onChange={(e) => setSpesaForm({ ...spesaForm, odometro: e.target.value })} />
            <textarea className={helper} placeholder="Note" value={spesaForm.note} onChange={(e) => setSpesaForm({ ...spesaForm, note: e.target.value })} />
            <div className="flex gap-2">
              <button className="flex-1 rounded-md bg-slate-900 p-2 text-white" type="submit">{editingSpesaId ? 'Aggiorna' : 'Aggiungi'}</button>
              {editingSpesaId && <button className="rounded-md border px-3" type="button" onClick={() => { setEditingSpesaId(null); setSpesaForm(spesaInit); }}>Annulla</button>}
            </div>
          </form>
          <ul className="mt-3 space-y-2 text-sm">
            {spese.map((s) => (
              <li key={s.id} className="rounded border p-2">
                <p>{s.data} • {eur.format(s.importo)}</p>
                <p>{s.categoria}</p>
                <div className="mt-1 flex gap-3">
                  <button className="text-blue-700" onClick={() => { setEditingSpesaId(s.id); setSpesaForm({ veicolo_id: s.veicolo_id, data: s.data, categoria: s.categoria ?? 'altro', descrizione: s.descrizione ?? '', importo: String(s.importo), odometro: s.odometro === null ? '' : String(s.odometro), note: s.note ?? '' }); }}>Modifica</button>
                  <button className="text-red-700" onClick={() => void removeItem('spese', s.id)}>Elimina</button>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}

export default App;
