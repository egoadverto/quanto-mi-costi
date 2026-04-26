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
    <section id="dashboard" className="space-y-3">
      <h2 className="text-xl font-semibold text-[#12343b]">Dashboard</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card"><p className="stat-label">Totale anno</p><p className="stat-value">{euro.format(dashboard.totaleAnno)}</p></div>
        <div className="stat-card"><p className="stat-label">Costo medio mensile</p><p className="stat-value">{euro.format(dashboard.costoMedioMensile)}</p></div>
        <div className="stat-card"><p className="stat-label">Costo/km</p><p className="stat-value">{dashboard.costoKm ? `${dashboard.costoKm.toFixed(2)} €/km` : 'N/D'}</p></div>
        <div className="stat-card"><p className="stat-label">Veicolo più costoso</p><p className="text-sm font-semibold text-[#2d545e]">{dashboard.costoPerVeicolo ? dashboard.costoPerVeicolo.nome : 'N/D'}</p></div>
        <div className="stat-card"><p className="stat-label">Ultimo rifornimento</p><p className="text-sm">{dashboard.ultimoRifornimento ? `${dashboard.ultimoRifornimento.data} · ${euro.format(dashboard.ultimoRifornimento.costo_totale)}` : 'N/D'}</p></div>
        <div className="stat-card"><p className="stat-label">Ultima spesa</p><p className="text-sm">{dashboard.ultimaSpesa ? `${dashboard.ultimaSpesa.data} · ${euro.format(dashboard.ultimaSpesa.importo)}` : 'N/D'}</p></div>
        <div className="stat-card lg:col-span-2"><p className="stat-label">Efficienza media</p><ul className="mt-1 space-y-1 text-sm">{dashboard.efficienze.map((e) => <li key={e.veicolo}>{e.veicolo}: {e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'N/D'}</li>)}</ul></div>
      </div>
    </section>
  );
}

export default Dashboard;
