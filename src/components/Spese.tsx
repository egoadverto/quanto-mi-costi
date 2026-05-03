import { FormEvent } from 'react';
import { Spesa } from '../utils/calculations';
import { euro } from '../utils/format';

type SpeseForm = {
  veicolo_id: string;
  data: string;
  categoria: string;
  descrizione: string;
  importo: string;
  odometro: string;
  note: string;
};

type SpeseProps = {
  veicoli: { id: string; nome: string }[];
  spese: Spesa[];
  nomeVeicoloById: Record<string, string>;
  categorieSpesa: string[];
  form: SpeseForm;
  showForm?: boolean;
  showList?: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onFormSet: (nextForm: SpeseForm) => void;
  onUpdateImporto: (id: string, importoAttuale: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function Spese({ veicoli, spese, nomeVeicoloById, categorieSpesa, form, showForm = true, showList = true, onSubmit, onFormSet, onUpdateImporto, onDelete }: SpeseProps) {
  return (
    <section id="spese" className="space-y-3">
      <h2 className="text-xl font-semibold">Spese</h2>
{showForm && <div className="panel-highlight p-5">
        <form onSubmit={onSubmit} className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text-secondary)]">Dati spesa</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              <select className="app-input w-full" value={form.veicolo_id} onChange={(e) => onFormSet({ ...form, veicolo_id: e.target.value })} required><option value="">Veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
              <input className="app-input w-full" type="date" value={form.data} onChange={(e) => onFormSet({ ...form, data: e.target.value })} required />
              <input className="app-input w-full" type="number" step="0.01" placeholder="Importo" value={form.importo} onChange={(e) => onFormSet({ ...form, importo: e.target.value })} required />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text-secondary)]">Dettagli</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="app-input w-full" value={form.categoria} onChange={(e) => onFormSet({ ...form, categoria: e.target.value })}>{categorieSpesa.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              <input className="app-input w-full" placeholder="Descrizione" value={form.descrizione} onChange={(e) => onFormSet({ ...form, descrizione: e.target.value })} />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-[var(--text-secondary)]">Opzionali</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="app-input w-full" type="number" placeholder="Odometro" value={form.odometro} onChange={(e) => onFormSet({ ...form, odometro: e.target.value })} />
              <input className="app-input w-full" placeholder="Note" value={form.note} onChange={(e) => onFormSet({ ...form, note: e.target.value })} />
            </div>
          </fieldset>

          <button className="app-button-primary rounded-xl px-4 py-2 text-sm w-full sm:w-auto" type="submit">Salva spesa</button>
        </form>
      </div>}
{showList && <div className="grid gap-3">
        {spese.map((s) => (
          <article key={s.id} className="panel-highlight p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm">
                <p className="font-semibold">{s.categoria || 'altro'} · {nomeVeicoloById[s.veicolo_id] ?? 'Veicolo'}</p>
                <p className="text-[var(--text-secondary)]">{s.data} · Importo {euro.format(s.importo)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="btn-secondary" onClick={() => void onUpdateImporto(s.id, s.importo)}>Modifica</button>
                <button className="app-button-danger rounded-xl px-3 py-2 text-sm font-semibold" onClick={() => void onDelete(s.id)}>Elimina</button>
              </div>
            </div>
          </article>
        ))}
      </div>}
    </section>
  );
}

export default Spese;
