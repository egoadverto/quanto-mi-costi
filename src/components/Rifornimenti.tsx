import { FormEvent, useState } from 'react';
import { Rifornimento, RifornimentoForm, Veicolo } from '../utils/calculations';
import { euro } from '../utils/format';

type EditFormData = {
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

type RifornimentiProps = {
  veicoli: Veicolo[];
  rifornimenti: Rifornimento[];
  nomeVeicoloById: Record<string, string>;
  form: RifornimentoForm;
  showForm?: boolean;
  showList?: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onFormChange: (field: keyof RifornimentoForm, value: string) => void;
  onQuickSet: (nextForm: RifornimentoForm) => void;
  onUpdateFull: (id: string, data: { veicolo_id: string; data: string; odometro: number; quantita: number; unita: string; prezzo_unitario: number; costo_totale: number; fornitore: string | null; note: string | null }) => Promise<boolean>;
  onDelete: (id: string) => Promise<void>;
};

function Rifornimenti({ veicoli, rifornimenti, nomeVeicoloById, form, showForm = true, showList = true, onSubmit, onFormChange, onQuickSet, onUpdateFull, onDelete }: RifornimentiProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormData>({ veicolo_id: '', data: '', odometro: '', quantita: '', unita: 'L', prezzo_unitario: '', costo_totale: '', fornitore: '', note: '' });

  const handleVehicleChange = (veicoloId: string) => {
    const veicolo = veicoli.find((v) => v.id === veicoloId);
    const newUnita = veicolo?.unita_default || 'L';
    onQuickSet({ ...form, veicolo_id: veicoloId, unita: newUnita });
  };

  const startEdit = (r: Rifornimento) => {
    setEditingId(r.id);
    setEditForm({
      veicolo_id: r.veicolo_id,
      data: r.data,
      odometro: String(r.odometro),
      quantita: String(r.quantita),
      unita: r.unita || 'L',
      prezzo_unitario: String(r.prezzo_unitario),
      costo_totale: String(r.costo_totale),
      fornitore: r.fornitore || '',
      note: r.note || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ veicolo_id: '', data: '', odometro: '', quantita: '', unita: 'L', prezzo_unitario: '', costo_totale: '', fornitore: '', note: '' });
  };

  const handleEditFormChange = (field: keyof EditFormData, value: string) => {
    const nextForm = { ...editForm, [field]: value };
    if (field === 'quantita' || field === 'prezzo_unitario') {
      const q = Number(nextForm.quantita);
      const p = Number(nextForm.prezzo_unitario);
      if (!isNaN(q) && !isNaN(p)) {
        nextForm.costo_totale = (Math.round(q * p * 100) / 100).toFixed(2);
      }
    }
    if (field === 'costo_totale') {
      const q = Number(nextForm.quantita);
      const c = Number(nextForm.costo_totale);
      if (q > 0 && !isNaN(c)) {
        nextForm.prezzo_unitario = (Math.round((c / q) * 10000) / 10000).toFixed(4);
      }
    }
    setEditForm(nextForm);
  };

  const saveEdit = async (id: string) => {
    const updated = await onUpdateFull(id, {
      veicolo_id: editForm.veicolo_id,
      data: editForm.data,
      odometro: Number(editForm.odometro),
      quantita: Number(editForm.quantita),
      unita: editForm.unita,
      prezzo_unitario: Number(editForm.prezzo_unitario),
      costo_totale: Number(editForm.costo_totale),
      fornitore: editForm.fornitore.trim() || null,
      note: editForm.note.trim() || null
    });
    if (updated) cancelEdit();
  };
  return (
    <section id="rifornimenti" className="space-y-3">
      <h2 className="text-xl font-semibold">Rifornimenti</h2>
{showForm && <div className="panel-highlight p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text-secondary)]">Dati base</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <select className="app-input w-full" value={form.veicolo_id} onChange={(e) => handleVehicleChange(e.target.value)} required><option value="">Veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
              <input className="app-input w-full" type="date" value={form.data} onChange={(e) => onQuickSet({ ...form, data: e.target.value })} required />
              <input className="app-input w-full" type="number" placeholder="Odometro" value={form.odometro} onChange={(e) => onQuickSet({ ...form, odometro: e.target.value })} required />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text-secondary)]">Dati rifornimento</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="app-input w-full" type="number" step="0.01" placeholder="Quantità" value={form.quantita} onChange={(e) => onFormChange('quantita', e.target.value)} required />
              <select className="app-input w-full" value={form.unita} onChange={(e) => onQuickSet({ ...form, unita: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
              <input className="app-input w-full" type="number" step="0.0001" placeholder="Prezzo unitario" value={form.prezzo_unitario} onChange={(e) => onFormChange('prezzo_unitario', e.target.value)} required />
              <input className="app-input w-full" type="number" step="0.01" placeholder="Costo totale" value={form.costo_totale} onChange={(e) => onFormChange('costo_totale', e.target.value)} required />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text-secondary)]">Dettagli (opzionali)</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="app-input w-full" placeholder="Fornitore" value={form.fornitore} onChange={(e) => onQuickSet({ ...form, fornitore: e.target.value })} />
              <input className="app-input w-full" placeholder="Note" value={form.note} onChange={(e) => onQuickSet({ ...form, note: e.target.value })} />
            </div>
          </fieldset>

          <button className="app-button-primary rounded-xl px-4 py-2 text-sm w-full sm:w-auto" type="submit">Salva rifornimento</button>
        </form>
      </div>}
{showList && <div className="grid gap-3">
        {rifornimenti.map((r) => {
          const veicoloNome = nomeVeicoloById[r.veicolo_id] ?? 'Veicolo';
          const precedente = rifornimenti.filter((x) => x.veicolo_id === r.veicolo_id && x.odometro < r.odometro).sort((a, b) => b.odometro - a.odometro)[0];
          const eff = precedente && r.quantita > 0 ? (r.odometro - precedente.odometro) / r.quantita : null;

          if (editingId === r.id) {
            return (
              <article key={r.id} className="panel-highlight p-4 space-y-3">
                <div className="grid gap-2 sm:grid-cols-3">
                  <select className="app-input w-full text-sm" value={editForm.veicolo_id} onChange={(e) => handleEditFormChange('veicolo_id', e.target.value)} required><option value="">Veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
                  <input className="app-input w-full text-sm" type="date" value={editForm.data} onChange={(e) => handleEditFormChange('data', e.target.value)} required />
                  <input className="app-input w-full text-sm" type="number" placeholder="Odometro" value={editForm.odometro} onChange={(e) => handleEditFormChange('odometro', e.target.value)} required />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="app-input w-full text-sm" type="number" step="0.01" placeholder="Quantità" value={editForm.quantita} onChange={(e) => handleEditFormChange('quantita', e.target.value)} required />
                  <select className="app-input w-full text-sm" value={editForm.unita} onChange={(e) => handleEditFormChange('unita', e.target.value)}><option value="L">L</option><option value="kWh">kWh</option></select>
                  <input className="app-input w-full text-sm" type="number" step="0.0001" placeholder="Prezzo €/u" value={editForm.prezzo_unitario} onChange={(e) => handleEditFormChange('prezzo_unitario', e.target.value)} required />
                  <input className="app-input w-full text-sm" type="number" step="0.01" placeholder="Totale €" value={editForm.costo_totale} onChange={(e) => handleEditFormChange('costo_totale', e.target.value)} required />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className="app-input w-full text-sm" placeholder="Fornitore" value={editForm.fornitore} onChange={(e) => handleEditFormChange('fornitore', e.target.value)} />
                  <input className="app-input w-full text-sm" placeholder="Note" value={editForm.note} onChange={(e) => handleEditFormChange('note', e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-primary text-sm" onClick={() => saveEdit(r.id)}>Salva</button>
                  <button className="btn-secondary text-sm" onClick={cancelEdit}>Annulla</button>
                  <button className="app-button-danger rounded-xl px-3 py-2 text-sm font-semibold ml-auto" onClick={() => void onDelete(r.id)}>Elimina</button>
                </div>
              </article>
            );
          }

          return (
            <article key={r.id} className="panel-highlight p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <p className="font-semibold">{veicoloNome}</p>
                  <p className="text-[var(--text-secondary)]">
                    {r.data} · {r.quantita} {r.unita} · {r.prezzo_unitario.toFixed(4)} €/u · Totale {euro.format(r.costo_totale)} · Efficienza {eff ? `${eff.toFixed(2)} ${r.unita === 'kWh' ? 'km/kWh' : 'km/L'}` : 'N/D'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary" onClick={() => startEdit(r)}>Modifica</button>
                  <button className="app-button-danger rounded-xl px-3 py-2 text-sm font-semibold" onClick={() => void onDelete(r.id)}>Elimina</button>
                </div>
              </div>
            </article>
          );
        })}
      </div>}
    </section>
  );
}

export default Rifornimenti;
