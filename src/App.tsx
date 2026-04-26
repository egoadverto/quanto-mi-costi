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

  if (!session) {
    return (
      <main className="mx-auto max-w-md p-4">
        <h1 className="mb-4 text-2xl font-bold">Ma quanto mi costi?!</h1>
        <form onSubmit={login} className="space-y-3 rounded-xl bg-white p-4 shadow">
          <input className="w-full rounded border p-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="w-full rounded border p-2" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="w-full rounded bg-slate-900 p-2 text-white" type="submit">Accedi</button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-4 p-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ma quanto mi costi?!</h1>
        <button className="rounded bg-slate-900 px-3 py-2 text-white" onClick={logout}>Logout</button>
      </header>

      {error && <p className="rounded bg-red-100 p-2 text-red-700">{error}</p>}

      <section className="grid gap-2 rounded-xl bg-white p-4 shadow sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Dashboard</h2>
        <p><strong>Totale anno corrente:</strong> {euro.format(dashboard.totaleAnno)}</p>
        <p><strong>Costo medio mensile:</strong> {euro.format(dashboard.costoMedioMensile)}</p>
        <p><strong>Costo/km:</strong> {dashboard.costoKm ? `${dashboard.costoKm.toFixed(2)} €/km` : 'Dati insufficienti'}</p>
        <p><strong>Veicolo più costoso:</strong> {dashboard.costoPerVeicolo ? `${dashboard.costoPerVeicolo.nome} (${euro.format(dashboard.costoPerVeicolo.totale)})` : 'Dati insufficienti'}</p>
        <p><strong>Ultima spesa:</strong> {dashboard.ultimaSpesa ? `${dashboard.ultimaSpesa.data} - ${euro.format(dashboard.ultimaSpesa.importo)}` : 'Dati insufficienti'}</p>
        <p><strong>Ultimo rifornimento:</strong> {dashboard.ultimoRifornimento ? `${dashboard.ultimoRifornimento.data} - ${euro.format(dashboard.ultimoRifornimento.costo_totale)}` : 'Dati insufficienti'}</p>
        <div className="sm:col-span-2">
          <strong>Efficienza media per veicolo:</strong>
          <ul className="ml-4 list-disc">
            {dashboard.efficienze.map((e) => (
              <li key={e.veicolo}>{e.veicolo}: {e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'Dati insufficienti'} · {e.campioni > 1 ? `Basato su ${e.campioni} rifornimenti` : 'Stima approssimata'}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Rifornimenti / Ricariche</h2>
        <form onSubmit={addRifornimento} className="grid gap-2 sm:grid-cols-2">
          <select className="rounded border p-2" value={rForm.veicolo_id} onChange={(e) => updateRForm('veicolo_id', e.target.value)} required><option value="">Seleziona veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
          <input className="rounded border p-2" type="date" value={rForm.data} onChange={(e) => updateRForm('data', e.target.value)} required />
          <input className="rounded border p-2" type="number" placeholder="Odometro" value={rForm.odometro} onChange={(e) => updateRForm('odometro', e.target.value)} required />
          <input className="rounded border p-2" type="number" step="0.01" placeholder="Quantità" value={rForm.quantita} onChange={(e) => updateRForm('quantita', e.target.value)} required />
          <select className="rounded border p-2" value={rForm.unita} onChange={(e) => updateRForm('unita', e.target.value)}><option value="L">L</option><option value="kWh">kWh</option></select>
          <input className="rounded border p-2" type="number" step="0.0001" placeholder="Prezzo unitario" value={rForm.prezzo_unitario} onChange={(e) => updateRForm('prezzo_unitario', e.target.value)} required />
          <input className="rounded border p-2" type="number" step="0.01" placeholder="Costo totale" value={rForm.costo_totale} onChange={(e) => updateRForm('costo_totale', e.target.value)} required />
          <input className="rounded border p-2" placeholder="Fornitore" value={rForm.fornitore} onChange={(e) => updateRForm('fornitore', e.target.value)} />
          <input className="rounded border p-2 sm:col-span-2" placeholder="Note" value={rForm.note} onChange={(e) => updateRForm('note', e.target.value)} />
          <button className="rounded bg-slate-900 p-2 text-white sm:col-span-2" type="submit">Salva rifornimento</button>
        </form>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Spese</h2>
        <form onSubmit={addSpesa} className="grid gap-2 sm:grid-cols-2">
          <select className="rounded border p-2" value={sForm.veicolo_id} onChange={(e) => setSForm({ ...sForm, veicolo_id: e.target.value })} required><option value="">Seleziona veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
          <input className="rounded border p-2" type="date" value={sForm.data} onChange={(e) => setSForm({ ...sForm, data: e.target.value })} required />
          <select className="rounded border p-2" value={sForm.categoria} onChange={(e) => setSForm({ ...sForm, categoria: e.target.value })}>{categorieSpesa.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <input className="rounded border p-2" placeholder="Descrizione" value={sForm.descrizione} onChange={(e) => setSForm({ ...sForm, descrizione: e.target.value })} />
          <input className="rounded border p-2" type="number" step="0.01" placeholder="Importo" value={sForm.importo} onChange={(e) => setSForm({ ...sForm, importo: e.target.value })} required />
          <input className="rounded border p-2" type="number" placeholder="Odometro" value={sForm.odometro} onChange={(e) => setSForm({ ...sForm, odometro: e.target.value })} />
          <input className="rounded border p-2 sm:col-span-2" placeholder="Note" value={sForm.note} onChange={(e) => setSForm({ ...sForm, note: e.target.value })} />
          <button className="rounded bg-slate-900 p-2 text-white sm:col-span-2" type="submit">Salva spesa</button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Storico dati</h2>
        <div className="rounded-xl bg-white p-4 shadow sm:col-span-1"><h3 className="mb-2 font-semibold">Rifornimenti</h3><ul className="space-y-1">{rifornimenti.map((r) => <li key={r.id} className="space-y-1 border-b pb-1"><div className="flex justify-between gap-2"><span>{r.data} · {euro.format(r.costo_totale)}</span><button className="text-red-600" onClick={() => void deleteItem('rifornimenti', r.id)}>Elimina</button></div><button className="text-sm text-blue-700" onClick={() => void updateRifornimentoCosto(r.id, r.costo_totale)}>Modifica</button></li>)}</ul></div>
        <div className="rounded-xl bg-white p-4 shadow sm:col-span-1"><h3 className="mb-2 font-semibold">Spese</h3><ul className="space-y-1">{spese.map((s) => <li key={s.id} className="space-y-1 border-b pb-1"><div className="flex justify-between gap-2"><span>{s.data} · {euro.format(s.importo)}</span><button className="text-red-600" onClick={() => void deleteItem('spese', s.id)}>Elimina</button></div><button className="text-sm text-blue-700" onClick={() => void updateSpesaImporto(s.id, s.importo)}>Modifica</button></li>)}</ul></div>
      </section>

      <section className="rounded-xl bg-white p-4 shadow">
        <h2 className="mb-2 font-semibold">Nuovo veicolo</h2>
        <form onSubmit={addVeicolo} className="grid gap-2 sm:grid-cols-2">
          <input className="rounded border p-2" placeholder="Nome*" value={vForm.nome} onChange={(e) => setVForm({ ...vForm, nome: e.target.value })} required />
          <input className="rounded border p-2" placeholder="Marca" value={vForm.marca} onChange={(e) => setVForm({ ...vForm, marca: e.target.value })} />
          <input className="rounded border p-2" placeholder="Modello" value={vForm.modello} onChange={(e) => setVForm({ ...vForm, modello: e.target.value })} />
          <input className="rounded border p-2" placeholder="Odometro iniziale" type="number" value={vForm.odometro_iniziale} onChange={(e) => setVForm({ ...vForm, odometro_iniziale: e.target.value })} />
          <select className="rounded border p-2" value={vForm.tipo_veicolo} onChange={(e) => setVForm({ ...vForm, tipo_veicolo: e.target.value })}><option value="auto">Auto</option><option value="moto">Moto</option></select>
          <select className="rounded border p-2" value={vForm.tipo_energia} onChange={(e) => setVForm({ ...vForm, tipo_energia: e.target.value })}><option value="benzina">Benzina</option><option value="diesel">Diesel</option><option value="elettrico">Elettrico</option></select>
          <select className="rounded border p-2" value={vForm.unita_default} onChange={(e) => setVForm({ ...vForm, unita_default: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
          <input className="rounded border p-2 sm:col-span-2" placeholder="Note" value={vForm.note} onChange={(e) => setVForm({ ...vForm, note: e.target.value })} />
          <button className="rounded bg-slate-900 p-2 text-white sm:col-span-2" type="submit">Salva veicolo</button>
        </form>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow sm:col-span-1"><h3 className="mb-2 font-semibold">Veicoli</h3><ul className="space-y-1">{veicoli.map((v) => <li key={v.id} className="space-y-1 border-b pb-1"><div className="flex justify-between gap-2"><span>{v.nome}</span><button className="text-red-600" onClick={() => void deleteItem('veicoli', v.id)}>Elimina</button></div><button className="text-sm text-blue-700" onClick={() => void updateVeicoloNome(v.id, v.nome)}>Modifica</button></li>)}</ul></div>
      </section>
    </main>
  );
}

export default App;
