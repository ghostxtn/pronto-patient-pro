# Homepage Dependency Snapshot

Bu snapshot, `2026-03-14` tarihinde `/` route'una bağlı homepage görünüm zincirini mevcut repo durumuna göre arşivlemek için çıkarıldı.

## 2026-03-15 copy refinement note

- Bu güncelleme yalnızca homepage copy refinement kapsamındadır; layout, spacing, section sırası, görseller, component yapısı, navigation anlamı, route'lar ve CTA hedefleri değiştirilmemiştir.
- Amaç; ana sayfa metinlerini İngilizce ve Türkçe için daha klinik, daha doğal, daha güven veren ve lokalizasyon açısından daha nötr hale getirmektir.
- Aktif homepage ile archive snapshot aynı copy kaynakları üzerinden senkron tutulmuştur; yapısal bir redesign yapılmamıştır.

## 2026-03-15 palette/contrast refinement note

- Bu güncelleme yapısal bir redesign değildir; section sırası, route mimarisi, copy iskeleti, görseller ve CTA hedefleri korunmuştur.
- Amaç; homepage'in aynı premium-clinical minimal omurgasını koruyup paleti daha kurumsal, daha okunabilir ve erişilebilir hale getirmektir.
- Değişiklik odağı: hero overlay yoğunluğunu azaltmak, koyu nötrleri klinik teal-blue tona kaydırmak, küçük metin kontrastını artırmak, kart yüzey ayrımını netleştirmek ve birincil/ikincil CTA hiyerarşisini tutarlılaştırmaktır.

## 2026-03-15 sync scope

Bu task kapsamında aktif dosyalardan snapshot içine senkronlanan eşleşmeler:

- `src/components/landing/content.ts` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/content.ts`
- `src/index.css` -> `archive/homepage/2026-03-14-homepage-v1/code/src/index.css`
- `tailwind.config.ts` -> `archive/homepage/2026-03-14-homepage-v1/code/tailwind.config.ts`
- `src/pages/Landing.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/pages/Landing.tsx`
- `src/components/landing/LandingNav.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/LandingNav.tsx`
- `src/components/landing/HeroSection.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/HeroSection.tsx`
- `src/components/landing/QuickAccessSection.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/QuickAccessSection.tsx`
- `src/components/landing/SplitFeatureSection.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/SplitFeatureSection.tsx`
- `src/components/landing/SpecializationsSection.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/SpecializationsSection.tsx`
- `src/components/landing/TestimonialsSection.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/TestimonialsSection.tsx`
- `src/components/landing/CTASection.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/CTASection.tsx`
- `src/components/landing/LandingFooter.tsx` -> `archive/homepage/2026-03-14-homepage-v1/code/src/components/landing/LandingFooter.tsx`

Bu sync'in 2026-03-15 tarihli son ayağında yalnızca seçili homepage metinleri rafine edildi; section yapısı ve görsel sistem korunarak aktif sürüm ile archive mirror aynı tutuldu.

## 2026-03-15 homepage color roles

- Primary brand / system CTA: `#0E5C74`
- Deeper brand shade / footer-hero depth: `#0A4A5E`
- Support accent: `#2A7F84`
- Support tint and soft surface accent: `#DFF3EF`
- Primary light surface: `#F6FBFB`
- Secondary cool surface: `#EAF4FB`
- Primary text / dark slate-navy: `#102A43`
- Functional success: `#1F6F50`
- Functional warning surface/text: `#FFF4E5` + `#8A5A00`
- Functional critical/error: `#A63A3A`

Bu roller aktif implementation içinde homepage-scoped token ve utility katmanı üzerinden tutulur; amaç renkleri rastgele section bazında dağıtmak değil, aynı homepage iskeleti üzerinde kontrollü evrim sağlamaktır.

## Homepage giriş dosyası

- Asıl homepage route girişi: `src/pages/Landing.tsx`
- Route tanımı: `src/App.tsx` içinde `path="/" element={<Landing />}`
- Uygulama giriş zinciri: `index.html` -> `src/main.tsx` -> `src/App.tsx` -> `src/pages/Landing.tsx`

## Homepage'e bağlı component zinciri

`src/pages/Landing.tsx` şu componentleri doğrudan kullanır:

- `src/components/landing/LandingNav.tsx`
- `src/components/landing/HeroSection.tsx`
- `src/components/landing/QuickAccessSection.tsx`
- `src/components/landing/SplitFeatureSection.tsx`
- `src/components/landing/SpecializationsSection.tsx`
- `src/components/landing/TestimonialsSection.tsx`
- `src/components/landing/CTASection.tsx`
- `src/components/landing/LandingFooter.tsx`
- `src/components/landing/content.ts`

Bu zinciri etkileyen shared dosyalar:

- `src/components/landing/SmartLink.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/tooltip.tsx`
- `src/hooks/use-toast.ts`
- `src/lib/utils.ts`
- `src/contexts/LanguageContext.tsx`
- `src/contexts/AuthContext.tsx`
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `src/i18n/en.ts`
- `src/i18n/tr.ts`

## Homepage'den çıkan route ve anchor bağlantıları

Homepage içinden doğrudan çıkılan uygulama route'ları:

- `/auth`
- `/auth?tab=signup`
- `/doctors`

Homepage içindeki internal anchor hedefleri:

- `#search-hub`
- `#services`
- `#journey`
- `#care-areas`
- `#contact`

Self-link:

- `/`

Not: Bu snapshot, link hedefi olan diğer sayfaları kopyalamaz; sadece homepage görünümünü oluşturan bağımlılık zincirini alır.

## Homepage'i etkileyen shared ve system dosyaları

- `src/index.css` global token, font, utility ve scroll davranışını taşır.
- `tailwind.config.ts` container, font family ve homepage-scoped color token uzantılarını tanımlar.
- `postcss.config.js` Tailwind işleme zincirini açar.
- `vite.config.ts` `@` alias çözümünü sağlar.
- `tsconfig.json` ve `tsconfig.app.json` alias ve TS çözümlemelerini etkiler.
- `components.json` shadcn alias/css eşleşmesini dokümante eder.
- `package.json` homepage'in kullandığı React, Router, Tailwind, Radix, Framer Motion, Sonner ve Supabase paketlerini tanımlar.
- `index.html` uygulama mount noktasını verir.

## Başka projeye taşırken birlikte alınması gereken minimum set

Mutlaka birlikte alınmalı:

- `src/pages/Landing.tsx`
- `src/components/landing/*` içindeki aktif kullanılan dosyalar
- `src/components/LanguageSwitcher.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/contexts/LanguageContext.tsx`
- `src/contexts/AuthContext.tsx`
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `src/index.css`
- `tailwind.config.ts`
- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.app.json`
- `postcss.config.js`
- `package.json`

Taşıma sırasında ayrıca korunmalı:

- `src/lib/utils.ts`
- `src/hooks/use-toast.ts`
- `src/components/ui/toast.tsx`
- `src/components/ui/toaster.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/tooltip.tsx`
- `src/i18n/en.ts`
- `src/i18n/tr.ts`
- `components.json`
- `index.html`

## Kritik bağımlılıklar ve opsiyoneller

Kritik bağımlılıklar:

- `src/pages/Landing.tsx` ve aktif landing section componentleri
- `src/components/landing/content.ts`
- `src/contexts/LanguageContext.tsx`
- `src/components/LanguageSwitcher.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/index.css`
- `tailwind.config.ts`
- `vite.config.ts`
- `src/App.tsx`
- `src/main.tsx`

Runtime zinciri için kritik ama görsel olarak dolaylı bağımlılıklar:

- `src/contexts/AuthContext.tsx`
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `src/components/ui/toaster.tsx`
- `src/components/ui/toast.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/tooltip.tsx`
- `src/hooks/use-toast.ts`

Opsiyonel veya muhtemel bağımlılıklar:

- `src/components/landing/HowItWorksSection.tsx` aktif import zincirinde değil, landing için eski/alternatif section adayı gibi duruyor.
- `src/components/landing/AnimatedCounter.tsx` aktif import zincirinde değil, landing için eski/alternatif section yardımcı parçası gibi duruyor.
- `pronto-home-1440.png` repo kökünde mevcut ama homepage runtime'ında referanslanmıyor; muhtemel tasarım referansı.
- `public/favicon.ico` repo içinde mevcut ama `index.html` içinde aktif bağlanmamış; muhtemel global branding varlığı.

## Asset durumu

- Aktif homepage, `src/components/landing/content.ts` üzerinden `src/assets/brands/demo-clinic/homepage/*` altındaki lokal görselleri import eder.
- Bu archive snapshot code ağırlıklıdır; ilgili binary asset'ler ayrıca kopyalanmamış, snapshot kodu repo içindeki aynı asset path'lerini referanslamaya devam eder.
- `src/index.css` içindeki font tanımı Google Fonts URL import'u üzerinden gelir ve repo içinde lokal font dosyası yoktur.
- Bu task içinde görsel seti değiştirilmemiştir; yalnızca palette, contrast ve surface rolleri güncellenmiştir.
