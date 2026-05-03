import { FormEvent } from 'react';
import { Veicolo } from '../utils/calculations';

const formatDate = (value: string | null) => {
  if (!value) return '-';
  const [year, month, day] = value.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
};

type VeicoliForm = {
  nome: string;
  marca: string;
  modello: string;
  tipo_veicolo: string;
  tipo_energia: string;
  unita_default: string;
  odometro_iniziale: string;
  data_acquisto: string;
  note: string;
};

type VeicoliProps = {
  veicoli: Veicolo[];
  form: VeicoliForm;
  isEditing: boolean;
  showForm?: boolean;
  showList?: boolean;
  onSubmit: (e: FormEvent) => Promise<void>;
  onFormSet: (nextForm: VeicoliForm) => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
};

function Veicoli({ veicoli, form, isEditing, showForm = true, showList = true, onSubmit, onFormSet, onCancelEdit, onDelete, onEdit }: VeicoliProps) {
  return (
    <section id="veicoli" className="space-y-3">
      <h2 className="text-xl font-semibold">Veicoli</h2>
<div className="grid gap-4 lg:grid-cols-2">
        {showList && <div className="panel-highlight p-5 order-2 sm:order-1">
          <h3 className="mb-3 font-semibold">Elenco veicoli</h3>
          <div className="hidden lg:block overflow-x-auto">
            <table className="desktop-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Marca</th>
                  <th>Modello</th>
                  <th>Data acquisto</th>
                  <th>Km iniziali</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {veicoli.map((v) => (
                  <tr key={v.id}>
                    <td className="font-semibold">{v.nome}</td>
                    <td>{v.marca || '-'}</td>
                    <td>{v.modello || '-'}</td>
                    <td>{formatDate(v.data_acquisto)}</td>
                    <td>{v.odometro_iniziale ?? '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button className="btn-secondary" onClick={() => onEdit(v.id)}>Modifica</button>
                        <button className="app-button-danger rounded-xl px-3 py-2 text-sm font-semibold" onClick={() => void onDelete(v.id)}>Elimina</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 lg:hidden">
            {veicoli.map((v) => (
              <li key={v.id} className="mobile-vehicle-card rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-sm font-semibold">{v.nome}</span>
                    <p className="text-xs text-[var(--text-secondary)]">Marca: {v.marca || '-'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Modello: {v.modello || '-'}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Data acquisto: {formatDate(v.data_acquisto)}</p>
                    <p className="text-xs text-[var(--text-secondary)]">Km all'acquisto: {v.odometro_iniziale ?? '-'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button className="btn-secondary w-full" onClick={() => onEdit(v.id)}>Modifica</button>
                    <button className="app-button-danger rounded-xl px-3 py-2 text-sm font-semibold w-full" onClick={() => void onDelete(v.id)}>Elimina</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>}
        {showForm && <div className="panel-highlight p-5 order-1 sm:order-2">
          <h3 className="mb-3 font-semibold">{isEditing ? 'Modifica veicolo' : 'Nuovo veicolo'}</h3>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium">Nome</span>
              <input className="app-input w-full" value={form.nome} onChange={(e) => onFormSet({ ...form, nome: e.target.value })} required />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Marca</span>
              <input className="app-input w-full" value={form.marca} onChange={(e) => onFormSet({ ...form, marca: e.target.value })} />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Modello</span>
              <input className="app-input w-full" value={form.modello} onChange={(e) => onFormSet({ ...form, modello: e.target.value })} />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Odometro iniziale</span>
              <input className="app-input w-full" type="number" value={form.odometro_iniziale} onChange={(e) => onFormSet({ ...form, odometro_iniziale: e.target.value })} />
              <p className="text-xs text-[var(--text-secondary)]">Km indicati sul veicolo al momento della creazione.</p>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Data acquisto</span>
              <input className="app-input w-full" type="date" value={form.data_acquisto} onChange={(e) => onFormSet({ ...form, data_acquisto: e.target.value })} />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Tipo veicolo</span>
              <select className="app-input w-full" value={form.tipo_veicolo} onChange={(e) => onFormSet({ ...form, tipo_veicolo: e.target.value })}><option value="auto">Auto</option><option value="moto">Moto</option></select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Tipo energia</span>
              <select className="app-input w-full" value={form.tipo_energia} onChange={(e) => onFormSet({ ...form, tipo_energia: e.target.value })}><option value="benzina">Benzina</option><option value="diesel">Diesel</option><option value="elettrico">Elettrico</option></select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium">Unità predefinita</span>
              <select className="app-input w-full" value={form.unita_default} onChange={(e) => onFormSet({ ...form, unita_default: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm font-medium">Note</span>
              <input className="app-input w-full" value={form.note} onChange={(e) => onFormSet({ ...form, note: e.target.value })} />
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-2 mobile-veicoli-actions">
              <button className="app-button-primary rounded-xl px-4 py-2 text-sm sm:w-fit" type="submit">{isEditing ? 'Aggiorna veicolo' : 'Salva veicolo'}</button>
              {isEditing && <button className="btn-secondary" type="button" onClick={onCancelEdit}>Annulla modifica</button>}
</div>
          </form>
        </div>}
      </div>
    </section>
  );
}

export default Veicoli;
