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
      <h2 className="text-xl font-semibold text-[#12343b]">Spese</h2>
      {showForm && <div className="panel-highlight">
        <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
          <select className="field-highlight" value={form.veicolo_id} onChange={(e) => onFormSet({ ...form, veicolo_id: e.target.value })} required><option value="">Veicolo</option>{veicoli.map((v) => <option key={v.id} value={v.id}>{v.nome}</option>)}</select>
          <input className="field-highlight" type="date" value={form.data} onChange={(e) => onFormSet({ ...form, data: e.target.value })} required />
          <select className="field-highlight" value={form.categoria} onChange={(e) => onFormSet({ ...form, categoria: e.target.value })}>{categorieSpesa.map((c) => <option key={c} value={c}>{c}</option>)}</select>
          <input className="field-highlight" placeholder="Descrizione" value={form.descrizione} onChange={(e) => onFormSet({ ...form, descrizione: e.target.value })} />
          <input className="field-highlight" type="number" step="0.01" placeholder="Importo" value={form.importo} onChange={(e) => onFormSet({ ...form, importo: e.target.value })} required />
          <input className="field-highlight" type="number" placeholder="Odometro (opzionale)" value={form.odometro} onChange={(e) => onFormSet({ ...form, odometro: e.target.value })} />
          <input className="field-highlight sm:col-span-2" placeholder="Note" value={form.note} onChange={(e) => onFormSet({ ...form, note: e.target.value })} />
          <button className="btn-brand sm:col-span-2 sm:w-fit" type="submit">Salva spesa</button>
        </form>
      </div>}
      {showList && <div className="grid gap-3">
        {spese.map((s) => (
          <article key={s.id} className="panel-highlight">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1 text-sm">
                <p className="font-semibold">{s.categoria || 'altro'} · {nomeVeicoloById[s.veicolo_id] ?? 'Veicolo'}</p>
                <p className="text-[#12343b]/70">{s.data}</p>
                <p>Importo: <strong>{euro.format(s.importo)}</strong></p>
              </div>
              <div className="space-y-2">
                <button className="btn-secondary" onClick={() => void onUpdateImporto(s.id, s.importo)}>Modifica</button>
                <button className="app-button-danger rounded-xl px-3 py-2 text-sm font-semibold block" onClick={() => void onDelete(s.id)}>Elimina</button>
              </div>
            </div>
          </article>
        ))}
      </div>}
    </section>
  );
}

export default Spese;
