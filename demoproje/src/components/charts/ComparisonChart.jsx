import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border-subtle rounded-btn px-3 py-2 text-xs">
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value} kişi
        </p>
      ))}
    </div>
  )
}

export default function ComparisonChart({ data = [], periodALabel = 'Dönem A', periodBLabel = 'Dönem B' }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          dx={-8}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="line"
          wrapperStyle={{ fontSize: 12, color: '#94A3B8' }}
        />
        <Line
          type="monotone"
          dataKey="periodA"
          name={periodALabel}
          stroke="#4F8EF7"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="periodB"
          name={periodBLabel}
          stroke="#10B981"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
