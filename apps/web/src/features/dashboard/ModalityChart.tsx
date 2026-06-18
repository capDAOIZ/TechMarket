import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { BucketStat } from "../../shared/types/stats";

const COLORS = ["#6366f1", "#22d3ee", "#f59e0b", "#52525b"];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: BucketStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="font-semibold text-zinc-100 mb-1">{d.label}</p>
      <p className="text-zinc-400">{d.count.toLocaleString()} jobs</p>
      <p className="text-zinc-600">{d.percentage.toFixed(1)}%</p>
    </div>
  );
}

function CustomLegend({ payload }: { payload?: { value: string; color: string; payload: BucketStat }[] }) {
  return (
    <div className="flex flex-col gap-2 pl-2">
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span
            className="inline-block w-2 h-2 rounded-sm shrink-0"
            style={{ background: entry.color }}
          />
          <span className="text-zinc-400">{entry.value}</span>
          <span className="text-zinc-600 ml-auto tabular-nums">
            {entry.payload?.percentage?.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export function ModalityChart({ data }: { data: BucketStat[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
        <span className="text-sm font-semibold text-zinc-100">Work Modality</span>
      </div>
      <div className="px-4 py-4">
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="label"
              cx="42%"
              cy="50%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={<CustomLegend />}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
