import { euro } from '../utils/format';

type DashboardProps = {
  dashboard: {
    totaleAnno: number;
    costoMedioMensile: number;
    costoKm: number | null;
    costoPerVeicolo: { nome: string; totale: number } | null;
    ultimoRifornimento: { data: string; costo_totale: number } | null;
    ultimaSpesa: { data: string; importo: number } | null;
    efficienze: { veicolo: string; valore: number | null; unita: string }[];
  };
};

function Dashboard({ dashboard }: DashboardProps) {
  return (
    <section id="dashboard" className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>

      <div className="panel-highlight p-5">
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Costi principali</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="stat-card"><p className="stat-label">Totale anno</p><p className="text-2xl font-bold text-[var(--accent)]">{euro.format(dashboard.totaleAnno)}</p></div>
          <div className="stat-card"><p className="stat-label">Costo medio mensile</p><p className="text-2xl font-bold text-[var(--accent)]">{euro.format(dashboard.costoMedioMensile)}</p></div>
          <div className="stat-card"><p className="stat-label">Costo/km</p><p className="text-2xl font-bold text-[var(--accent)]">{dashboard.costoKm ? `${dashboard.costoKm.toFixed(2)} €/km` : 'N/D'}</p></div>
        </div>
      </div>

      <div className="panel-highlight p-5">
        <p className="text-sm font-medium text-[var(--text-secondary)] mb-2">Ultime attività</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-card p-3"><p className="text-xs text-[var(--text-secondary)]">Veicolo più costoso</p><p className="text-sm font-semibold">{dashboard.costoPerVeicolo ? dashboard.costoPerVeicolo.nome : 'N/D'}</p></div>
          <div className="stat-card p-3"><p className="text-xs text-[var(--text-secondary)]">Ultimo rifornimento</p><p className="text-sm">{dashboard.ultimoRifornimento ? `${dashboard.ultimoRifornimento.data} · ${euro.format(dashboard.ultimoRifornimento.costo_totale)}` : 'N/D'}</p></div>
          <div className="stat-card p-3"><p className="text-xs text-[var(--text-secondary)]">Ultima spesa</p><p className="text-sm">{dashboard.ultimaSpesa ? `${dashboard.ultimaSpesa.data} · ${euro.format(dashboard.ultimaSpesa.importo)}` : 'N/D'}</p></div>
          <div className="stat-card p-3 lg:col-span-1"><p className="text-xs text-[var(--text-secondary)]">Efficienza media</p><ul className="mt-1 space-y-1 text-xs">{dashboard.efficienze.map((e) => <li key={e.veicolo}>{e.veicolo}: {e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'N/D'}</li>)}</ul></div>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
