# KVKK Uyum ve Bilgi Güvenliği Dokümantasyonu

**Belge Adı:** Pronto Patient Pro KVKK Uyum ve Bilgi Güvenliği Dokümantasyonu  
**Versiyon:** 1.0  
**Tarih:** 04.05.2026  
**Hazırlayan:** Pronto Patient Pro Teknik İnceleme Ekibi

# 1. Veri Sorumlusu Bilgileri

## 1.1 Klinik Bilgileri

Bu doküman, Pronto Patient Pro çok kiracılı hasta ve klinik yönetim sistemi üzerinde kişisel veri işleme ve bilgi güvenliği tedbirlerini açıklamak üzere hazırlanmıştır.

**Veri Sorumlusu Klinik:** [KLİNİK ADI]  
**Vergi No:** [VERGİ NO]  
**Adres:** [ADRES]  
**E-posta:** [E-POSTA]  
**Telefon:** [TELEFON]

## 1.2 Çok Kiracılı Sistem Yapısı

Pronto Patient Pro, birden fazla kliniğin aynı uygulama altyapısı üzerinde, `clinic_id` temelli ayrıştırma ile hizmet alabildiği çok kiracılı bir sistemdir. Her klinik, kendi hastaları, kullanıcıları, randevuları, klinik notları ve işlem kayıtları bakımından ayrı veri sorumlusu olarak değerlendirilir.

Uygulama kodunda hasta, kullanıcı, randevu, klinik not, dosya ve denetim kayıtları klinik bazında ilişkilendirilmekte; yetkilendirme ve sorgu katmanlarında klinik sınırı `clinic_id` üzerinden uygulanmaktadır.

# 2. İşlenen Kişisel Veriler

## 2.1 Hasta Verileri

`backend/src/database/schema/patients.schema.ts` dosyasında doğrulanan hasta tablosu alanları aşağıdaki gibidir:

| Alan | Açıklama | Kategori |
| --- | --- | --- |
| `id` | Hasta kaydı benzersiz kimliği | Sistemsel kayıt verisi |
| `clinic_id` | İlgili klinik kimliği | Sistemsel ilişki verisi |
| `user_id` | Hasta kullanıcı hesabı ilişkisi | Sistemsel ilişki verisi |
| `first_name` | Ad | Kimlik |
| `last_name` | Soyad | Kimlik |
| `tc_no` | T.C. kimlik numarası | Kimlik |
| `tc_no_hash` | T.C. kimlik numarası arama indeksi | Güvenlik/arama amaçlı türetilmiş veri |
| `birth_date` | Doğum tarihi | Kimlik |
| `gender` | Cinsiyet | Kimlik |
| `phone` | Telefon | İletişim |
| `email` | E-posta | İletişim |
| `address` | Adres | İletişim |
| `notes` | Hasta notu | Sağlık / Özel Nitelikli Kişisel Veri olabilecek serbest metin |
| `is_active` | Aktiflik durumu | Sistemsel kayıt verisi |
| `created_at` | Oluşturulma tarihi | Sistemsel kayıt verisi |
| `updated_at` | Güncellenme tarihi | Sistemsel kayıt verisi |

## 2.2 Kullanıcı Verileri

`backend/src/database/schema/users.schema.ts` dosyasında doğrulanan kullanıcı tablosu alanları aşağıdaki gibidir:

| Alan | Açıklama | Kategori |
| --- | --- | --- |
| `id` | Kullanıcı benzersiz kimliği | Sistemsel kayıt verisi |
| `email` | E-posta | İletişim |
| `password_hash` | Parola özeti | Kimlik doğrulama/güvenlik verisi |
| `first_name` | Ad | Kimlik |
| `last_name` | Soyad | Kimlik |
| `phone` | Telefon | İletişim |
| `role` | Kullanıcı rolü | Yetkilendirme verisi |
| `clinic_id` | İlgili klinik kimliği | Sistemsel ilişki verisi |
| `is_active` | Aktiflik durumu | Sistemsel kayıt verisi |
| `google_id` | Google OAuth kullanıcı kimliği | Kimlik doğrulama verisi |
| `avatar_url` | Profil görseli bağlantısı | Kimlik/profil verisi |
| `created_at` | Oluşturulma tarihi | Sistemsel kayıt verisi |
| `updated_at` | Güncellenme tarihi | Sistemsel kayıt verisi |
| `kvkk_consent_at` | KVKK açık rıza zamanı | Rıza kayıt verisi |
| `kvkk_consent_version` | Rıza metni versiyonu | Rıza kayıt verisi |
| `kvkk_consent_ip` | Rıza IP adresi | Rıza ve işlem güvenliği verisi |
| `failed_login_attempts` | Başarısız giriş sayısı | İşlem güvenliği verisi |
| `locked_until` | Hesap kilit bitiş zamanı | İşlem güvenliği verisi |
| `password_reset_token_hash` | Parola sıfırlama token özeti | Kimlik doğrulama/güvenlik verisi |
| `password_reset_expires_at` | Parola sıfırlama geçerlilik zamanı | Kimlik doğrulama/güvenlik verisi |

## 2.3 Klinik Not Verileri

`backend/src/database/schema/patient-clinical-notes.schema.ts` dosyasında doğrulanan hasta klinik notu alanları aşağıdaki gibidir:

| Alan | Açıklama | Kategori |
| --- | --- | --- |
| `id` | Klinik not benzersiz kimliği | Sistemsel kayıt verisi |
| `clinic_id` | İlgili klinik kimliği | Sistemsel ilişki verisi |
| `patient_id` | Hasta ilişkisi | Sistemsel ilişki verisi |
| `doctor_id` | Hekim ilişkisi | Sistemsel ilişki verisi |
| `appointment_id` | Randevu ilişkisi | Sistemsel ilişki verisi |
| `diagnosis` | Tanı | Sağlık / Özel Nitelikli Kişisel Veri |
| `treatment` | Tedavi | Sağlık / Özel Nitelikli Kişisel Veri |
| `prescription` | Reçete | Sağlık / Özel Nitelikli Kişisel Veri |
| `notes` | Klinik serbest metin notu | Sağlık / Özel Nitelikli Kişisel Veri |
| `expires_at` | Not saklama/geçerlilik zamanı | Sistemsel saklama verisi |
| `created_at` | Oluşturulma tarihi | Sistemsel kayıt verisi |
| `updated_at` | Güncellenme tarihi | Sistemsel kayıt verisi |

## 2.4 Randevu Not Verileri

`backend/src/database/schema/appointment-notes.schema.ts` dosyasında doğrulanan randevu notu alanları aşağıdaki gibidir:

| Alan | Açıklama | Kategori |
| --- | --- | --- |
| `id` | Randevu notu benzersiz kimliği | Sistemsel kayıt verisi |
| `appointment_id` | Randevu ilişkisi | Sistemsel ilişki verisi |
| `clinic_id` | İlgili klinik kimliği | Sistemsel ilişki verisi |
| `doctor_id` | Hekim ilişkisi | Sistemsel ilişki verisi |
| `diagnosis` | Tanı | Sağlık / Özel Nitelikli Kişisel Veri |
| `treatment` | Tedavi | Sağlık / Özel Nitelikli Kişisel Veri |
| `prescription` | Reçete | Sağlık / Özel Nitelikli Kişisel Veri |
| `notes` | Klinik serbest metin notu | Sağlık / Özel Nitelikli Kişisel Veri |
| `created_at` | Oluşturulma tarihi | Sistemsel kayıt verisi |
| `updated_at` | Güncellenme tarihi | Sistemsel kayıt verisi |

## 2.5 Özel Nitelikli Kişisel Veri Niteliği

Tanı, tedavi, reçete, klinik not, hasta sağlık geçmişi veya sağlık durumunu ortaya koyabilecek serbest metin alanları KVKK kapsamında özel nitelikli kişisel veri niteliğindedir. Bu verilerin işlenmesi bakımından ilgili klinik tarafından KVKK, ikincil mevzuat, sağlık mevzuatı ve Kurul kararları uyarınca gerekli açık rıza, aydınlatma, yetkilendirme, saklama ve imha süreçleri ayrıca işletilmelidir.

# 3. Veri Güvenliği Tedbirleri

## 3.1 Şifreleme

Kod incelemesinde `backend/src/encryption/encryption.service.ts` içinde alan bazlı AES-256-GCM şifreleme uygulandığı doğrulanmıştır. Şifreleme servisinde:

- `ENCRYPTION_MASTER_KEY` yapılandırma değişkeni zorunlu tutulmakta ve 64 hex karakter, yani 32 byte uzunluğunda olması beklenmektedir.
- Her klinik için ayrı bir Data Encryption Key (DEK) üretilmekte veya mevcut DEK okunmaktadır.
- Klinik DEK bilgisi `clinic_encryption_keys` tablosunda `encrypted_dek`, `dek_version`, `is_active`, `created_at`, `rotated_at` alanları ile tutulmaktadır.
- DEK, `ENCRYPTION_MASTER_KEY` ile AES-256-GCM kullanılarak şifreli saklanmaktadır.
- Veri alanları şifrelenirken klinik DEK'i ile AES-256-GCM kullanılmakta; kayıt formatında versiyon, IV, authentication tag ve şifreli veri yer almaktadır.

Kodda doğrulanan şifreli alanlar:

| Modül | Şifrelenen Alanlar |
| --- | --- |
| Hasta servisi | `first_name`, `last_name`, `tc_no`, `phone`, `email`, `address` |
| Hasta klinik notları servisi | `diagnosis`, `treatment`, `prescription`, `notes` |
| Randevu notları servisi | `diagnosis`, `treatment`, `prescription`, `notes` |
| Randevu içinde oluşturulan hasta profili | `first_name`, `last_name`, `email`, `phone`, `address`, `tc_no` |
| Randevu bildirimleri için hasta seçim alanları | Gerektiğinde hasta ad, soyad ve e-posta alanları çözümlenmektedir |

Hasta tablosundaki `birth_date`, `gender`, `notes`, `is_active`, zaman damgaları ve sistemsel ilişki alanları için mevcut kodda alan bazlı şifreleme çağrısı doğrulanmamıştır. Bu durum, ek risk değerlendirmesi ve hukuki/teknik gereksinime göre ayrıca ele alınmalıdır.

## 3.2 T.C. Kimlik No Arama İndeksleme

T.C. kimlik numarası araması düz metin `tc_no` alanı üzerinden yapılmamaktadır. `backend/src/patients/patients.service.ts` içinde hasta oluşturma ve güncelleme sırasında `tc_no_hash` alanı, klinik DEK'i kullanılarak HMAC-SHA256 ile üretilmektedir.

Hasta arama fonksiyonu `findByTcNo`, gelen T.C. kimlik numarasını aynı HMAC yöntemi ile indeks değerine dönüştürmekte ve `patients.tc_no_hash` üzerinden eşleşme yapmaktadır. Böylece T.C. kimlik numarasının arama amacıyla düz metin ve doğrudan okunabilir biçimde tutulması engellenmektedir.

## 3.3 Kimlik Doğrulama

Kimlik doğrulama modülünde JWT, Redis destekli refresh token, parola özeti, OTP, hesap kilitleme ve Google OAuth desteği doğrulanmıştır.

- Access token varsayılan süresi `JWT_EXPIRES_IN` yapılandırması ile belirlenmekte, varsayılan değer `15m` olarak uygulanmaktadır.
- Refresh token varsayılan süresi `JWT_REFRESH_EXPIRES_IN` ile belirlenmekte, varsayılan değer `7d` olarak uygulanmaktadır.
- Refresh token değerleri Redis üzerinde `refresh:{userId}` anahtarı ile saklanmakta, token düz metin olarak değil SHA-256 özeti olarak tutulmaktadır.
- Redis refresh token TTL değeri kodda `604800` saniye, yani 7 gün olarak uygulanmaktadır.
- Refresh token yenileme işleminde mevcut token atomik Lua script ile doğrulanıp silinmekte, ardından yeni access ve refresh token üretilmektedir.
- Parolalar `bcrypt.hash(..., 12)` ile özetlenmektedir.
- Başarısız parola girişlerinde `failed_login_attempts` artırılmakta; 10 başarısız denemeden sonra hesap `15` dakika süreyle `locked_until` alanı üzerinden kilitlenmektedir.
- OTP kodu 6 hanelidir, varsayılan geçerlilik süresi 10 dakikadır ve azami 5 hatalı deneme hakkı tanınmaktadır.
- Google OAuth entegrasyonunda `email` ve `profile` kapsamları kullanılmakta; uygulama Google'dan Google kullanıcı kimliği, e-posta, ad, soyad ve profil fotoğrafı bilgisini almaktadır.
- Refresh token cookie değeri `httpOnly`, `sameSite=strict`, production ortamında `secure` ve 7 gün `maxAge` ile set edilmektedir.
- Güvenilir cihaz cookie değeri `httpOnly`, `sameSite=lax`, production ortamında `secure` ve 30 gün `maxAge` ile set edilmektedir.

## 3.4 Denetim Kaydı

Denetim kayıt mekanizması `backend/src/audit/audit.service.ts`, `backend/src/common/interceptors/audit.interceptor.ts` ve `backend/src/database/schema/audit-logs.schema.ts` dosyalarında doğrulanmıştır.

Denetim kaydı alanları:

- `clinic_id`
- `user_id`
- `user_role`
- `action`
- `entity`
- `entity_id`
- `metadata`
- `ip_address`
- `request_id`
- `created_at`

Audit interceptor, `GET` ve `HEAD` dışındaki HTTP işlemlerinde `@Audit` dekoratörü ile tanımlı aksiyonları kaydetmektedir. Kayıtlar ayrı `AUDIT_DRIZZLE` bağlantısı üzerinden `audit_logs` tablosuna insert edilmektedir. Mevcut kodda audit log kayıtlarını güncelleyen veya silen bir servis metodu doğrulanmamıştır; bu pratik uygulama seviyesinde değişmezlik yönünde bir tedbirdir. Bununla birlikte veritabanı düzeyinde append-only policy, trigger veya ayrı WORM saklama mekanizması kod içinde doğrulanmamıştır.

Kodda `@Audit` dekoratörü ile doğrulanan aksiyonlar:

- Klinik notları: `LIST_CLINICAL_NOTES`, `CREATE_CLINICAL_NOTE`, `UPDATE_CLINICAL_NOTE`, `DELETE_CLINICAL_NOTE`
- Profil ve kullanıcılar: `VIEW_PROFILE`, `UPDATE_PROFILE`, `LIST_USERS`, `UPDATE_ROLE`, `CREATE_USER`, `UPDATE_USER`, `UPDATE_USER_STATUS`, `DELETE_USER`
- Dosyalar: `UPLOAD_AVATAR`, `UPLOAD_FILE`, `DOWNLOAD_FILE`, `DELETE_FILE`
- Doktorlar: `UPDATE_DOCTOR`, `UPDATE_DOCTOR_STATUS`, `DELETE_DOCTOR`
- Hastalar: `CREATE_PATIENT`, `LIST_PATIENTS`, `VIEW_PATIENT`, `UPDATE_PATIENT`, `DELETE_PATIENT`
- Klinik ayarları: `UPDATE_CLINIC`, `UPDATE_CLINIC_LOGO`
- Randevular: `CREATE_APPOINTMENT`, `LIST_APPOINTMENTS`, `VIEW_APPOINTMENT`, `UPDATE_APPOINTMENT`, `UPDATE_APPOINTMENT_STATUS`, `DELETE_APPOINTMENT`
- Randevu notları: `CREATE_APPOINTMENT_NOTE`, `LIST_APPOINTMENT_NOTES`, `UPDATE_APPOINTMENT_NOTE`, `DELETE_APPOINTMENT_NOTE`

Kimlik doğrulama servisinde ayrıca manuel audit kayıtları ile `LOGIN_FAILED`, `LOGIN_SUCCESS`, `OTP_RESENT`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED` ve `TOKEN_REFRESH` olayları kaydedilmektedir.

## 3.5 Dosya Güvenliği

Dosya yükleme ve erişim kontrolleri `backend/src/storage` modülünde doğrulanmıştır.

- Avatar yüklemeleri için izin verilen MIME tipleri: `image/jpeg`, `image/png`, `image/webp`.
- Randevu dosyaları için izin verilen MIME tipleri: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
- Avatar dosya boyutu limiti 5 MB, randevu dosyası limiti 10 MB olarak uygulanmaktadır.
- Dosya uzantıları `.jpg`, `.jpeg`, `.png`, `.webp`, `.pdf` listesi ile sınırlandırılmakta ve dosya adları `randomUUID()` ile üretilmektedir.
- Yükleme sonrası içerik kontrolünde JPEG, PNG, WEBP ve PDF magic byte doğrulaması yapılmaktadır.
- İçerik ve beyan edilen MIME tipi uyuşmazsa dosya silinmekte ve işlem reddedilmektedir.
- Randevu dosyası indirme işlemi doğrudan `/uploads/appointments` statik yolu üzerinden açılmamış; Nginx yapılandırmasında bu yol için `403 Forbidden` dönülmektedir.
- Dosya indirme API üzerinden, kimliği doğrulanmış ve rol/yetki kontrolünden geçmiş kullanıcılar için yapılmaktadır.
- Doktor kullanıcıların yalnızca kendi randevularına ait dosyalara erişebilmesi; hasta kullanıcıların yalnızca kendi hasta profiline bağlı randevu dosyalarına erişebilmesi yönünde servis kontrolleri bulunmaktadır.

## 3.6 HTTP Güvenliği ve CORS

`nginx/nginx.conf` dosyasında aşağıdaki HTTP güvenlik başlıkları doğrulanmıştır:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none';`
- API yanıtları için `Cache-Control: no-store`
- `client_max_body_size 10M`

Mevcut Nginx yapılandırmasında HSTS başlığı doğrulanmamıştır. Uygulama tarafında `helmet` kullanılmakla birlikte ilgili başlıkların Nginx tarafından yönetilmesi için bazı helmet başlıkları kapatılmıştır.

CORS politikası `backend/src/main.ts` içinde dinamik olarak uygulanmaktadır:

- Origin bulunmayan istekler kabul edilmektedir.
- `CORS_ORIGIN` yapılandırma değeri, varsayılan olarak `http://localhost:5173`, kabul edilmektedir.
- Lokal geliştirme için `*.localhost` alt alanları kabul edilmektedir.
- Diğer origin değerlerinde host adı `clinics.domain` alanı üzerinden veritabanında aranmakta; kayıt yoksa CORS reddedilmektedir.
- Credentials etkin, izinli metotlar `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`; izinli başlıklar `Content-Type`, `Authorization`, `X-Requested-With`; exposed header `Content-Disposition`; max age `86400` saniyedir.

## 3.7 KVKK Açık Rıza

Kayıt akışı `backend/src/auth/auth.service.ts` ve `backend/src/auth/dto/register.dto.ts` dosyalarında doğrulanmıştır.

- Kullanıcı kayıt DTO'sunda `kvkkConsent` alanı zorunlu boolean değer olarak tanımlanmıştır.
- Parolalı kayıt işleminde `kvkkConsent` değeri sağlanmazsa işlem `KVKK consent is required` hatası ile reddedilmektedir.
- OTP doğrulaması tamamlandıktan sonra kullanıcı oluşturulurken rıza kaydı `users` tablosunda saklanmaktadır.
- Saklanan alanlar: `kvkk_consent_at`, `kvkk_consent_version`, `kvkk_consent_ip`.
- Mevcut kodda parolalı kayıt için rıza versiyonu `1.0` olarak set edilmektedir.
- Mevcut kodda `kvkk_consent_ip` alanı kayıt sırasında `null` set edilmektedir; IP adresinin bu alana yazılması teknik olarak bekleyen geliştirme olarak değerlendirilmelidir.
- Google OAuth ile ilk kez oluşturulan kullanıcı akışında `kvkk_consent_at`, `kvkk_consent_version` ve `kvkk_consent_ip` değerlerinin set edildiği doğrulanmamıştır. Bu akış için açık rıza/onay adımı ayrıca gözden geçirilmelidir.

# 4. Veri Saklama ve Silme

## 4.1 Saklama Süresi

Kliniklerin hasta, randevu, klinik not, denetim kaydı, kullanıcı ve dosya kayıtları için uygulanacak saklama süreleri, sağlık mevzuatı ve KVKK yükümlülükleri çerçevesinde hukuki danışmanlık sonrasında kesinleştirilmelidir.

**Saklama Süresi:** [SAKLAMA SÜRESİ - Hukuki Danışmanlık Sonrası Belirlenecek]

Mevcut kod incelemesinde genel bir veri saklama cron job mekanizması doğrulanmamıştır. `patient_clinical_notes` tablosunda `expires_at` alanı bulunmakla birlikte, bu alanı otomatik işleyen ve kayıtları periyodik olarak imha eden bir cron job mevcut incelemede tespit edilmemiştir.

## 4.2 Silme Mekanizmaları

Kodda doğrulanan silme ve pasifleştirme davranışları:

| Veri Türü | Mevcut Teknik Davranış |
| --- | --- |
| Hastalar | `patients.is_active=false` ile soft delete |
| Randevular | `status='cancelled'` geçişi ile iptal/soft delete benzeri davranış |
| Doktorlar | `is_active=false` ile soft delete |
| Klinikler | `is_active=false` ile soft delete |
| Uzmanlıklar | `is_active=false` ile soft delete |
| Hasta klinik notları | Veritabanından hard delete |
| Randevu notları | Veritabanından hard delete |
| Randevu dosyaları | Veritabanı kaydı hard delete ve disk dosyası silme |
| Personel/kullanıcı silme | `users` tablosundan hard delete |
| Güvenilir cihaz kayıtları | `trusted_devices` tablosundan hard delete |
| Doktor müsaitlik kayıtları | Hard delete |
| Doktor müsaitlik istisnaları | Hard delete |

KVKK kapsamında silme, yok etme veya anonim hale getirme talepleri için tablo bazında uygulanacak yöntem, yasal saklama yükümlülükleri ve tıbbi kayıtların saklanmasına ilişkin mevzuat ile birlikte değerlendirilmelidir. Mevcut kod, tüm veri türleri için merkezi bir “ilgili kişi silme talebi” iş akışı sunmamaktadır.

# 5. Veri Aktarımı

## 5.1 Barındırma ve Veri Konumu

Bu dokümanda esas alınan işletmesel beyan uyarınca uygulama verilerinin Türkiye lokasyonlu VPS üzerinde barındırılması öngörülmektedir. Kod incelemesi, verinin fiziksel lokasyonunu tek başına kanıtlamaz; bu husus hosting sözleşmesi, sunucu lokasyon belgeleri, yedekleme politikası ve altyapı sağlayıcı kayıtları ile ayrıca doğrulanmalıdır.

## 5.2 Üçüncü Taraf Servisler

Kod incelemesinde doğrulanan harici servis entegrasyonları:

- Google OAuth: `email` ve `profile` kapsamları kullanılmaktadır. Google'a sağlık verisi aktarımı yapan bir kod yolu doğrulanmamıştır. Google'dan alınan bilgiler Google kullanıcı kimliği, e-posta, ad, soyad ve profil fotoğrafı ile sınırlıdır.
- SMTP e-posta servisi: OTP, parola sıfırlama ve randevu bilgilendirme e-postaları `nodemailer` üzerinden yapılandırılmış SMTP sunucusuna gönderilmektedir. Bu kapsamda alıcı e-posta adresi, doğrulama kodu veya parola sıfırlama bağlantısı; randevu bildirimlerinde hasta adı, hekim adı, tarih, saat ve randevu türü gibi bilgiler e-posta altyapısına aktarılabilir.

Klinik tarafından Google OAuth, SMTP sağlayıcısı, VPS sağlayıcısı, yedekleme servisi ve varsa diğer hizmet sağlayıcılarla veri işleyen/veri aktarılan taraf ilişkileri KVKK madde 8 ve madde 9 kapsamında ayrıca değerlendirilmelidir.

# 6. İlgili Kişi Hakları

## 6.1 KVKK Madde 11 Kapsamındaki Haklar

İlgili kişiler, KVKK madde 11 kapsamında veri sorumlusu kliniğe başvurarak aşağıdaki haklarını kullanabilir:

- Kişisel veri işlenip işlenmediğini öğrenme.
- Kişisel verileri işlenmişse buna ilişkin bilgi talep etme.
- Kişisel verilerin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme.
- Yurt içinde veya yurt dışında kişisel verilerin aktarıldığı üçüncü kişileri bilme.
- Kişisel verilerin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme.
- KVKK ve ilgili mevzuat şartları çerçevesinde kişisel verilerin silinmesini veya yok edilmesini isteme.
- Düzeltme, silme veya yok etme işlemlerinin kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme.
- İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle kişinin kendisi aleyhine bir sonucun ortaya çıkmasına itiraz etme.
- Kişisel verilerin kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme.

## 6.2 Teknik Uygulama Durumu

Mevcut kod incelemesine göre:

- Hasta ve kullanıcı kayıtlarının listelenmesi/görüntülenmesi/güncellenmesi için teknik API katmanları bulunmaktadır.
- Hasta kayıtlarında `is_active=false` ile soft delete mekanizması bulunmaktadır.
- Klinik not, randevu notu ve dosya kayıtlarında hard delete mekanizmaları bulunmaktadır.
- Merkezi bir ilgili kişi başvuru modülü, otomatik KVKK başvuru takip iş akışı, veri taşınabilirliği çıktısı, tüm sistem çapında veri dışa aktarma veya tüm ilişkili kayıtları kapsayan silme/anonymizasyon orkestrasyonu doğrulanmamıştır.

## 6.3 Başvuru Yöntemi

İlgili kişi başvuruları aşağıdaki yöntemle alınacaktır:

**Başvuru Kanalları:** [BAŞVURU YÖNTEMİ / E-POSTA / ADRES / KEP / FORM BİLGİSİ]

Başvurular, KVKK ve ilgili mevzuatta öngörülen süreler içinde veri sorumlusu klinik tarafından değerlendirilmelidir.

# 7. Teknik Uygulama Kanıtları

## 7.1 İncelenen Dosyalar

Bu doküman hazırlanırken aşağıdaki kaynak kod dosyaları incelenmiştir:

- `backend/src/database/schema/patients.schema.ts`
- `backend/src/database/schema/users.schema.ts`
- `backend/src/database/schema/patient-clinical-notes.schema.ts`
- `backend/src/database/schema/appointment-notes.schema.ts`
- `backend/src/database/schema/appointments.schema.ts`
- `backend/src/database/schema/appointment-files.schema.ts`
- `backend/src/database/schema/audit-logs.schema.ts`
- `backend/src/database/schema/clinic-encryption-keys.schema.ts`
- `backend/src/encryption/encryption.service.ts`
- `backend/src/patients/patients.service.ts`
- `backend/src/patient-clinical-notes/patient-clinical-notes.service.ts`
- `backend/src/appointments/appointments.service.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/strategies/google.strategy.ts`
- `backend/src/redis/redis.service.ts`
- `backend/src/audit/audit.service.ts`
- `backend/src/common/interceptors/audit.interceptor.ts`
- `backend/src/common/decorators/audit.decorator.ts`
- `backend/src/storage/storage.controller.ts`
- `backend/src/storage/storage.service.ts`
- `backend/src/storage/multer.config.ts`
- `backend/src/common/utils/magic-bytes.util.ts`
- `backend/src/main.ts`
- `backend/src/email/email.service.ts`
- `nginx/nginx.conf`

## 7.2 Doğrulanan Teknik Tedbirler

Kod incelemesi sonucunda aşağıdaki teknik tedbirlerin mevcut olduğu doğrulanmıştır:

- Klinik bazlı DEK mimarisi ve AES-256-GCM alan bazlı şifreleme.
- `ENCRYPTION_MASTER_KEY` zorunluluğu ve anahtar uzunluğu kontrolü.
- T.C. kimlik numarası için HMAC-SHA256 arama indeksi.
- JWT access token ve Redis destekli refresh token yapısı.
- Refresh token değerlerinin Redis'te hashlenmiş saklanması ve token rotasyonu.
- Bcrypt ile parola özeti.
- Başarısız giriş sayacı ve 10 denemeden sonra 15 dakika hesap kilitleme.
- OTP ile kayıt/giriş doğrulaması.
- Google OAuth `email` ve `profile` kapsamı.
- Audit log tablosu ve decorator/interceptor tabanlı audit mekanizması.
- Dosya MIME tipi, uzantı, boyut ve magic byte kontrolleri.
- Randevu dosyalarında API tabanlı yetkili indirme ve statik dizine doğrudan erişimin Nginx ile engellenmesi.
- Nginx güvenlik başlıkları ve API için `Cache-Control: no-store`.
- Veritabanı destekli dinamik CORS origin doğrulaması.
- Parolalı kayıt akışında KVKK rıza bayrağı ve rıza zaman/versiyon alanları.

## 7.3 Açık Hususlar ve İyileştirme Alanları

Aşağıdaki hususlar mevcut kod incelemesinde eksik veya hukuki/operasyonel doğrulamaya tabi olarak değerlendirilmiştir:

- HSTS başlığı Nginx yapılandırmasında doğrulanmamıştır.
- Hasta `birth_date`, `gender` ve `notes` alanları için mevcut kodda alan bazlı şifreleme çağrısı doğrulanmamıştır.
- Google OAuth ile ilk kez oluşturulan kullanıcılar için KVKK rıza alanlarının set edildiği doğrulanmamıştır.
- `kvkk_consent_ip` alanı parolalı kayıt akışında `null` set edilmektedir.
- Merkezi saklama/imha cron job mekanizması doğrulanmamıştır.
- Merkezi ilgili kişi başvuru ve tüm ilişkili verileri kapsayan silme/anonymizasyon iş akışı doğrulanmamıştır.
- Audit log için veritabanı seviyesinde append-only trigger, WORM saklama veya silme/güncelleme yetkisi kısıtı kod içinde doğrulanmamıştır.
- Türkiye VPS lokasyonu, yedekleme lokasyonu ve altyapı sağlayıcı taahhütleri koddan değil, sözleşmesel ve operasyonel belgelerden doğrulanmalıdır.
- SMTP sağlayıcısı üzerinden gönderilen e-postalar için veri işleyen sözleşmeleri ve aktarım koşulları klinik tarafından ayrıca değerlendirilmelidir.

# 8. Onay ve İmza

## 8.1 Veri Sorumlusu Onayı

Bu dokümanda yer alan teknik tespitler kaynak kod incelemesine dayalıdır. Hukuki uygunluk değerlendirmesi, nihai aydınlatma metinleri, açık rıza metinleri, saklama ve imha politikası ile veri işleyen sözleşmeleri veri sorumlusu klinik tarafından hukuki danışmanlık alınarak tamamlanmalıdır.

**Veri Sorumlusu Klinik:** [KLİNİK ADI]  
**Yetkili Adı Soyadı:** [YETKİLİ ADI SOYADI]  
**Unvan:** [UNVAN]  
**Tarih:** [TARİH]  
**İmza / Kaşe:** [İMZA / KAŞE]

## 8.2 Teknik Onay

**Teknik Sorumlu:** [TEKNİK SORUMLU ADI SOYADI]  
**Unvan:** [UNVAN]  
**Tarih:** [TARİH]  
**İmza:** [İMZA]
