import { cn, getScoreColor } from '../../lib/utils'

export default function ComfortGauge({ score, sensorAverages = {} }) {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const normalizedScore = score != null ? Math.max(0, Math.min(100, score)) : 0
  const offset = circumference - (normalizedScore / 100) * circumference

  const strokeColor =
    score == null ? '#1A1A24' : score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444'

  return (
    <div className="flex flex-col items-center">
      {/* Circular Gauge */}
      <div className="relative w-44 h-44 mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#1A1A24"
            strokeWidth="10"
          />
          {/* Progress arc */}
          {score != null && (
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={strokeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-500 ease-out"
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn('text-metric-lg', getScoreColor(score))}>
            {score != null ? score : '—'}
          </span>
          <span className="text-[10px] text-text-secondary mt-1">Konfor Skoru</span>
        </div>
      </div>

      {/* Sensor breakdown */}
      <div className="w-full space-y-2">
        {[
          { key: 'temperature', label: 'Sıcaklık', unit: '°C', max: 40 },
          { key: 'humidity', label: 'Nem', unit: '%', max: 100 },
        ].map((sensor) => {
          const value = sensorAverages[sensor.key]
          const hasValue = value != null

          return (
            <div key={sensor.key} className="flex items-center gap-3">
              <span className="text-xs text-text-secondary w-16 shrink-0">{sensor.label}</span>
              <div className="flex-1 h-1.5 bg-bg-card-alt rounded-full overflow-hidden">
                {hasValue && (
                  <div
                    className="h-full rounded-full bg-accent/60 transition-all duration-300"
                    style={{ width: `${Math.min(100, (value / sensor.max) * 100)}%` }}
                  />
                )}
              </div>
              <span className="text-xs text-text-primary w-16 text-right shrink-0">
                {hasValue ? `${value.toFixed(1)} ${sensor.unit}` : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
