İşte Türkçe çevirisi:

---

# IoT Akıllı Bina Yönetim Sistemi

React, Vite ve Tailwind CSS ile geliştirilmiş kapsamlı bir IoT tabanlı bina yönetim sistemi panosu. Sistem; ziyaretçi takibi, sensör verileri (sıcaklık, nem, gaz seviyeleri) ve güvenlik kamerası olaylarının gerçek zamanlı izlenmesini sağlar.

## Özellikler

- **Ziyaretçi Takibi:** Günlük/haftalık ziyaretçi sayılarını ve ayrıntılı giriş kayıtlarını izleyin.
- **Sensör İzleme:** Birden fazla uç cihazdan (ESP32) gerçek zamanlı sıcaklık, nem ve gaz sensörü verilerini görüntüleyin. Anomali tespiti içerir.
- **Güvenlik Kamerası Entegrasyonu:** İç ve dış bina kameraları (Raspberry Pi Uç Sunucuları) aracılığıyla güvenlik olaylarını ve işaretlenen kişileri takip edin.
- **Yapay Zeka Asistanı Entegrasyonu:** Bina istatistiklerini ve olay günlüklerini sorgulamak için doğal dil arayüzü.
- **Sistem Ayarları ve Durumu:** Donanım durumunu, ping sürelerini izleyin ve sistem genelinde veri senkronizasyonu yapın.
- **Duyarlı Tasarım:** Tailwind CSS ile tasarlanmış modern kullanıcı arayüzü; masaüstü ve mobil görünümleri destekler.

## Teknoloji Yığını

- **Ön Yüz Çerçevesi:** React 18
- **Derleme Aracı:** Vite
- **Stil:** Tailwind CSS
- **İkonlar:** Lucide React
- **Grafikler:** Recharts
- **Yönlendirme:** React Router DOM

## Başlarken

### Ön Koşullar

- Node.js (v18 veya üzeri önerilir)
- npm veya yarn

### Kurulum

1. Depoyu klonlayın:
   ```bash
   git clone https://github.com/kullaniciadi/iot-smart-building.git
   cd iot-smart-building
   ```

2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```

3. Ortam Değişkenlerini Yapılandırın — örnek ortam dosyasını kopyalayın ve kendi ayarlarınızla güncelleyin (gerçek bir arka uç kullanıyorsanız):
   ```bash
   cp .env.example .env
   ```
   *Not: Sistem şu anda sahte verilerle Demo modunda çalışacak şekilde yapılandırılmıştır.*

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

Uygulama `http://localhost:5173` adresinde kullanılabilir olacaktır.

## Demo Modu

Bu proje, yerel sahte veriler ve simüle edilmiş bir arka uç istemcisi kullanılarak çalışacak şekilde yapılandırılmıştır. Demonstrasyon amaçlı kullanım için güvenlidir; çalıştırmak için aktif API anahtarlarına veya veritabanı bağlantılarına ihtiyaç duymaz.

Demo panoya giriş yapmak için aşağıdaki bilgileri kullanın:
- **E-posta:** admin@smartbuilding.io
- **Şifre:** demo1234

## Proje Yapısı

- `/src/components` — Yeniden kullanılabilir kullanıcı arayüzü bileşenleri ve düzen öğeleri
- `/src/pages` — Ana pano görünümleri (Pano, Sensörler, Ziyaretçiler, Güvenlik vb.)
- `/src/lib` — Yardımcı fonksiyonlar, sabitler ve sahte veri/istemci kurulumu
- `/src/hooks` — Özel React kancaları (ör. kimlik doğrulama)
- `/public` — Statik varlıklar ve sahte görseller
- `/sql` — Veritabanı şema tanımları

