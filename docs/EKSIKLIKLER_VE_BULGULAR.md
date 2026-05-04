# Pronto Patient Pro — Eksiklikler ve Bulgular Raporu

**Belge Türü:** İç Değerlendirme Raporu  
**Tarih:** 04.05.2026  
**Kapsam:** Teknik Dokümantasyon + KVKK Uyum Analizi + Mimari Değerlendirme

---

## 1. Teknik Eksiklikler

### 1.1 Mimari — `POST /api/clinics` ve `GET /api/clinics` Endpoint Sorunu

**Öncelik:** Orta  
**Tür:** Mimari / Güvenlik

**Problem:**  
`POST /api/clinics` ve `GET /api/clinics` endpoint'leri şu an `owner` rolüne açık durumda. Bu endpoint'ler klinik oluşturma ve listeleme işlemleri için tasarlanmış olsa da pratikte klinik oluşturma bir platform seviyesi operasyondur — klinik kullanıcısının erişmesi gereken bir işlem değildir.

**Neden Sorun?**  
Multi-tenant SaaS mimarisinde bir kliniğin owner'ı başka bir klinik açmamalıdır. Şu an TenantGuard bunu kısmen engelliyor ancak endpoint'in varlığı güvenlik yüzeyini gereksiz genişletiyor.

**Çözüm (Kısa Vadeli):**  
`POST /api/clinics` endpoint'ini kaldır veya devre dışı bırak. Klinik provisioning'i tamamen manuel DB işlemi / seed script'e bırak.

**Çözüm (Uzun Vadeli — Phase 7):**  
Platform super-admin rolü ve ayrı super-admin paneli oluştur. Klinik oluşturma, domain atama, plan yönetimi bu panel üzerinden yapılsın.

---

### 1.2 KVKK — `kvkk_consent_ip` Alanı Boş Kaydediliyor

**Öncelik:** Yüksek  
**Tür:** KVKK Uyum / Teknik  
**İş Büyüklüğü:** ~15 dakika

**Problem:**  
Kullanıcı kayıt akışında `kvkk_consent_ip` alanı `null` olarak set ediliyor. KVKK açısından rızanın hangi IP adresinden, ne zaman, hangi versiyon metin için alındığının kayıt altına alınması gerekiyor. `kvkk_consent_at` ve `kvkk_consent_version` doğru çalışıyor; yalnızca IP alanı boş kalıyor.

**Çözüm:**  
`auth.service.ts` içinde kayıt işlemi sırasında `request.ip` veya `X-Forwarded-For` header'ından IP adresi okunarak `kvkk_consent_ip` alanına yazılmalı.

---

### 1.3 KVKK — Google OAuth Akışında Rıza Kaydı Eksik

**Öncelik:** Yüksek  
**Tür:** KVKK Uyum / Teknik  
**İş Büyüklüğü:** Orta

**Problem:**  
Google OAuth ile ilk kez kayıt olan kullanıcılarda `kvkk_consent_at`, `kvkk_consent_version` ve `kvkk_consent_ip` alanlarının set edildiği doğrulanamadı. Parola ile kayıt akışında KVKK onayı zorunlu tutuluyor (`kvkkConsent` alanı DTO'da required) ancak Google OAuth akışında eşdeğer bir kontrol bulunmuyor.

**Neden Kritik?**  
Google ile giriş yapan hasta veya personel hesapları için KVKK rızası kanıtlanamaz hale geliyor. Denetim durumunda bu boşluk sorun yaratabilir.

**Çözüm:**  
Google OAuth callback akışında (`google.strategy.ts` veya `auth.service.ts`'deki `googleLogin` metodu) yeni kullanıcı oluşturulurken bir KVKK onay adımı eklenmeli. Frontend tarafında Google callback sayfasına rıza onay ekranı konulabilir; backend tarafında `kvkk_consent_at`, `kvkk_consent_version` ve `kvkk_consent_ip` set edilmeli.

---

### 1.4 Şifreleme — `birth_date`, `gender`, `notes` Alanları Şifrelenmiyor

**Öncelik:** Orta  
**Tür:** Veri Güvenliği / KVKK  
**İş Büyüklüğü:** Orta

**Problem:**  
`patients` tablosundaki `birth_date`, `gender` ve `notes` alanları için alan bazlı AES-256-GCM şifreleme uygulanmıyor. Diğer hasta alanları (`first_name`, `last_name`, `tc_no`, `phone`, `email`, `address`) şifreli olmasına rağmen bu üç alan düz metin olarak veritabanında duruyor.

**Risk Değerlendirmesi:**  
- `birth_date` ve `gender` tek başına özel nitelikli veri sayılmaz ancak diğer kişisel verilerle birleşince tanımlayıcı nitelik kazanıyor.
- `notes` alanı serbest metin olduğundan içeriğine göre özel nitelikli veri (sağlık bilgisi) barındırabilir.

**Çözüm:**  
Hukuki danışmanlık sonucuna göre bu alanların da şifrelenmesi değerlendirilmeli. Teknik olarak mevcut şifreleme altyapısı bu alanları kapsayacak şekilde genişletilebilir.

---

### 1.5 Güvenlik — HSTS Başlığı Eksik

**Öncelik:** Orta  
**Tür:** HTTP Güvenliği  
**İş Büyüklüğü:** 5 dakika (HTTPS devreye alındığında)

**Problem:**  
Nginx yapılandırmasında `Strict-Transport-Security` (HSTS) başlığı bulunmuyor. Diğer güvenlik başlıkları (`X-Frame-Options`, `X-Content-Type-Options`, `CSP`, `Referrer-Policy`, `Permissions-Policy`) eksiksiz mevcut.

**Not:**  
Bu eksiklik şu an HTTP üzerinde çalışıldığı için kritik değil. HTTPS devreye alındığında (VPS deploy — Phase 6) aşağıdaki satır Nginx config'e eklenmelidir:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

### 1.6 Audit Log — Veritabanı Seviyesinde Append-Only Koruması Yok

**Öncelik:** Düşük (şu an için)  
**Tür:** Veri Bütünlüğü / KVKK

**Problem:**  
Audit log kayıtlarını güncelleyen veya silen bir servis metodu kod içinde doğrulanamadı — bu olumlu. Ancak veritabanı düzeyinde `append-only` trigger veya ayrı bir WORM saklama mekanizması bulunmuyor. Teorik olarak direkt DB erişimi olan biri audit log'u silebilir.

**Çözüm (Uzun Vadeli):**  
PostgreSQL'de `audit_logs` tablosu için `BEFORE UPDATE OR DELETE` trigger eklenebilir. Alternatif olarak `audit_user` DB rolünün `UPDATE` ve `DELETE` yetkisi olmadığı zaten doğrulandı — bu kısmen koruma sağlıyor.

---

## 2. Operasyonel / Hukuki Eksiklikler

### 2.1 Veri Saklama Süresi Belirsiz

**Öncelik:** Yüksek (hukuki)  
**Tür:** KVKK Madde 7

Hasta kayıtları, klinik notlar, randevular, denetim kayıtları ve dosyalar için saklama süreleri henüz belirlenmemiş. Sağlık mevzuatı kapsamında tıbbi kayıtlar için minimum saklama yükümlülükleri var.

**Yapılacak:** Hukuki danışmanlık sonrası saklama süresi tablosu oluşturulacak. `patient_clinical_notes.expires_at` alanı altyapısı zaten hazır; otomatik imha cron job'u Phase 7'de eklenecek.

---

### 2.2 İlgili Kişi Başvuru Modülü Yok

**Öncelik:** Orta (hukuki)  
**Tür:** KVKK Madde 11

KVKK kapsamında hastalara tanınan haklar (silme, düzeltme, veri taşıma, bilgi alma) için sistematik bir başvuru iş akışı yok. Şu an manuel süreçle yönetilmesi gerekiyor.

**Yapılacak:** Phase 7-8'de merkezi ilgili kişi başvuru modülü planlanacak. Kısa vadede klinik için manuel başvuru formu / e-posta kanalı belirlenmeli.

---

### 2.3 SMTP Sağlayıcısı Veri İşleyen Sözleşmesi

**Öncelik:** Orta (hukuki)  
**Tür:** KVKK Madde 8-9

Sistemden gönderilen e-postalarda (OTP, randevu hatırlatma, parola sıfırlama) hasta adı, e-posta adresi ve randevu bilgileri SMTP altyapısına aktarılıyor. Bu aktarım için SMTP sağlayıcısı ile veri işleyen sözleşmesi (DPA) yapılması gerekiyor.

---

### 2.4 VPS Türkiye Lokasyonu Belgelenmeli

**Öncelik:** Orta (hukuki)  
**Tür:** KVKK Madde 9 / Yurt İçi Veri Saklama

Verinin Türkiye'de saklandığı yalnızca beyan üzerine. Hosting sağlayıcıdan resmi lokasyon belgesi, veri merkezi taahhütnamesi veya sözleşmesel güvence alınmalı.

---

## 3. Mimari Kararlar (Phase 7-8)

Teknik dokümantasyon ve mimari değerlendirme sürecinde aşağıdaki stratejik kararlar alındı:

### 3.1 Full Hosted SaaS Modeli

Pronto Patient Pro, per-clinic kurulum modeli yerine **Hosted White-label SaaS** olarak konumlandırılacak. Tüm klinikler aynı instance üzerinde `clinic_id` izolasyonuyla çalışacak. Mevcut multi-tenancy altyapısı bu modele hazır.

**Gelir Modeli:** Aylık abonelik per klinik (standart / enterprise paket).

---

### 3.2 White-label Tema Sistemi (Phase 7)

Her klinik kendi renk paleti, logo, font ve özel metinlerine sahip olabilecek. 3 hazır layout şablonu sunulacak (modern, minimal/kurumsal, sıcak/fotoğraf ağırlıklı). Klinik şablon seçer, tema özelleştirmelerini yapar.

`clinic_settings` tablosu eklenecek:
- `primary_color`, `secondary_color`
- `font_family`
- `logo_url`
- `theme` (`modern | minimal | warm`)
- `custom_tagline`, `clinic_display_name`

---

### 3.3 Headless / Custom Frontend Desteği (Phase 7)

Klinikler istedikleri ajansla anlaşıp tamamen farklı bir frontend yaptırabilecek. Ajans Pronto backend API'larına bağlanır, kendi teknoloji stack'iyle frontend yazar. Backend değişmez.

Gereksinimler:
- Per-clinic `allowed_origins` dynamic CORS
- Swagger / Postman API dokümantasyonu
- Ajans onboarding paketi (auth flow, tenant resolution rehberi)
- "Pronto API Sertifikasyon Test Suite" — ajans entegrasyonu yayına girmeden önce onay süreci

**Fiyatlandırma:** Standart paket (Pronto arayüzü dahil) vs. Enterprise paket (custom frontend desteği).

---

### 3.4 Platform Super-Admin Paneli (Phase 7)

Klinik oluşturma, domain atama, plan yönetimi ve resource limitleri için ayrı bir super-admin paneli. `POST /api/clinics` endpoint'i bu role taşınacak.

---

### 3.5 SaaS Monetization (Phase 8)

Stripe veya iyzico entegrasyonu, abonelik planları, otomatik fatura, plan upgrade/downgrade akışı. Per-clinic resource limitleri (maks doktor sayısı, maks randevu/ay).

---

## 4. Öncelik Özeti

| # | Başlık | Öncelik | Tür | Efor |
|---|---|---|---|---|
| 1.2 | `kvkk_consent_ip` boş kaydediliyor | 🔴 Yüksek | Teknik | Küçük |
| 1.3 | Google OAuth KVKK rıza eksikliği | 🔴 Yüksek | Teknik + Hukuki | Orta |
| 2.1 | Saklama süresi belirsiz | 🔴 Yüksek | Hukuki | Hukuki danışman |
| 1.1 | `POST /api/clinics` erişim sorunu | 🟡 Orta | Mimari | Küçük |
| 1.4 | `birth_date`, `gender`, `notes` şifrelenmemiş | 🟡 Orta | Güvenlik | Orta |
| 1.5 | HSTS başlığı eksik | 🟡 Orta | HTTP Güvenliği | Küçük (HTTPS'de) |
| 2.2 | İlgili kişi başvuru modülü yok | 🟡 Orta | Hukuki | Phase 7-8 |
| 2.3 | SMTP veri işleyen sözleşmesi | 🟡 Orta | Hukuki | Operasyonel |
| 2.4 | VPS lokasyon belgesi | 🟡 Orta | Hukuki | Operasyonel |
| 1.6 | Audit log DB-level koruması yok | 🟢 Düşük | Güvenlik | Uzun vadeli |

---

*Bu belge, teknik dokümantasyon incelemesi ve mimari değerlendirme oturumu kapsamında hazırlanmıştır. Hukuki konularda avukat görüşü alınması zorunludur.*
