import { LineChart, Line, ResponsiveContainer } from 'recharts'

export default function SensorSparkline({ data = [], color = '#4F8EF7' }) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-8 bg-bg-card-alt rounded flex items-center justify-center">
        <span className="text-[10px] text-text-secondary">Veri yok</span>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={32}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
