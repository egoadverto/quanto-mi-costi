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

function Report({ reportData, efficienze }: ReportProps) {
  return (
    <section id="report" className="space-y-3">
      <h2 className="text-xl font-semibold">Report</h2>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-highlight p-4">
          <h3 className="mb-3 font-semibold">Costo totale per veicolo</h3>
          <div className="space-y-2">{reportData.perVeicolo.map(([nome, valore]) => <div key={nome}><div className="mb-1 flex justify-between text-sm"><span>{nome}</span><span>{euro.format(valore)}</span></div><div className="h-2 rounded bg-[var(--border)]"><div className="h-2 rounded bg-[var(--accent)]" style={{ width: `${Math.max(6, (valore / reportData.maxVeicolo) * 100)}%` }} /></div></div>)}</div>
        </div>
        <div className="panel-highlight p-4">
          <h3 className="mb-3 font-semibold">Costo totale per categoria</h3>
          <div className="space-y-2">{reportData.perCategoria.map(([categoria, valore]) => <div key={categoria}><div className="mb-1 flex justify-between text-sm"><span>{categoria}</span><span>{euro.format(valore)}</span></div><div className="h-2 rounded bg-[var(--border)]"><div className="h-2 rounded bg-[var(--accent)]" style={{ width: `${Math.max(6, (valore / reportData.maxCategoria) * 100)}%` }} /></div></div>)}</div>
        </div>
        <div className="panel-highlight p-4">
          <h3 className="mb-3 font-semibold">Totali mensili</h3>
          <div className="space-y-2">{reportData.perMese.map(([mese, valore]) => <div key={mese}><div className="mb-1 flex justify-between text-sm"><span>{mese}</span><span>{euro.format(valore)}</span></div><div className="h-2 rounded bg-[var(--border)]"><div className="h-2 rounded bg-[var(--accent)]" style={{ width: `${Math.max(6, (valore / reportData.maxMese) * 100)}%` }} /></div></div>)}</div>
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
