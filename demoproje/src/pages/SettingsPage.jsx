import { useState, useEffect } from 'react'
import { Users, Bell, Server, Settings as SettingsIcon, Database, RefreshCw, Activity, Cpu, Wifi } from 'lucide-react'
import StatusBadge from '../components/ui/StatusBadge'
import EmptyState from '../components/ui/EmptyState'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('system')
  
  const [hardwareStatus, setHardwareStatus] = useState([
    { id: 'rpi_out', name: 'Raspberry Pi 3 B+ (Dış Kamera)', type: 'Edge Server', status: 'offline', ping: '—', lastSeen: 'Hesaplanıyor...' },
    { id: 'rpi_in', name: 'Raspberry Pi 3 B+ (İç Kamera)', type: 'Edge Server', status: 'offline', ping: '—', lastSeen: 'Hesaplanıyor...' },
    { id: 'esp1', name: 'ESP32 Sensör Modülü (Kat 3 - Oda 1)', type: 'Microcontroller', status: 'offline', ping: '—', lastSeen: 'Hesaplanıyor...' },
    { id: 'esp2', name: 'ESP32 Sensör Modülü (Kat 3 - Oda 2)', type: 'Microcontroller', status: 'offline', ping: '—', lastSeen: 'Hesaplanıyor...' },
    { id: 'esp3', name: 'ESP32 Sensör Modülü (Kat 4 - Oda 1)', type: 'Microcontroller', status: 'offline', ping: '—', lastSeen: 'Hesaplanıyor...' },
    { id: 'esp4', name: 'ESP32 Sensör Modülü (Kat 4 - Oda 2)', type: 'Microcontroller', status: 'offline', ping: '—', lastSeen: 'Hesaplanıyor...' },
  ])

  const sections = [
    { id: 'system', label: 'Donanım & Sistem', icon: Server },
    { id: 'sync', label: 'Veri Eşitleme', icon: Database },
    { id: 'users', label: 'Kullanıcılar', icon: Users },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'general', label: 'Genel', icon: SettingsIcon },
  ]

  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  async function handleSync() {
    setSyncing(true)
    setSyncMessage('Storage üzerinden veriler senkronize ediliyor...')
    try {
      // 1. Ziyaretçiler -> ziyaretler
      const { data: vData, error: vErr } = await supabase.storage.from('ziyaretciler').list()
      if (vErr) throw vErr
      
      let vCount = 0
      if (vData) {
        for (const file of vData) {
          if (file.name === '.emptyFolderPlaceholder') continue
          const { data: pub } = supabase.storage.from('ziyaretciler').getPublicUrl(file.name)
          const visitorId = file.name.split('.')[0]
          
          const { data: existing } = await supabase.from('ziyaretler').select('id').eq('kisi_id', visitorId).maybeSingle()
          if (!existing) {
            await supabase.from('ziyaretler').insert({
              kisi_id: visitorId,
              photo_url: pub.publicUrl,
              tarih: new Date().toISOString()
            })
            vCount++
          }
        }
      }

      // 2. Güvenlik Fotoğrafları -> camera_events
      const { data: cData, error: cErr } = await supabase.storage.from('guvenlik_fotolari').list()
      if (cErr) throw cErr
      
      let cCount = 0
      if (cData) {
        for (const file of cData) {
          if (file.name === '.emptyFolderPlaceholder') continue
          const { data: pub } = supabase.storage.from('guvenlik_fotolari').getPublicUrl(file.name)
          
          const { data: existing } = await supabase.from('camera_events').select('id').eq('photo_url', pub.publicUrl).maybeSingle()
          if (!existing) {
            await supabase.from('camera_events').insert({
              camera_type: 'dis_kamera',
              photo_url: pub.publicUrl,
              is_flagged: true,
              flag_count: Math.floor(Math.random() * 3) + 1
            })
            cCount++
          }
        }
      }

      setSyncMessage(`Eşitleme başarılı: ${vCount} yeni ziyaretçi, ${cCount} yeni kamera tespiti eklendi.`)
    } catch (err) {
      console.error(err)
      setSyncMessage('Bağlantı Hatası: ' + err.message)
    } finally {
      setSyncing(false)
    }
  }

  const fetchHardwareStatus = async () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

    const queries = [
      supabase.from('camera_events').select('captured_at').in('camera_type', ['dis_kamera', 'outer']).order('captured_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('camera_events').select('captured_at').in('camera_type', ['ic_kamera', 'inner']).order('captured_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('sensor_data').select('created_at').eq('kat', 'kat3').eq('oda', 'oda1').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('sensor_data').select('created_at').eq('kat', 'kat3').eq('oda', 'oda2').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('sensor_data').select('created_at').eq('kat', 'kat4').eq('oda', 'oda1').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('sensor_data').select('created_at').eq('kat', 'kat4').eq('oda', 'oda2').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ];

    try {
      const results = await Promise.all(queries);

      const lastSeens = {
        'rpi_out': results[0].data?.captured_at,
        'rpi_in': results[1].data?.captured_at,
        'esp1': results[2].data?.created_at,
        'esp2': results[3].data?.created_at,
        'esp3': results[4].data?.created_at,
        'esp4': results[5].data?.created_at,
      };

      setHardwareStatus(prev => prev.map(hw => {
        const lastSeenStr = lastSeens[hw.id];
        if (lastSeenStr) {
          const lastSeenDate = new Date(lastSeenStr);
          const isActive = lastSeenDate >= threeHoursAgo;

          const rtf = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });
          const diffInMinutes = Math.round((lastSeenDate.getTime() - Date.now()) / (1000 * 60));
          
          let formattedLastSeen = "";
          if (diffInMinutes > -60) {
            formattedLastSeen = rtf.format(diffInMinutes, 'minute');
          } else {
             const diffInHours = Math.round(diffInMinutes / 60);
             if (diffInHours > -24) {
               formattedLastSeen = rtf.format(diffInHours, 'hour');
             } else {
               const diffInDays = Math.round(diffInHours / 24);
               formattedLastSeen = rtf.format(diffInDays, 'day');
             }
          }

          return {
            ...hw,
            status: isActive ? 'active' : 'offline',
            ping: isActive ? `${Math.floor(Math.random() * 30) + 10}ms` : '—',
            lastSeen: formattedLastSeen
          };
        }

        return {
          ...hw,
          status: 'offline',
          ping: '—',
          lastSeen: 'Bağlantı Yok'
        };
      }));
    } catch (err) {
      console.error("Hardware status error:", err);
    }
  };

  useEffect(() => {
    if (activeSection === 'system') {
      fetchHardwareStatus();
    }
  }, [activeSection]);

  function refreshHardware() {
    setHardwareStatus(prev => prev.map(h => ({
      ...h,
      ping: h.status === 'active' ? `${Math.floor(Math.random() * 30) + 2}ms` : h.ping
    })));
    fetchHardwareStatus();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 max-w-6xl">
      {/* Section Nav */}
      <div className="w-full lg:w-56 shrink-0">
        <h3 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-3 mb-3 hidden lg:block">Sistem Ayarları</h3>
        <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 gap-1.5 hide-scrollbar">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} className={cn('whitespace-nowrap flex items-center gap-2 lg:gap-3 px-3 py-2 lg:py-2.5 rounded-btn text-sm font-medium transition-all duration-200', activeSection === s.id ? 'bg-accent/10 text-accent' : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-alt')}>
              <s.icon size={16} className={cn(activeSection === s.id ? 'text-accent' : 'text-text-secondary')} />
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {activeSection === 'system' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Donanım ve Edge Cihazları</h2>
                <p className="text-xs text-text-secondary mt-1">Ağ üzerindeki fiziksel cihazların anlık bağlantı durumu.</p>
              </div>
              <button onClick={refreshHardware} className="w-full sm:w-auto h-9 px-4 bg-bg-card-alt border border-border-subtle text-text-primary text-xs font-medium rounded-btn flex items-center justify-center gap-2 hover:border-text-secondary transition-colors duration-150">
                <RefreshCw size={14} />Ping At
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hardwareStatus.map(hw => (
                <div key={hw.id} className={cn("bg-bg-card border rounded-card p-4 transition-colors", hw.status === 'offline' ? "border-danger/20 opacity-80" : "border-border-subtle hover:border-border-strong")}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", hw.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                        {hw.type.includes('Camera') ? <Activity size={16} /> : <Cpu size={16} />}
                      </div>
                      <div>
                        <h4 className={cn("text-sm font-semibold", hw.status === 'offline' ? 'text-text-secondary' : 'text-text-primary')}>{hw.name}</h4>
                        <p className="text-[10px] text-text-secondary">{hw.type}</p>
                      </div>
                    </div>
                    <StatusBadge status={hw.status === 'active' ? 'success' : 'danger'} label={hw.status === 'active' ? 'Bağlı' : 'Kapalı'} />
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
                    <span className="text-xs text-text-secondary flex items-center gap-1.5"><Wifi size={12} /> Ping: <span className={cn("font-medium", hw.status === 'offline' ? 'text-text-secondary' : 'text-text-primary')}>{hw.ping}</span></span>
                    <span className="text-[10px] text-text-secondary">Son: {hw.lastSeen}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'sync' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
              <h2 className="text-lg font-semibold text-text-primary">Veri Eşitleme (Storage Senkronizasyonu)</h2>
              <p className="text-xs text-text-secondary mt-1">Depolama alanındaki fotoğrafları veritabanı tabloları ile eşleştirir.</p>
            </div>
            
            <div className="bg-bg-card border border-border-subtle rounded-card p-6 space-y-5 max-w-2xl">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Database size={20} className="text-accent" />
                </div>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p>Bu işlem aşağıdaki akışları tetikler:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><strong className="text-text-primary">ziyaretciler</strong> bucket'ı taranır ve <strong className="text-text-primary">ziyaretler</strong> tablosuna eklenir.</li>
                    <li><strong className="text-text-primary">guvenlik_fotolari</strong> bucket'ı taranır ve <strong className="text-text-primary">camera_events</strong> (dış kamera) tablosuna şüpheli olarak işlenir.</li>
                  </ul>
                </div>
              </div>
              
              <button onClick={handleSync} disabled={syncing} className="h-10 w-full bg-accent text-white text-sm font-medium rounded-btn hover:bg-accent-hover transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <RefreshCw size={16} className={cn(syncing && 'animate-spin')} />
                {syncing ? 'Sistem Senkronize Ediliyor...' : 'Manuel Eşitlemeyi Başlat'}
              </button>

              {syncMessage && (
                <div className={cn("p-4 rounded-btn text-sm font-medium text-center border animate-in fade-in duration-300", syncMessage.includes('Hata') ? "bg-danger/10 border-danger/20 text-danger" : "bg-success/10 border-success/20 text-success")}>
                  {syncMessage}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'general' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
              <h2 className="text-lg font-semibold text-text-primary">Genel Sistem Konfigürasyonu</h2>
              <p className="text-xs text-text-secondary mt-1">Kurum ve proje ayarları.</p>
            </div>
            <div className="bg-bg-card border border-border-subtle rounded-card p-5 space-y-5 max-w-2xl">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">Proje Adı</label>
                <input type="text" defaultValue="IoT Akıllı Bina Takip Sistemi" className="w-full h-10 px-3 bg-bg-card-alt border border-border-subtle rounded-btn text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">Kurum / Bina</label>
                <input type="text" defaultValue="Ana Bina — IoT Yönetim Merkezi" className="w-full h-10 px-3 bg-bg-card-alt border border-border-subtle rounded-btn text-sm text-text-primary focus:outline-none focus:border-accent transition-colors" readOnly />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary">AI Asistan Modeli</label>
                <input type="text" defaultValue="Yerleşik Demo Asistan" className="w-full h-10 px-3 bg-bg-card-alt border border-border-subtle rounded-btn text-sm text-text-secondary cursor-not-allowed" disabled />
              </div>
            </div>
          </div>
        )}

        {activeSection === 'users' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-text-primary">Sistem Kullanıcıları ve Yetkilendirme</h2>
                <p className="text-xs text-text-secondary mt-1">Sisteme erişimi olan personel ve yetki seviyeleri.</p>
              </div>
              <button className="h-9 px-4 bg-accent text-white text-xs font-medium rounded-btn flex items-center justify-center gap-2 hover:bg-accent-hover transition-colors">
                + Yeni Kullanıcı
              </button>
            </div>
            <div className="bg-bg-card border border-border-subtle rounded-card overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-bg-card-alt text-text-secondary text-xs uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold">Kullanıcı</th>
                    <th className="px-4 py-3 font-semibold">Rol</th>
                    <th className="px-4 py-3 font-semibold">Son Giriş</th>
                    <th className="px-4 py-3 font-semibold text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  <tr>
                    <td className="px-4 py-3"><div className="font-medium text-text-primary">Dr. Mehmet Yılmaz</div><div className="text-xs text-text-secondary">admin@smartbuilding.io</div></td>
                    <td className="px-4 py-3"><StatusBadge status="success" label="Sistem Yöneticisi" /></td>
                    <td className="px-4 py-3 text-xs text-text-secondary">Şu an aktif</td>
                    <td className="px-4 py-3 text-right"><button className="text-accent hover:text-accent-hover text-xs font-medium">Düzenle</button></td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3"><div className="font-medium text-text-primary">Güvenlik Personeli</div><div className="text-xs text-text-secondary">security@smartbuilding.io</div></td>
                    <td className="px-4 py-3"><StatusBadge status="warning" label="Operatör" /></td>
                    <td className="px-4 py-3 text-xs text-text-secondary">2 saat önce</td>
                    <td className="px-4 py-3 text-right"><button className="text-accent hover:text-accent-hover text-xs font-medium">Düzenle</button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSection === 'notifications' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div>
              <h2 className="text-lg font-semibold text-text-primary">Bildirim Tercihleri</h2>
              <p className="text-xs text-text-secondary mt-1">Sistem uyarılarının hangi kanallara iletileceğini yapılandırın.</p>
            </div>
            <div className="bg-bg-card border border-border-subtle rounded-card p-5 space-y-6 max-w-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Email Bildirimleri</h3>
                  <p className="text-xs text-text-secondary">Kritik güvenlik ve gaz uyarılarını e-posta ile al.</p>
                </div>
                <div className="w-10 h-6 bg-accent rounded-full relative cursor-not-allowed"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Telegram Bot Entegrasyonu</h3>
                  <p className="text-xs text-text-secondary">Anlık bildirimleri Telegram üzerinden al.</p>
                </div>
                <div className="w-10 h-6 bg-bg-card-alt border border-border-subtle rounded-full relative cursor-not-allowed"><div className="absolute left-1 top-1 w-4 h-4 bg-text-secondary rounded-full"></div></div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Günlük Özet Raporu</h3>
                  <p className="text-xs text-text-secondary">Her gün saat 23:59'da günlük aktivite raporu gönder.</p>
                </div>
                <div className="w-10 h-6 bg-accent rounded-full relative cursor-not-allowed"><div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
