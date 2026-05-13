import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ErrorBar } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-bg-card border border-border-subtle rounded-btn px-3 py-2 text-xs">
      <p className="text-text-secondary mb-1">{label}</p>
      <p className="text-text-primary font-semibold">
        {d.min} – {d.max} kişi
      </p>
      {d.predicted && (
        <p className="text-accent">Tahmin: {d.predicted}</p>
      )}
    </div>
  )
}

export default function PredictionBarChart({ data = [], todayIndex = -1 }) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-3 justify-end px-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#1A1A24] border border-border-subtle" />
          <span className="text-[10px] text-text-secondary">Geçmiş Günler</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#4F8EF7]" />
          <span className="text-[10px] text-text-secondary">Bugün</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[rgba(79,142,247,0.4)]" />
          <span className="text-[10px] text-text-secondary">Gelecek Tahmini</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={270}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
          <Bar dataKey="predicted" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={index === todayIndex ? '#4F8EF7' : index < todayIndex ? '#1A1A24' : 'rgba(79,142,247,0.4)'}
                stroke={index === todayIndex ? '#4F8EF7' : 'none'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
