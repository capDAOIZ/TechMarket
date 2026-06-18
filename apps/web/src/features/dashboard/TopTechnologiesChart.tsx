import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { TechnologyStat } from "../../shared/types/stats";

/* Monochromatic indigo-to-slate palette — professional, not rainbow */
const COLORS = [
  "#6366f1", "#818cf8", "#a5b4fc", "#c7d2fe",
  "#4f46e5", "#4338ca", "#3730a3", "#312e81",
  "#6d28d9", "#7c3aed",
];

const trendIcon = (d: TechnologyStat["trendDirection"]) =>
  d === "up" ? "↑" : d === "down" ? "↓" : "→";

const trendColor = (d: TechnologyStat["trendDirection"]) =>
  d === "up" ? "#34d399" : d === "down" ? "#f87171" : "#52525b";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: TechnologyStat }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="font-semibold text-zinc-100 mb-1">{d.technology}</p>
      <p className="text-zinc-400">{d.jobCount.toLocaleString()} jobs</p>
      <p className="text-zinc-600">{d.percentage.toFixed(1)}% of listings</p>
      <p className="font-semibold mt-1" style={{ color: trendColor(d.trendDirection) }}>
        {trendIcon(d.trendDirection)} {d.trendDirection}
      </p>
    </div>
  );
}

export function TopTechnologiesChart({ data }: { data: TechnologyStat[] }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
        <span className="text-sm font-semibold text-zinc-100">Top Technologies</span>
        <span className="text-xs text-zinc-600">by job count</span>
      </div>
      <div className="px-4 pt-4 pb-3">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="technology"
              width={88}
              tick={{ fill: "#71717a", fontSize: 11, fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
            <Bar dataKey="jobCount" radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Trend legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 pt-3 border-t border-zinc-800">
          {data.slice(0, 6).map((d, i) => (
            <span key={d.technology} className="inline-flex items-center gap-1.5 text-[10px] text-zinc-600">
              <span
                className="inline-block w-2 h-2 rounded-sm shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              {d.technology}
              <span style={{ color: trendColor(d.trendDirection) }} className="font-bold">
                {trendIcon(d.trendDirection)}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
