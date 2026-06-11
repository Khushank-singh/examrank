import { motion } from "framer-motion";
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot,
} from "recharts";

const JEE_DATA = [
  { marks:50,  rank:950000 }, { marks:80,  rank:750000 },
  { marks:100, rank:550000 }, { marks:120, rank:350000 },
  { marks:150, rank:200000 }, { marks:175, rank:100000 },
  { marks:200, rank:50000  }, { marks:220, rank:25000  },
  { marks:240, rank:10000  }, { marks:260, rank:3200   },
  { marks:280, rank:800    }, { marks:300, rank:1      },
];

const NEET_DATA = [
  { marks:300, rank:900000 }, { marks:360, rank:700000 },
  { marks:400, rank:500000 }, { marks:450, rank:300000 },
  { marks:500, rank:150000 }, { marks:540, rank:95000  },
  { marks:570, rank:50000  }, { marks:600, rank:25000  },
  { marks:630, rank:13000  }, { marks:660, rank:5000   },
  { marks:680, rank:1500   }, { marks:700, rank:100    },
  { marks:720, rank:1      },
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background:"rgba(7,7,26,.96)", border:"1px solid rgba(255,255,255,.14)", borderRadius:10, padding:"10px 14px", fontFamily:"'Sora',sans-serif" }}>
      <p style={{ color:"rgba(255,255,255,.45)", fontSize:12, margin:"0 0 4px" }}>
        Marks: <strong style={{ color:"white" }}>{d.marks}</strong>
      </p>
      <p style={{ color:"rgba(255,255,255,.45)", fontSize:12, margin:0 }}>
        Rank: <strong style={{ color:"white" }}>#{d.rank.toLocaleString()}</strong>
      </p>
    </div>
  );
}

export default function RankChart({ marks, rank, stream }) {
  if (marks == null || rank == null) return null;

  const examType  = stream === "PCM" ? "JEE" : "NEET";
  const data      = examType === "JEE" ? JEE_DATA : NEET_DATA;
  const gradId    = `rankGrad-${examType}`;
  const colors    = examType === "JEE" ? ["#3b82f6", "#8b5cf6"] : ["#10b981", "#06b6d4"];

  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top:10, right:10, left:0, bottom:0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={colors[0]} stopOpacity={0.45} />
              <stop offset="100%" stopColor={colors[1]} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.07)" />

          <XAxis
            dataKey="marks"
            stroke="rgba(255,255,255,.2)"
            tick={{ fill:"rgba(255,255,255,.32)", fontSize:11, fontFamily:"'Sora',sans-serif" }}
          />
          <YAxis
            stroke="rgba(255,255,255,.2)"
            tick={{ fill:"rgba(255,255,255,.32)", fontSize:11, fontFamily:"'Sora',sans-serif" }}
            tickFormatter={v => v >= 1000 ? `${Math.round(v / 1000)}K` : v}
          />

          <Tooltip content={<CustomTooltip />} />

          <Area
            type="monotone"
            dataKey="rank"
            stroke={colors[0]}
            strokeWidth={2.5}
            fill={`url(#${gradId})`}
            dot={false}
          />

          {/* vertical reference line at user's score */}
          <ReferenceLine
            x={marks}
            stroke="rgba(255,255,255,.3)"
            strokeDasharray="4 4"
          />

          {/* dot showing exact position on the curve */}
          <ReferenceDot
            x={marks}
            y={rank}
            r={7}
            fill={colors[0]}
            stroke="white"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontFamily:"'Sora',sans-serif" }}>
        <span style={{ fontSize:13, color:"rgba(255,255,255,.38)" }}>Predicted Rank</span>
        <span style={{ fontSize:13, fontWeight:700, color:"#f59e0b" }}>#{rank.toLocaleString()}</span>
      </div>
    </motion.div>
  );
}
