import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

export default function RankChart({ marks, rank }) {

  if (marks == null || rank == null) return null;

  const data = [
    { marks: marks - 50, rank: Math.round(rank * 2) },
    { marks: marks - 25, rank: Math.round(rank * 1.5) },
    { marks: marks, rank: rank },
    { marks: marks + 25, rank: Math.round(rank * 0.7) },
    { marks: marks + 50, rank: Math.round(rank * 0.4) }
  ];

  return (
    <div className="mt-6">

      <h3 className="text-lg text-cyan-400 mb-2">
        Rank vs Marks Trend
      </h3>

      <ResponsiveContainer width="100%" height={250}>

        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" stroke="#334155"/>

          <XAxis dataKey="marks" stroke="#94a3b8"/>

          <YAxis stroke="#94a3b8"/>

          <Tooltip/>

          <Line
            type="monotone"
            dataKey="rank"
            stroke="#06b6d4"
            strokeWidth={3}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}