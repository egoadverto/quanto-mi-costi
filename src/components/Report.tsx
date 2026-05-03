import { euro } from '../utils/format';

type ReportProps = {
  reportData: {
    perVeicolo: [string, number][];
    perCategoria: [string, number][];
    perMese: [string, number][];
    maxVeicolo: number;
    maxCategoria: number;
    maxMese: number;
  };
  efficienze: { veicolo: string; valore: number | null; unita: string }[];
};

const PieChart = ({ data, colors }: { data: [string, number][], colors: string[] }) => {
  const total = data.reduce((acc, [, val]) => acc + val, 0);
  if (total === 0) return <p className="text-sm text-[var(--text-secondary)]">Nessun dato</p>;

  const slices = data.map(([, val], i) => {
    const pct = (val / total) * 100;
    return `${colors[i % colors.length]} ${pct}%`;
  }).join(', ');

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="w-32 h-32 rounded-full"
        style={{ background: `conic-gradient(${slices})` }}
      />
      <div className="grid grid-cols-2 gap-2 text-xs">
        {data.map(([label, val], i) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
            <span>{label}: {euro.format(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

function Report({ reportData, efficienze }: ReportProps) {
  const chartColors = ['#f29727', '#d97706', '#b45309', '#92400e', '#78350f', '#451a03', '#f59e0b', '#ea580c'];

  return (
    <section id="report" className="space-y-3">
      <h2 className="text-xl font-semibold">Report</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-highlight p-4">
          <h3 className="mb-3 font-semibold">Costo totale per veicolo</h3>
          <PieChart data={reportData.perVeicolo} colors={chartColors} />
        </div>
        <div className="panel-highlight p-4">
          <h3 className="mb-3 font-semibold">Costo totale per categoria</h3>
          <PieChart data={reportData.perCategoria} colors={chartColors} />
        </div>
        <div className="panel-highlight p-4">
          <h3 className="mb-3 font-semibold">Totali mensili</h3>
          <div className="space-y-2">{reportData.perMese.map(([mese, valore]) => <div key={mese}><div className="mb-1 flex justify-between text-sm"><span>{mese}</span><span>{euro.format(valore)}</span></div><div className="h-2 rounded bg-[var(--border)] overflow-hidden"><div className="h-2 rounded bg-[var(--accent)]" style={{ width: `${Math.max(6, (valore / reportData.maxMese) * 100)}%` }} /></div></div>)}</div>
        </div>
        <div className="panel-highlight p-4">
          <h3 className="mb-3 font-semibold">Efficienza media per veicolo</h3>
          <div className="space-y-2 text-sm">{efficienze.map((e) => <div key={e.veicolo} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-2"><span>{e.veicolo}</span><span className="font-semibold text-[var(--accent)]">{e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'N/D'}</span></div>)}</div>
        </div>
      </div>
    </section>
  );
}

export default Report;
