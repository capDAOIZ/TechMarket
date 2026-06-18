import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Legend, CartesianGrid,
} from "recharts";
import type { TechnologyTrendPoint } from "../../shared/types/stats";
import { format, parseISO } from "date-fns";

const TECH_COLORS: Record<string, string> = {
  Python:     "#818cf8",
  TypeScript: "#22d3ee",
  React:      "#34d399",
  Go:         "#f59e0b",
  Rust:       "#f472b6",
  Kubernetes: "#a78bfa",
  AWS:        "#60a5fa",
  Docker:     "#4ade80",
  "Node.js":  "#fb923c",
  GraphQL:    "#e879f9",
};

const FALLBACK_COLORS = Object.values(TECH_COLORS);

function getColor(tech: string, index: number) {
  return TECH_COLORS[tech] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function pivot(
  data: TechnologyTrendPoint[],
  selected: string[]
): Record<string, number | string>[] {
  const byWeek: Record<string, Record<string, number | string>> = {};
  data
    .filter((d) => selected.includes(d.technology))
    .forEach(({ week, technology, jobCount }) => {
      if (!byWeek[week]) byWeek[week] = { week };
      byWeek[week][technology] = jobCount;
    });
  return Object.values(byWeek).sort((a, b) =>
    String(a.week).localeCompare(String(b.week))
  );
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; color: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-xs shadow-xl min-w-[160px]">
      <p className="font-semibold text-zinc-100 mb-2">
        Week of {format(parseISO(String(label)), "MMM d")}
      </p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-semibold text-zinc-100 tabular-nums">
            {p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

type TechnologyTrendChartProps = {
  data: TechnologyTrendPoint[];
  selected: string[];
};

export function TechnologyTrendChart({ data, selected }: TechnologyTrendChartProps) {
  const pivoted = pivot(data, selected);

  if (selected.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px] text-sm text-zinc-600">
        Select at least one technology to display trends.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={360}>
      <LineChart data={pivoted} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="week"
          tickFormatter={(v) => format(parseISO(v), "MMM d")}
          tick={{ fill: "#52525b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "#52525b", fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, color: "#71717a" }} />
        {selected.map((tech, i) => (
          <Line
            key={tech}
            type="monotone"
            dataKey={tech}
            stroke={getColor(tech, i)}
            strokeWidth={2}
            dot={{ r: 3, strokeWidth: 0, fill: getColor(tech, i) }}
            activeDot={{ r: 5 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
