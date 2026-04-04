# Landing Page Animasyonu ve Smooth Scroll Notlari

Bu dokuman, landing page uzerinde uygulanan Duten benzeri hero scroll animasyonunun ve smooth scroll yapisinin nasil calistigini anlatir.

## Amac

Landing page'in ilk ekraninda:

- sabit duran bir hero arka plan olusturmak
- scroll ile blob ve ring elemanlarini parallax sekilde hareket ettirmek
- hero metnini scroll ilerledikce yukari tasimak
- hero bittikten sonra asagidaki section'lari hero'nun ustune bindirerek overlay etkisi vermek
- scroll deneyimini Lenis ile daha yumusak hale getirmek

Bu yapiyla kullanici once tam ekran bir hero gorur, sonra sayfa asagi indikce alttaki icerik hero animasyonunun ustune "kayarak" gelir.

## Degisen Ana Dosyalar

- `src/components/landing/HeroSection.tsx`
- `src/pages/Landing.tsx`
- `src/index.css`

## 1. Hero Yapisi

Hero ana olarak `src/components/landing/HeroSection.tsx` icinde kuruldu.

Temel DOM yapisi soyle:

```tsx
<section id="hero-section" className="hero-section">
  <div id="hero-sticky-bg" className="hero-sticky-bg">
    <div id="hero-ring-1" className="hero-ring" />
    <div id="hero-ring-2" className="hero-ring" />

    <div id="hero-blob-1" className="hero-blob hero-blob-1" />
    <div id="hero-blob-2" className="hero-blob hero-blob-2" />
    <div id="hero-blob-3" className="hero-blob hero-blob-3" />
    <div id="hero-blob-4" className="hero-blob hero-blob-4" />

    <div id="hero-content" className="hero-content">
      ...
    </div>
  </div>
</section>
```

### Bu yapida ne oluyor?

- `hero-section` sayfada uzun bir scroll alani olusturur.
- `hero-sticky-bg` `position: sticky` oldugu icin viewport'a yapisik kalir.
- Blob ve ring elemanlari arka plandaki hareketli dekoratif katmandir.
- `hero-content` baslik, alt yazi ve CTA butonunu tasir.

## 2. CSS Tarafi

Temel stiller `src/index.css` icinde tanimlandi.

En kritik kisimlar:

### `hero-section`

```css
.hero-section {
  position: relative;
  height: 280vh;
}
```

Bu section normal bir `100vh` degil. `280vh` yapilarak scroll icin fazladan mesafe olusturuluyor. Boylece sticky arka plan ayni ekranda kalirken kullanici scroll yaptikca animasyon ilerliyor.

### `hero-sticky-bg`

```css
.hero-sticky-bg {
  position: sticky;
  top: 0;
  height: 100vh;
  width: 100%;
  overflow: hidden;
}
```

Bu katman hero'nun gorunen tam ekran alanidir. Scroll olsa da belli bir sure ekranda sabit kalir.

### Blob ve ring elemanlari

- Blob'lar yumusak radial gradient dairelerdir.
- Ring'ler merkezde duran ince cizgili halkalardir.
- Bu elemanlar JS tarafinda `transform` ile hareket ettirilir.
- Ek olarak CSS'te nefes alma benzeri blur animasyonu verilir.

### `hero-content`

`hero-content` absolute konumlandirilir ve viewport'un alt tarafindan baslayacak sekilde padding verilir. Bu sayede metin ilk gorunuste daha sinematik bir pozisyonda durur.

## 3. Smooth Scroll: Lenis

Smooth scroll icin `@studio-freight/lenis` kullanildi.

Import:

```tsx
import Lenis from "@studio-freight/lenis";
```

`HeroSection.tsx` icindeki `useEffect` icinde Lenis instance'i olusturuluyor:

```tsx
const lenis = new Lenis({
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
});
```

### Bu ne saglar?

- mouse wheel scroll daha yumusak hissedilir
- anlik sert scroll yerine easing uygulanir
- hero icindeki parallax animasyonlari daha akici gorunur

## 4. Lenis RAF Loop

Lenis kendi `raf` dongusu ile calistirilir:

```tsx
function lenisRaf(time: number) {
  lenis.raf(time);
  rafRef.current = requestAnimationFrame(lenisRaf);
}

const lenisRafId = requestAnimationFrame(lenisRaf);
```

Bu yapi her frame'de Lenis'in scroll durumunu gunceller.

Onceden klasik `window.scrollY` tabanli manuel bir RAF loop vardi. Daha sonra bu kisim Lenis'e tasindi. Boylece hem scroll motoru hem animasyon ilerlemesi ayni kaynaktan beslenmeye basladi.

## 5. Scroll Progress Hesabi

Hero animasyonunda en kritik kavram `progress` degeridir.

Bu deger 0 ile 1 arasindadir:

- `0`: hero animasyonu henuz baslamamis
- `1`: hero animasyonu scroll alaninin sonuna gelmis

Hesap:

```tsx
const p = Math.max(0, Math.min(1, scroll / heroTotalRef.current));
```

Burada:

- `scroll`: Lenis'in o anki scroll degeri
- `heroTotalRef.current`: hero section toplam animasyon mesafesi

Bu mesafe su sekilde hesaplanir:

```tsx
heroTotalRef.current = Math.max(1, heroEl.offsetHeight - window.innerHeight);
```

Yani:

- hero section toplam yuksekligi
- eksi viewport yuksekligi

Boylece sticky alan ekranda sabit kalirken ne kadar scroll mesafesi oldugu bulunur.

## 6. Animasyon Mantigi

Lenis `scroll` eventi icinde blob, ring ve content hareketleri guncellenir.

### Blob parallax

```tsx
if (b1) b1.style.transform = `translate(${p * -60}px, ${p * -50}px) scale(${1 - p * 0.08})`;
if (b2) b2.style.transform = `translate(${p * 55}px, ${p * -35}px) scale(${1 - p * 0.10})`;
if (b4) b4.style.transform = `translateX(${p * 35}px)`;
```

Sonuc:

- biri sola ve yukari gider
- biri saga ve yukari gider
- biri sadece yatay kayar
- bazilarinda ufak scale degisimi olur

Bu sayede katmanli bir derinlik etkisi olusur.

### Ring scale + fade

```tsx
if (r1) {
  r1.style.transform = `translate(-50%,-50%) scale(${1 + p * 0.6})`;
  r1.style.opacity = `${Math.max(0, 0.6 - p * 0.55)}`;
}

if (r2) {
  r2.style.transform = `translate(-50%,-50%) scale(${1 + p * 0.3})`;
  r2.style.opacity = `${Math.max(0, 0.4 - p * 0.35)}`;
}
```

Sonuc:

- halkalar scroll ilerledikce buyur
- opakliklari azalir
- arka planda yumusak bir enerji halkasi etkisi verir

### Hero content yukari kaymasi

```tsx
if (heroC) heroC.style.transform = `translateY(${p * -18}%)`;
```

Bu hareket sayesinde baslik blogu scroll ilerledikce yukari dogru cikar.

## 7. Overlay Efekti

Bu kisim `src/pages/Landing.tsx` icinde yapildi.

Hero'dan sonra gelen tum icerik bir wrapper ile sarildi:

```tsx
<div
  style={{
    position: "relative",
    zIndex: 10,
    background: "#f4f8fd",
    borderRadius: "48px 48px 0 0",
    marginTop: "-75vh",
    overflow: "visible",
  }}
>
  <SpecialtiesSection ... />
  <DoctorsSection ... />
  <LandingFooter />
</div>
```

### Bu ne saglar?

- hero'nun altindaki tum sayfa icerigi tek bir panel gibi davranir
- bu panel negatif `marginTop` ile hero'nun ustune bindirilir
- boylece kullanici scroll ettikce "hero kapanip icerik aciliyormus" hissi olusur

### Kritik noktalar

- `zIndex: 10` sayesinde overlay hero'nun ustune gelir
- `background: #f4f8fd` sayesinde alttaki animasyon yanlardan gorunmez
- `borderRadius: 48px 48px 0 0` ustte yumusak panel etkisi verir
- `marginTop` degeri efektin ne kadar erken/sert bindigini belirler

Bu deger proje boyunca birkac kez ayarlandi:

- `-20vh`: daha gec bindirir
- `-30vh`: orta seviyede bindirir
- `-55vh`: daha guclu overlay verir
- `-75vh`: daha agresif bir gecis yaratir

## 8. Responsive Taraf

`index.css` icinde medya sorgulari ile hero content padding'i mobile icin ayarlanir:

```css
@media (max-width: 900px) {
  .hero-content {
    padding: calc(100vh - 280px) 24px 0;
  }
}

@media (max-width: 600px) {
  .hero-content {
    padding-top: calc(100vh - 320px);
  }
}
```

Bu ayarlar sayesinde:

- metin mobilde viewport disina tasmaz
- CTA daha gorunur kalir
- hero daha dengeli bir dikey yerlesim alir

## 9. Cleanup ve Memory Leak Onlemi

`useEffect` icinde olusturulan listener ve animasyonlar cleanup'ta temizlenir:

```tsx
return () => {
  cancelAnimationFrame(lenisRafId);
  cancelAnimationFrame(rafRef.current);
  lenis.destroy();
  window.removeEventListener("resize", calcSize);
  document.documentElement.style.scrollBehavior = "";
};
```

Bu onemlidir cunku:

- component unmount oldugunda RAF dongusu devam etmez
- resize listener birikmez
- Lenis instance'i temizlenir
- global `scrollBehavior` eski haline doner

## 10. Native Smooth Scroll Kismi

Lenis'e ek olarak su satir da kullanildi:

```tsx
document.documentElement.style.scrollBehavior = "smooth";
```

Ve cleanup'ta sifirlanir:

```tsx
document.documentElement.style.scrollBehavior = "";
```

Bu kisim native smooth scroll davranisini da aktif eder. Lenis zaten temel motoru sagliyor olsa da bu satir anchor veya tarayici bazli bazi gecislerde ek tutarlilik verir.

Ayrica global CSS'te zaten su kural da mevcut:

```css
html {
  scroll-behavior: smooth;
}
```

## 11. Neden Bu Yaklasim Secildi?

Bu yapinin secilme nedenleri:

- mevcut navbar'a dokunmadan hero deneyimi guclendirilebildi
- ayri bir full-page animation kutuphanesine ihtiyac olmadi
- blob/ring hareketleri basit `transform` ile performansli tutuldu
- sticky + overlay kombinasyonu ile premium landing hissi elde edildi
- overlay wrapper sayesinde hero sonrasi section'lar tek parca tasarim gibi davraniyor

## 12. Gelecekte Bir Sey Degistirmek Istersek

### Overlay daha erken/gec baslasin

`src/pages/Landing.tsx` icindeki wrapper `marginTop` degerini degistir:

- daha erken bindirmek icin daha negatif deger
- daha gec bindirmek icin sifira daha yakin deger

### Hero daha uzun/kisa sursun

`src/index.css` icindeki:

```css
.hero-section {
  height: 280vh;
}
```

degerini guncelle.

- daha uzun animasyon icin `320vh`
- daha kisa animasyon icin `220vh`

### Blob hareketlerini yumusatmak/artirmak

`HeroSection.tsx` icindeki `translate`, `scale` ve opacity carpani degerlerini degistir.

### Scroll hissini degistirmek

`Lenis` config icindeki su alanlar ayarlanabilir:

- `duration`
- `easing`
- `smoothWheel`

## 13. Dikkat Edilmesi Gerekenler

- Hero'dan sonraki section'larin arka plani seffaf olursa alttaki animasyon yanlardan gozukebilir.
- Overlay wrapper kaldirilirsa Duten benzeri "icerik ustune geliyor" hissi kaybolur.
- `hero-section` yuksekligi dusurulurse animasyon cok hizli biter.
- Lenis kaldirilirsa scroll daha sert hissedilir.
- `position: sticky` davranisi parent overflow kurallarindan etkilenebilir.

## 14. Kisa Ozet

Bu landing animasyonu su uc fikre dayaniyor:

1. Uzun bir hero section olustur.
2. Icindeki arka plani sticky tut.
3. Scroll ilerledikce dekoratif elemanlari ve metni hareket ettir, sonra alttaki icerigi negatif margin ile ustune bindir.

Smooth scroll tarafinda ise:

1. Lenis instance'i olustur.
2. Kendi RAF loop'u ile calistir.
3. Scroll event'inden gelen degerle animasyon progress'ini hesapla.
4. Cleanup'ta tum effect'leri kapat.

Bu sayede kod hem okunabilir kalir hem de gorsel olarak daha premium bir landing deneyimi elde edilir.
