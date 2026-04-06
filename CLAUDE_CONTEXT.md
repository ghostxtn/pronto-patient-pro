# MediBook (Pronto Patient Pro) — AI Context & Architecture Guide

Bu dosya projeyi bilmeyen bir yapay zeka asistanına (Claude, Gemini vb.) projenin tüm mimarisini, dosya yapısını, kurallarını ve çalışma mantığını öğretmek için hazırlanmıştır. Önündeki tasklara başlamadan önce **bu mimari kuralları ve sistemi baz alarak** hareket et.

---

## 1. Proje Özeti
MediBook, modern klinikler için geliştirilmiş kapsamlı bir randevu, personel, hasta ve doktor yönetim platformudur.
Uygulamada **5 farklı rol** bulunur ve her rolün kendi dashboard'u ile yetki kapsamı vardır:
- **Owner**: Tüm kliniğin sahibi. Üst düzey sistem ve finansal ayarlar.
- **Admin**: Klinik yöneticisi. Doktor ve personel ekleme, çıkarma, kliniği konfigüre etme yetkisi.
- **Staff (Sekreter)**: Telefonla veya yüz yüze gelen hastaları kaydeder, randevuları oluşturur, tüm doktorların takvimlerini yönetir.
- **Doctor**: Kendi randevularını görüntüler, müdahale notlarını yazar (Clinical Notes), rutin müsaitlik (availability) ve izinlerini (blackout / özel saatler) belirler.
- **Patient**: Müşferi/Hasta portalı. Sistemden doktor arar, kendi randevusunu alır, iptal eder ve profilini günceller. (Aynı zamanda landing page üzerinden dışa açık web sitesi bulunur).

---

## 2. Teknoloji Stack'i

### Frontend (Bu repo'nun ana odak noktası)
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS + Özel CSS (`src/index.css` içerisinde CSS variables kullanılarak theme yönetimi uygulanmıştır. Koyu tema (Dark mode) desteklenir).
- **UI Components:** `shadcn/ui` bileşenleri (Radix UI tabanlıdır), Framer Motion (Animasyonlar), Lucide React (İkonlar), Sonner / Toast (Bildirimler).
- **Data Fetching:** `@tanstack/react-query` v5. Veriler her zaman Query aracılığıyla getirilir ve Mutation aracılığıyla değiştirilir.
- **Routing:** `react-router-dom` v6
- **Takvim Bileşeni:** `react-big-calendar` (uyarlamalı dizayn ve mobil uyumluluk için modifiye edilmiştir) + `date-fns` (Zaman hesaplamaları).

### Backend (Klasör: `/backend`)
- **Framework:** NestJS
- **Database:** PostgreSQL + Drizzle ORM
- **Cache & Geçici Veri:** Redis
- **Auth:** JWT tabanlı (Access ve Refresh Token) + Google OAuth entegrasyonu.

---

## 3. Kesin Mimari Kurallar ve Yapay Zeka (AI) Talimatları

Projede kod yazarken **aşağıdaki kurallara kesinlikle uy:**

1. **Backend Her Zaman Otoritedir:**
   - Frontend asla kompleks randevu algoritmaları, çakışma (overlap) hesaplamaları veya mantıksal yetkilendirme doğrulama kararları almamalıdır.
   - Frontend'de çakışma olsa bile UI optimistik davranmamalı, otoriteyi backend API'sine bırakmalıdır.
2. **Hardcoded Renkler YASAKTIR:**
   - Asla `bg-[#FF0000]`, veya standart `bg-blue-500` gibi Tailwind renkleri kullanma.
   - Projenin `index.css` dosyasına dayalı token'larını kullan: `bg-primary`, `text-primary`, `bg-muted`, `border-border`, `text-muted-foreground`, `bg-success`, `bg-destructive`.
3. **Modal Yerine "Sheet" Kullanımı (Sağdan Çıkan Panel):**
   - Kullanıcı etkileşimleri (kayıt ekleme, düzenleme, randevu detaylarını görüntüleme) için ekranın ortasında açılan standart modal/dialog'dan ziyade, ekranın sağından kayarak açılan `Sheet` (`shadcn/ui`) bileşenleri tercih edilmelidir (Örn: `AppointmentDetailSheet.tsx`).
4. **Optimistic UI Sınırlaması:**
   - Veri silme, ekleme veya güncelleme işlemlerinde optimistik yaklaşım zorunlu olmadıkça kullanılmamalıdır. API işleminin sonucunu "Loading..." durumunda bekletin, başarılı olduğunda `queryClient.invalidateQueries` ile listeleri yeniden çekin.
5. **Component İçe Aktarma (Import) Kontrolü [KRİTİK]:**
   - Yeniden yazdığın veya modifiye ettiğin dosyalarda kullandığın her özelliğin, UI elemanının, icon'un doğru yerden *import edildiğinden* emin ol. Prompt'u tamamlamadan önce dosyayı baştan aşağı gözden geçir.
6. **Stil ve UX Hassasiyeti:**
   - Tasarımlar profesyonel görünmelidir. Boş durumlar (empty states), skeleton yükleniyor durumları ve gerekli geçiş animasyonları (`framer-motion` ile `layout` modları) daima düşünülmelidir.

---

## 4. Dosya ve Klasör Haritası

Projeye baktığında aradığını burada bulmalısın:

```text
src/
├── components/          # Evrensel veya Modül bazlı bileşenler
│   ├── ui/              # shadcn/ui base bileşenleri (Button, Input, Alert vs.)
│   ├── calendar/        # Doktor ve Sekreter kullanımına özel takvim logic'leri (DoctorCalendar, SlotPopup)
│   ├── appointments/    # Randevu liste ve detay (Sheet) bileşenleri
│   ├── landing/         # Dış web sitesi (public ana sayfa) bileşenleri
│   └── AppLayout.tsx    # Giriş yapan kullanıcı rollerinin ana Layout + Sidebar sarmalayıcısı
├── pages/               # Routing bağlantılı, rollere göre ayrılmış Ana Sayfalar
│   ├── admin/           # Klinik Owner ve Adminlere özel
│   ├── doctor/          # Sadece Doktorlara özel (Schedule, Dashboard, vb)
│   ├── staff/           # Uygulama sekreterlerine özel
│   ├── public/          # Landing pages, gizlilik politikaları (Yasal metinler) vs.
│   └── (diğer ana sayfalar: Auth, Profile, NotFound)
├── services/
│   └── api.ts           # [ÖNEMLİ] Backend ile haberleşilen TEK veri köprüsü, tüm route'lar objelere ayrılmış.
├── contexts/            # Global state'ler
│   ├── AuthContext.tsx  # JWT saklama, Localstorage operasyonları, bootstrap ve "me" kontrolü
│   └── LanguageContext.tsx
├── lib/                 # Utility fonksiyonları
│   └── auth-routing.ts  # Roller ve login sonrası default route tanımlamaları
└── utils/
    └── calendarUtils.ts # Takvim datalarını CalendarEvent'e dönüştüren fonksiyonlar
```

---

## 5. Uygulama Veri Akışı Örüntüsü (Pattern)

Projeye özellik eklerden standart olarak kullanılan teknoloji paketi `react-query` dir.
Aşağıda bu mimarinin veri okuma ve veri yazma standart örnekleri bulunur:

### A. Veri Okuma (Fetching)
```tsx
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";

const { data: doctors = [], isLoading, isError } = useQuery({
  queryKey: ["doctors-list", filterState],
  queryFn: () => api.doctors.list({ status: filterState }),
});
```

### B. Veri Yazma (Mutation)
```tsx
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import api from "@/services/api";

const queryClient = useQueryClient();
const createAppointment = useMutation({
  mutationFn: (newAppt: object) => api.appointments.create(newAppt),
  onSuccess: () => {
    toast.success("Randevu başarıyla oluşturuldu.");
    // İşlem başarılı olunca ilgili query'leri gecersiz kılar, UI'in güncellenmesini sağlarız
    queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); 
    queryClient.invalidateQueries({ queryKey: ["appointments-list"] });
  },
  onError: (error) => {
    toast.error(error instanceof Error ? error.message : "Bir hata oluştu");
  }
});

// kullanım: onClick={() => createAppointment.mutate({ ...data })}
```

---

## 6. Önemli Ekosistem Detayları

1. **`api.ts` Mantığı:** Klasik `fetch` kullanılır ve içerisinde otomatik "Token Refresh" mekanizması vardır. İstekler `api.module.action()` şeklinde erişilebilir (ör: `api.auth.login`, `api.availability.create`).
2. **Karanlık Tema (Dark Mode):** Tüm CSS Tailwind uyumludur, ancak özel HEX değerleri kullanılmaz. Tema geçişlerinde text'lerin görünmez olmaması için form elemanlarında ve backgroundlarda root değişkenler kullanılır (`bg-background text-foreground bg-card`).
3. **Doktor Takvimi (Doctor Calendar):** 
   - Takvimde doktorların çalışma saatleri (availability), yasaklı kapalı zamanları (blackout dates) ve randevuları aynı view'de gösterilir. 
   - Takvim üzerindeki varsayılan HTML selection `.rbc-slot-selection` gizlenmiştir, yerine özel custom component mantığımız işler (Bu tarz UX iyileştirmelerini bozmamaya özen göster).

## 7. Yeni Bir Task Geldiğinde Nasıl Düşünmelisin?
1. Verilen dosyayı `view_file` ile oku ve analiz et.
2. Tasarımsal değişikler varsa `index.css` ve `shadcn/ui` altyapısı üzerine düşün.
3. Bir veri ekleniyor/çıkarılıyorsa `src/services/api.ts`'te bu özellik hazır edilmiş mi kontrol et. Yoksa ekle.
4. Mutation varsa `onSuccess` içerisinde doğru `queryKey`'lerin invalidate edildiğinden emin ol.
5. Değişikliklerini `str_replace` kullanarak minimal hasar ve yüksek güvenilirlikle koda uygula.