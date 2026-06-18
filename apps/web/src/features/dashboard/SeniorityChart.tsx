import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { BucketStat } from "../../shared/types/stats";

/* Consistent indigo-spectrum per level */
const LEVEL_COLORS: Record<string, string> = {
  Intern:  "#f59e0b",
  Junior:  "#34d399",
  Mid:     "#22d3ee",
  Senior:  "#6366f1",
  Lead:    "#a78bfa",
  Unknown: "#3f3f46",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: BucketStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="font-semibold text-zinc-100 mb-1">{d.label}</p>
      <p className="text-zinc-400">{d.count.toLocaleString()} jobs</p>
      <p className="text-zinc-600">{d.percentage.toFixed(1)}% of listings</p>
    </div>
  );
}

export function SeniorityChart({ data }: { data: BucketStat[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
        <span className="text-sm font-semibold text-zinc-100">Seniority Distribution</span>
      </div>
      <div className="px-4 py-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: "#71717a", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
              {data.map((d) => (
                <Cell key={d.label} fill={LEVEL_COLORS[d.label] ?? "#6366f1"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
