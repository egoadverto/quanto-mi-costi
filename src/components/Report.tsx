import { euro } from '../utils/format';

type ReportProps = {
  reportData: {
    perVeicolo: [string, number][];
    perCategoria: [string, number][];
    perMese: [string, number][];
    maxMese: number;
  };
  efficienze: { veicolo: string; valore: number | null; unita: string }[];
};

const HorizontalBar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="truncate max-w-[60%]">{label}</span>
        <span className="font-semibold text-[var(--accent)]">{euro.format(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-[var(--surface-variant)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(4, pct)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

const SimpleChart = ({ title, data, colorBase, emptyMsg }: { title: string; data: [string, number][], colorBase: string, emptyMsg?: string }) => {
  const max = data.length > 0 ? Math.max(...data.map(([, v]) => v)) : 0;
  const colors = [colorBase, '#f59e0b', '#ef4444', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  if (data.length === 0) {
    return (
      <div className="panel-highlight p-4">
        <h3 className="mb-3 font-semibold">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)]">{emptyMsg || 'Nessun dato'}</p>
      </div>
    );
  }

  return (
    <div className="panel-highlight p-4">
      <h3 className="mb-3 font-semibold">{title}</h3>
      <div className="space-y-3">
        {data.map(([label, value], i) => (
          <HorizontalBar key={label} label={label} value={value} max={max} color={colors[i % colors.length]} />
        ))}
      </div>
    </div>
  );
};

const MonthlyBars = ({ data, maxValue }: { data: [string, number][], maxValue: number }) => {
  if (data.length === 0) {
    return (
      <div className="panel-highlight p-4">
        <h3 className="mb-3 font-semibold">Andamento mensile</h3>
        <p className="text-sm text-[var(--text-secondary)]">Nessun dato</p>
      </div>
    );
  }

  return (
    <div className="panel-highlight p-4">
      <h3 className="mb-3 font-semibold">Andamento mensile</h3>
      <div className="space-y-2">
        {data.map(([mese, valore]) => (
          <div key={mese} className="flex items-center gap-3">
            <span className="text-sm text-[var(--text-secondary)] w-20 shrink-0">{mese}</span>
            <div className="flex-1 h-4 rounded-full bg-[var(--surface-variant)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, (valore / maxValue) * 100)}%` }} />
            </div>
            <span className="text-sm font-semibold w-20 text-right">{euro.format(valore)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const EfficiencyList = ({ efficienze }: { efficienze: { veicolo: string; valore: number | null; unita: string }[] }) => {
  return (
    <div className="panel-highlight p-4">
      <h3 className="mb-3 font-semibold">Efficienza media</h3>
      {efficienze.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">Nessun dato</p>
      ) : (
        <div className="space-y-2">
          {efficienze.map((e) => (
            <div key={e.veicolo} className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
              <span className="text-sm font-medium">{e.veicolo}</span>
              <span className="text-sm font-bold text-[var(--accent)]">
                {e.valore ? `${e.valore.toFixed(2)} ${e.unita}` : 'N/D'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function Report({ reportData, efficienze }: ReportProps) {
  return (
    <section id="report" className="space-y-4">
      <h2 className="text-xl font-semibold">Report</h2>
      <div className="grid gap-4">
        <SimpleChart title="Costo per veicolo" data={reportData.perVeicolo} colorBase="#f9a825" emptyMsg="Nessun veicolo con costi" />
        <SimpleChart title="Costo per categoria" data={reportData.perCategoria} colorBase="#f59e0b" emptyMsg="Nessuna spesa registrata" />
        <MonthlyBars data={reportData.perMese} maxValue={reportData.maxMese} />
        <EfficiencyList efficienze={efficienze} />
      </div>
    </section>
  );
}

export default Report;