import { FormEvent } from 'react';
import { Veicolo } from '../utils/calculations';

type VeicoliForm = {
  nome: string;
  marca: string;
  modello: string;
  tipo_veicolo: string;
  tipo_energia: string;
  unita_default: string;
  odometro_iniziale: string;
  note: string;
};

type VeicoliProps = {
  veicoli: Veicolo[];
  form: VeicoliForm;
  onSubmit: (e: FormEvent) => Promise<void>;
  onFormSet: (nextForm: VeicoliForm) => void;
  onDelete: (id: string) => Promise<void>;
  onUpdateNome: (id: string, nomeAttuale: string) => Promise<void>;
};

function Veicoli({ veicoli, form, onSubmit, onFormSet, onDelete, onUpdateNome }: VeicoliProps) {
  return (
    <section id="veicoli" className="space-y-3">
      <h2 className="text-xl font-semibold">Veicoli</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-highlight p-5">
          <h3 className="mb-3 font-semibold">Nuovo veicolo</h3>
          <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2">
            <input className="app-input w-full" placeholder="Nome*" value={form.nome} onChange={(e) => onFormSet({ ...form, nome: e.target.value })} required />
            <input className="app-input w-full" placeholder="Marca" value={form.marca} onChange={(e) => onFormSet({ ...form, marca: e.target.value })} />
            <input className="app-input w-full" placeholder="Modello" value={form.modello} onChange={(e) => onFormSet({ ...form, modello: e.target.value })} />
            <input className="app-input w-full" placeholder="Odometro iniziale" type="number" value={form.odometro_iniziale} onChange={(e) => onFormSet({ ...form, odometro_iniziale: e.target.value })} />
            <select className="app-input w-full" value={form.tipo_veicolo} onChange={(e) => onFormSet({ ...form, tipo_veicolo: e.target.value })}><option value="auto">Auto</option><option value="moto">Moto</option></select>
            <select className="app-input w-full" value={form.tipo_energia} onChange={(e) => onFormSet({ ...form, tipo_energia: e.target.value })}><option value="benzina">Benzina</option><option value="diesel">Diesel</option><option value="elettrico">Elettrico</option></select>
            <select className="app-input w-full" value={form.unita_default} onChange={(e) => onFormSet({ ...form, unita_default: e.target.value })}><option value="L">L</option><option value="kWh">kWh</option></select>
            <input className="app-input w-full sm:col-span-2" placeholder="Note" value={form.note} onChange={(e) => onFormSet({ ...form, note: e.target.value })} />
            <button className="app-button-primary rounded-xl px-4 py-2 text-sm sm:col-span-2 sm:w-fit" type="submit">Salva veicolo</button>
          </form>
        </div>
        <div className="panel-highlight p-5">
          <h3 className="mb-3 font-semibold">Elenco veicoli</h3>
          <ul className="space-y-2">
            {veicoli.map((v) => (
              <li key={v.id} className="rounded-xl border p-3" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold">{v.nome}</span>
                  <button className="app-button-danger rounded-xl px-3 py-2 text-sm font-semibold" onClick={() => void onDelete(v.id)}>Elimina</button>
                </div>
                <button className="btn-secondary mt-2" onClick={() => void onUpdateNome(v.id, v.nome)}>Modifica</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default Veicoli;
