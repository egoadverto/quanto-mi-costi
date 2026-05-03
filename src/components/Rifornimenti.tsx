import { FormEvent } from 'react';
import { Rifornimento, RifornimentoForm } from '../utils/calculations';
import { euro } from '../utils/format';

type RifornimentiProps = {
  veicoli: { id: string; nome: string }[];
  rifornimenti: Rifornimento[];
  nomeVeicoloById: Record<string, string>;
  form: RifornimentoForm;
  showForm?: boolean;
  showList?: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onFormChange: (field: keyof RifornimentoForm, value: string) => void;
  onQuickSet: (nextForm: RifornimentoForm) => void;
  onUpdateCosto: (id: string, costoAttuale: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function Rifornimenti({ veicoli, rifornimenti, nomeVeicoloById, form, showForm = true, showList = true, onSubmit, onFormChange, onQuickSet, onUpdateCosto, onDelete }: RifornimentiProps) {
  return (
    <section id="rifornimenti" className="space-y-3">
      <h2 className="text-xl font-semibold">Rifornimenti</h2>
      {showForm && <div className="panel-highlight p-5">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <select className="app-input w-full" value={form.veicolo_id} onChange={(e) => onQuickSet({ ...form, veicolo_id: e.target.value })} required><option value="">Veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
          <input className="app-input w-full" type="date" value={form.data} onChange={(e) => onQuickSet({ ...form, data: e.target.value })} required />
          <input className="app-input w-full" type="number" placeholder="Odometro" value={form.odometro} onChange={(e) => onQuickSet({ ...form, odometro: e.target.value })} required />
          <input className="app-input w-full" type="number" step="0.01" placeholder="Quantità" value={form.quantita} onChange={(e) => onFormChange('quantita', e.target.value)} required />
          <select className="app-input w-full" value={form.unita} onChange={(e) => onQuickSet({ ...form, unita: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
          <input className="app-input w-full" type="number" step="0.0001" placeholder="Prezzo unitario" value={form.prezzo_unitario} onChange={(e) => onFormChange('prezzo_unitario', e.target.value)} required />
          <input className="app-input w-full" type="number" step="0.01" placeholder="Costo totale" value={form.costo_totale} onChange={(e) => onFormChange('costo_totale', e.target.value)} required />
          <input className="app-input w-full" placeholder="Fornitore" value={form.fornitore} onChange={(e) => onQuickSet({ ...form, fornitore: e.target.value })} />
          <input className="app-input w-full sm:col-span-2" placeholder="Note" value={form.note} onChange={(e) => onQuickSet({ ...form, note: e.target.value })} />
          <button className="app-button-primary rounded-xl px-4 py-2 text-sm sm:col-span-2 sm:w-fit" type="submit">Salva rifornimento</button>
        </form>
      </div>}
      {showList && <div className="grid gap-3">
        {rifornimenti.map((r) => {
          const veicoloNome = nomeVeicoloById[r.veicolo_id] ?? 'Veicolo';
          const precedente = rifornimenti.filter((x) => x.veicolo_id === r.veicolo_id && x.odometro < r.odometro).sort((a, b) => b.odometro - a.odometro)[0];
          const eff = precedente && r.quantita > 0 ? (r.odometro - precedente.odometro) / r.quantita : null;
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
                  <button className="btn-secondary" onClick={() => void onUpdateCosto(r.id, r.costo_totale)}>Modifica</button>
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
