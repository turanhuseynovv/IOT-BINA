import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card border border-border-subtle rounded-btn px-3 py-2 text-xs">
      <p className="text-text-secondary mb-1">{label}</p>
      <p className="text-text-primary font-semibold">{payload[0].value} ziyaretçi</p>
    </div>
  )
}

export default function VisitorLineChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="hour"
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
        <Line
          type="monotone"
          dataKey="count"
          stroke="#4F8EF7"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#4F8EF7', stroke: '#0A0A0F', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
