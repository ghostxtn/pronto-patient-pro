# Homepage File Map

Bu liste, snapshot içine alınan homepage dosyalarını kategori bazında gösterir. `class` alanı şu değerlerden birini kullanır: `core`, `shared dependency`, `asset`, `style/system`.

## Core

- `src/pages/Landing.tsx` | class: `core` | `/` route'u için homepage kompozisyonunu kuran ana sayfa dosyasıdır.
- `src/components/landing/LandingNav.tsx` | class: `core` | Homepage header/navigation görünümünü ve üst CTA akışını üretir.
- `src/components/landing/HeroSection.tsx` | class: `core` | Hero alanını, ana başlığı ve birincil CTA setini render eder.
- `src/components/landing/QuickAccessSection.tsx` | class: `core` | Homepage üzerindeki hızlı keşif, filtre ve arama giriş alanını oluşturur.
- `src/components/landing/SplitFeatureSection.tsx` | class: `core` | `content.ts` içindeki split section verilerini sayfada görsel bloklara çevirir.
- `src/components/landing/SpecializationsSection.tsx` | class: `core` | Uzmanlık/showcase kart alanını homepage üzerinde üretir.
- `src/components/landing/TestimonialsSection.tsx` | class: `core` | Care area/link grid bölümünü homepage içinde render eder.
- `src/components/landing/CTASection.tsx` | class: `core` | Sayfa sonundaki çok kartlı CTA bölümünü üretir.
- `src/components/landing/LandingFooter.tsx` | class: `core` | Homepage footer kolonlarını ve kurumsal link yapısını oluşturur.
- `src/components/landing/SmartLink.tsx` | class: `core` | Homepage linklerinin route veya anchor olarak doğru elemente dönmesini sağlar.
- `src/components/landing/content.ts` | class: `core` | Homepage copy, navigation, CTA, section verisi ve lokal homepage görsellerini merkezi olarak tutar.

## Shared Dependency

- `src/main.tsx` | class: `shared dependency` | Uygulamayı DOM'a mount ederek homepage zincirini başlatır.
- `src/App.tsx` | class: `shared dependency` | Homepage route'unu provider ve router katmanlarıyla birlikte tanımlar.
- `src/components/LanguageSwitcher.tsx` | class: `shared dependency` | Navbar içindeki dil değiştirme etkileşimini sağlar.
- `src/components/ui/button.tsx` | class: `shared dependency` | Homepage CTA ve nav butonlarının ortak UI temelidir.
- `src/components/ui/input.tsx` | class: `shared dependency` | Quick access arama alanının ortak input bileşenidir.
- `src/components/ui/toaster.tsx` | class: `shared dependency` | App kökünde mount edilen Radix toast taşıyıcısını sağlar.
- `src/components/ui/toast.tsx` | class: `shared dependency` | `toaster.tsx` tarafından kullanılan toast primitive katmanıdır.
- `src/components/ui/sonner.tsx` | class: `shared dependency` | App kökündeki Sonner toaster render zincirini sağlar.
- `src/components/ui/tooltip.tsx` | class: `shared dependency` | App seviyesinde sarmalanan tooltip provider'ı sağlar.
- `src/hooks/use-toast.ts` | class: `shared dependency` | `toaster.tsx` için gerekli toast state/store mantığını içerir.
- `src/lib/utils.ts` | class: `shared dependency` | UI bileşenlerinin Tailwind class birleştirme yardımcı fonksiyonunu sağlar.
- `src/contexts/LanguageContext.tsx` | class: `shared dependency` | Homepage içerik dilini ve switch state'ini yöneten provider'dır.
- `src/contexts/AuthContext.tsx` | class: `shared dependency` | Homepage route'u App içinde bu provider altında render edildiği için runtime zincirinin parçasıdır.
- `src/i18n/en.ts` | class: `shared dependency` | `LanguageContext` tarafından import edilen İngilizce çeviri sözlüğünü sağlar.
- `src/i18n/tr.ts` | class: `shared dependency` | `LanguageContext` tarafından import edilen Türkçe çeviri sözlüğünü sağlar.
- `src/integrations/supabase/client.ts` | class: `shared dependency` | `AuthContext` için gerekli Supabase istemcisini oluşturur.
- `src/integrations/supabase/types.ts` | class: `shared dependency` | Supabase istemcisinin kullandığı tip tanımlarını sağlar.

## Style/System

- `index.html` | class: `style/system` | Uygulamanın mount noktasını ve HTML kabuğunu sağlayan giriş dosyasıdır.
- `src/index.css` | class: `style/system` | Homepage'in global renk tokenlarını, fontlarını ve utility sınıflarını taşır.
- `tailwind.config.ts` | class: `style/system` | Homepage'in container ölçüsü, font aileleri ve homepage-scoped tema token uzantılarını belirler.
- `postcss.config.js` | class: `style/system` | Tailwind CSS işleme adımının çalışması için gerekli PostCSS yapılandırmasıdır.
- `vite.config.ts` | class: `style/system` | `@` alias çözümünü ve build-time çözümlemeyi tanımlar.
- `tsconfig.json` | class: `style/system` | Proje genelindeki TS path alias çözümünü tanımlar.
- `tsconfig.app.json` | class: `style/system` | Uygulama derleme bağlamında homepage kodunun TS çözümlemesini tanımlar.
- `components.json` | class: `style/system` | shadcn UI alias ve CSS bağlantılarını belgeleyen sistem dosyasıdır.
- `package.json` | class: `style/system` | Homepage'in ihtiyaç duyduğu paket bağımlılıklarını ve script bağlamını tanımlar.

## Asset

- `src/assets/brands/demo-clinic/homepage/*` | class: `asset` | Aktif homepage hero, split section ve showcase görsellerini bu klasörden alır; binary dosyalar code snapshot içine ayrıca kopyalanmamıştır.

## 2026-03-15 sync scope

Bu refinement task'ında birebir snapshot karşılığı güncellenen dosyalar:

- `src/components/landing/content.ts` -> `code/src/components/landing/content.ts`
- `src/index.css` -> `code/src/index.css`
- `tailwind.config.ts` -> `code/tailwind.config.ts`
- `src/pages/Landing.tsx` -> `code/src/pages/Landing.tsx`
- `src/components/landing/LandingNav.tsx` -> `code/src/components/landing/LandingNav.tsx`
- `src/components/landing/HeroSection.tsx` -> `code/src/components/landing/HeroSection.tsx`
- `src/components/landing/QuickAccessSection.tsx` -> `code/src/components/landing/QuickAccessSection.tsx`
- `src/components/landing/SplitFeatureSection.tsx` -> `code/src/components/landing/SplitFeatureSection.tsx`
- `src/components/landing/SpecializationsSection.tsx` -> `code/src/components/landing/SpecializationsSection.tsx`
- `src/components/landing/TestimonialsSection.tsx` -> `code/src/components/landing/TestimonialsSection.tsx`
- `src/components/landing/CTASection.tsx` -> `code/src/components/landing/CTASection.tsx`
- `src/components/landing/LandingFooter.tsx` -> `code/src/components/landing/LandingFooter.tsx`

Bu sync, layout veya bilgi mimarisi değişikliği için değil; palette, contrast, surface ve CTA rol netliği için yapıldı.

2026-03-15 tarihli copy refinement turunda ise aktif homepage ile snapshot arasında yalnızca seçili EN/TR metin güncellemeleri senkronlandı; yapısal redesign yapılmadı.

## Muhtemel bağımlılıklar

- `src/components/landing/HowItWorksSection.tsx` | class: `shared dependency` | Landing klasöründe yer alsa da aktif homepage import zincirinde bulunmadığı için sadece muhtemel bağımlılık olarak işaretlendi.
- `src/components/landing/AnimatedCounter.tsx` | class: `shared dependency` | Landing klasöründe yer alsa da aktif homepage import zincirinde bulunmadığı için sadece muhtemel bağımlılık olarak işaretlendi.
- `pronto-home-1440.png` | class: `asset` | Repo kökünde bulunan bu görsel homepage runtime'ında referanslanmadığı için kopyalanmadı ve tasarım referansı olasılığıyla notlandı.
- `public/favicon.ico` | class: `asset` | Repo içinde mevcut olsa da `index.html` tarafından aktif bağlanmadığı için homepage asset snapshot'ına alınmadı.
