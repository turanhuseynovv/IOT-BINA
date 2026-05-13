import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

const SUGGESTED_QUESTIONS = [
  'Bu hafta kaç ziyaretçi geldi?',
  'En yoğun saat hangisiydi?',
  'Sensörlerde anomali var mı?',
  'Dün şüpheli tespit edildi mi?',
  'Sıcaklık ve nem ortalaması nedir?',
]

// ── Mock AI Response Generator ──
function generateMockResponse(question, context) {
  const q = question.toLowerCase()

  if (q.includes('ziyaretçi') || q.includes('kaç') || q.includes('geldi')) {
    return `📊 Bu hafta toplam **${context.weeklyCount}** ziyaretçi kaydı tespit edildi. Bugün **${context.todayCount}** giriş işlemi gerçekleşti. Benzersiz kişi sayısı: **${context.uniqueToday}**.`
  }
  if (q.includes('yoğun') || q.includes('saat')) {
    return `⏰ Bugünkü en yoğun saat **${context.busiestHour}** olarak tespit edildi. Genel olarak iş saatleri (09:00-17:00) arasında yoğunluk artmaktadır.`
  }
  if (q.includes('anomali') || q.includes('sensör') || q.includes('gaz')) {
    return `🔍 Sensör analizi:\n${context.anomalyStr}\n\n• Ortalama sıcaklık: **${context.avgTemp}°C**\n• Ortalama nem: **%${context.avgHum}**`
  }
  if (q.includes('şüpheli') || q.includes('güvenlik') || q.includes('kamera')) {
    return `🔒 Güvenlik durumu:\n• Bugün tespit edilen şüpheli: **${context.todaySuspects}**\n• Dün tespit edilen şüpheli: **${context.yesterdaySuspects}**\n\nTüm tespitler "Şüpheli Şahıs" sayfasından incelenebilir.`
  }
  if (q.includes('sıcaklık') || q.includes('nem')) {
    return `🌡️ Anlık çevresel durum:\n• Ortalama sıcaklık: **${context.avgTemp}°C**\n• Ortalama nem: **%${context.avgHum}**\n• Sensör konumları: ${context.sensorLocations}\n\nDeğerler normal aralıkta seyretmektedir.`
  }
  if (q.includes('merhaba') || q.includes('selam') || q.includes('nasıl')) {
    return `Merhaba! 👋 Ben IoT Akıllı Bina Takip Sistemi asistanıyım. Size ziyaretçi istatistikleri, sensör verileri ve güvenlik durumu hakkında bilgi verebilirim. Ne sormak istersiniz?`
  }

  return `📋 Güncel sistem özeti:\n• Bugünkü ziyaretçi: **${context.todayCount}**\n• Haftalık toplam: **${context.weeklyCount}**\n• Ortalama sıcaklık: **${context.avgTemp}°C**\n• Ortalama nem: **%${context.avgHum}**\n• ${context.anomalyStr}\n\nDaha spesifik bir soru sorabilirsiniz!`
}

export default function AssistantPage() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recentQuestions, setRecentQuestions] = useState([])
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function getContext() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    const lastWeek = new Date(today)
    lastWeek.setDate(lastWeek.getDate() - 7)

    const [{ data: weeklyVisits }, { data: sensors }, { data: camera }] = await Promise.all([
      supabase.from('ziyaretler').select('*').gte('created_at', lastWeek.toISOString()).order('created_at', { ascending: false }),
      supabase.from('sensor_data').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('camera_events').select('*').eq('is_flagged', true).gte('captured_at', lastWeek.toISOString()).order('captured_at', { ascending: false }),
    ])

    const allVisits = weeklyVisits || []
    const todayVisits = allVisits.filter(v => new Date(v.created_at || v.tarih) >= today)
    
    const weeklyCount = allVisits.length
    const uniqueToday = new Set(todayVisits.map(v => v.kisi_id)).size
    
    const hourCounts = {}
    todayVisits.forEach(v => {
      const h = new Date(v.created_at || v.tarih).getHours()
      hourCounts[h] = (hourCounts[h] || 0) + 1
    })
    const busiestHour = Object.keys(hourCounts).length > 0 
      ? `${Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b)}:00`
      : 'Veri yok'

    const sensorList = sensors || []
    const temps = sensorList.map((s) => Number(s.sicaklik)).filter((v) => !isNaN(v))
    const hums = sensorList.map((s) => Number(s.nem)).filter((v) => !isNaN(v))
    const gasAlerts = sensorList.filter((s) => s.gaz === true).length
    
    const highTemps = temps.filter(t => t > 30).length
    let anomalyStr = gasAlerts > 0 ? `${gasAlerts} adet gaz uyarısı var.` : 'Gaz uyarısı yok.'
    if (highTemps > 0) anomalyStr += ` Ayrıca ${highTemps} kez 30 derece üstü sıcaklık tespit edildi.`
    else anomalyStr += ' Sıcaklıklar normal.'

    const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 'Veri yok'
    const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : 'Veri yok'

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdaySuspects = (camera || []).filter(c => {
      const d = new Date(c.captured_at)
      return d >= yesterday && d < today
    }).length

    const todaySuspects = (camera || []).filter(c => new Date(c.captured_at) >= today).length
    const sensorLocations = [...new Set(sensorList.map((s) => `${s.kat}/${s.oda}`))].join(', ') || 'Yok'

    return {
      todayCount: todayVisits.length,
      uniqueToday,
      weeklyCount,
      busiestHour,
      anomalyStr,
      avgTemp,
      avgHum,
      todaySuspects,
      yesterdaySuspects,
      sensorLocations,
    }
  }

  async function handleSend(text) {
    const q = text || input.trim()
    if (!q) return

    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: q }])
    setRecentQuestions((prev) => [q, ...prev.filter((x) => x !== q)].slice(0, 5))
    setLoading(true)

    try {
      const context = await getContext()

      // Simulate API delay for realism
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))

      const reply = generateMockResponse(q, context)
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: `Hata: ${err.message}` }])
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-130px)]">
      {/* Left Sidebar */}
      <div className="w-assistant-sidebar shrink-0 space-y-6">
        <div className="bg-bg-card border border-border-subtle rounded-card p-4">
          <h3 className="text-xs font-semibold text-text-secondary mb-3">Önerilen Sorular</h3>
          <div className="space-y-1.5">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button key={i} onClick={() => handleSend(q)} className="w-full text-left px-3 py-2 text-xs text-text-secondary bg-bg-card-alt rounded-btn hover:text-text-primary hover:bg-bg-primary transition-colors duration-150">
                {q}
              </button>
            ))}
          </div>
        </div>

        {recentQuestions.length > 0 && (
          <div className="bg-bg-card border border-border-subtle rounded-card p-4">
            <h3 className="text-xs font-semibold text-text-secondary mb-3">Son Sorular</h3>
            <div className="space-y-1">
              {recentQuestions.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)} className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors duration-150 flex items-center gap-2">
                  <Clock size={10} className="shrink-0" />{q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col bg-bg-card border border-border-subtle rounded-card overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <span className="text-sm font-semibold text-text-primary">Bina Asistanı</span>
          </div>
          <span className="text-[10px] text-success flex items-center gap-1">
            <CheckCircle size={10} />Demo Asistan Aktif
          </span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles size={32} className="text-text-secondary mb-3" />
              <p className="text-sm text-text-secondary">Bina hakkında bir soru sorun</p>
              <p className="text-xs text-text-secondary mt-1">Türkçe veya İngilizce sorabilirsiniz</p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn('max-w-md px-4 py-2.5 rounded-card text-sm', m.role === 'user' ? 'bg-accent text-white' : 'bg-bg-card-alt text-text-primary')}>
                {m.role !== 'user' && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles size={12} className="text-accent" />
                    <span className="text-[10px] text-text-secondary">Asistan</span>
                  </div>
                )}
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-bg-card-alt rounded-card px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-end gap-2">
            <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Bir soru sorun…" className="flex-1 resize-none max-h-24" />
            <button onClick={() => handleSend()} disabled={loading || !input.trim()} className="h-9 w-9 bg-accent rounded-btn flex items-center justify-center hover:bg-accent/90 transition-colors duration-150 disabled:opacity-40 shrink-0">
              <Send size={16} className="text-white" />
            </button>
          </div>
          <p className="text-[10px] text-text-secondary mt-2">Demo asistan ile desteklenmektedir</p>
        </div>
      </div>
    </div>
  )
}
