# MediBook — Calendar Milestone 1 Context

## Projeyi Anlamak İçin

Bu dosyayı her yeni chat'te Claude'a ver. Claude bu dosyayı okuyarak projeye devam eder.

---

## Stack

- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + react-big-calendar
- Backend: NestJS + Drizzle ORM + PostgreSQL + Redis
- Auth: JWT + Google OAuth
- Çalışma yöntemi: Claude (orchestrator/reviewer) → Gemini CLI (code execution)

---

## Kesin Mimari Kurallar

- Backend her zaman otorite: slot truth, overlap legality, availability authority hep backend'de
- Frontend scheduling logic üretmez, conflict check yapmaz, availability hesaplamaz
- Hardcoded renk yok — sadece Tailwind token ve CSS variables (hsl(var(--primary)) vb.)
- Scope: calendar-only — homepage, auth, patient portal, admin dashboard dışarıda
- Eski proje base alınıyor, sıfırdan rewrite yok
- Modal yerine her zaman sağdan Sheet kullan (tutarlılık)
- Optimistic UI yasak — mutasyon beklensin, loading state gösterilsin
- Her Gemini prompt'unun sonuna şunu ekle:
  "Before finishing, read the full import section of every file you modified
  and confirm all referenced components, hooks, and utilities are actually
  imported. If anything is missing, add it now."

---

## Dosya Haritası

```
src/
├── components/
│   ├── calendar/
│   │   ├── DoctorCalendar.tsx         ← ana component
│   │   ├── AppointmentCreateSheet.tsx ← sekreter randevu oluşturma (kayıtlı hasta var, yeni hasta YOK henüz)
│   │   ├── OverrideDetailSheet.tsx    ← blackout/custom_hours detay + sil
│   │   ├── AvailabilityModal.tsx      ← dokunulmadı
│   │   └── OverrideModal.tsx          ← dokunulmadı
│   └── appointments/
│       └── AppointmentDetailSheet.tsx ← Dialog→Sheet dönüşümü yapıldı, confirm ekle var
├── pages/
│   ├── doctor/DoctorSchedule.tsx      ← header temizlendi
│   └── staff/StaffDoctors.tsx         ← mode="staff", badge silindi
├── utils/calendarUtils.ts             ← availabilityToEvents fix yapıldı
├── types/calendar.ts                  ← dokunulmadı
└── index.css                          ← Google Calendar CSS override'lar eklendi
```

---

## Tamamlanan Değişiklikler

- calendarUtils.ts — mapperlar temiz, cross-stream derivation yok
- DoctorCalendar.tsx — existingSlot frontend truth check silindi
- DoctorCalendar.tsx — mode prop eklendi ("doctor" | "staff")
- DoctorCalendar.tsx — CalendarEventCard component eklendi (token renkleri)
- DoctorCalendar.tsx — CalendarToolbar custom component eklendi
- DoctorCalendar.tsx — SlotPopup component eklendi
- DoctorCalendar.tsx — AppointmentCreateSheet import ve render edildi
- DoctorCalendar.tsx — OverrideDetailSheet import ve render edildi
- DoctorCalendar.tsx — Day view availability fix (availabilityToEvents tarih bug düzeltildi)
- AppointmentCreateSheet.tsx — yeni component, sadece kayıtlı hasta arama var
- StaffDoctors.tsx — mode="staff" prop eklendi
- StaffDoctors.tsx — isAvailableToday / todaySlotCount / badge silindi
- DoctorSchedule.tsx — header temizlendi
- index.css — Google Calendar CSS override'lar eklendi
- OverrideDetailSheet.tsx — yeni component, sil + inline onay
- AppointmentDetailSheet.tsx — Dialog→Sheet dönüşümü + tamamlandı inline onay

---

## Bekleyen İşler (Sırayla)

### 1. Şu an test edilmesi gereken
Tarayıcıda kontrol:
- AppointmentDetailSheet sağdan sheet mi açılıyor?
- Randevuya tıkla → tamamlandı butonu → inline onay çalışıyor mu?
- Blackout tıkla → OverrideDetailSheet açılıyor mu?
- Sil → inline onay → gerçekten siliniyor mu?
- SlotPopup → Müsaitlik Ekle → modal açılıyor mu?
- SlotPopup → Zaman Blokla → modal açılıyor mu?

### 2. AppointmentCreateSheet — yeni hasta tab'ı
İki tab eklenecek:
- [ Kayıtlı Hasta Ara ] — şu an var
- [ Yeni Hasta Ekle ] — yok, yapılacak

Yeni Hasta Ekle alanları:
- Ad (zorunlu)
- Soyad (zorunlu)
- Telefon (pratik zorunlu)

Submit akışı:
1. api.patients.create({ firstName, lastName, phone }) → hata varsa dur
2. api.appointments.create({ patientId: createdPatient.id, ... }) → başarılı → kapat

### 3. Design polish
- Grid satır yüksekliği artacak
- Gün header'ları Google Calendar gibi (gün adı küçük, tarih büyük, bugün mavi daire)
- Event kartları daha dolgun
- Seçili slot highlight

### 4. Hasta arama gösterimi
Şu an sadece isim gösteriyor. İsim + telefon göstermeli.

---

## UX Kararları (Kesinleşti)

### Tutarlı davranış — hepsi sağdan sheet
- Slot seç → popup → aksiyon → sağdan sheet
- Randevu tıkla → sağdan sheet (AppointmentDetailSheet)
- Blackout/custom_hours tıkla → sağdan sheet (OverrideDetailSheet)

### SlotPopup içeriği
- Randevu Oluştur → sadece mode="staff"
- Müsaitlik Ekle → her iki mod
- Zaman Blokla → her iki mod

### Onay akışları
- Tamamlandı: Buton → inline onay → İptal / Evet
- Sil: Buton → inline onay → İptal / Evet, Sil

---

## API Contract (Doğrulandı)

```typescript
api.patients.list({ search?: string, page?: number, limit?: number })
api.patients.create({ firstName, lastName, phone?, email?, tcNo?, ... })
// firstName + lastName zorunlu
// user_id: null → sekreter kaydı, portal kullanıcısı değil

api.appointments.create({
  doctorId, patientId, appointmentDate, startTime, endTime,
  type?, notes?
})

api.availability.listByDoctor(doctorId)
// is_active filtresi yok, hepsini döner, frontend is_active kontrolü yapmalı

api.availabilityOverrides.listByDoctor(doctorId)
api.availabilityOverrides.remove(id)
```

---

## CalendarEvent Type

```typescript
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  type: "availability" | "appointment" | "blackout" | "custom_hours";
  resource?: Appointment | AvailabilitySlot | AvailabilityOverride;
}
```

---

## DoctorCalendar Props

```typescript
interface DoctorCalendarProps {
  doctorId: string;
  mode?: "doctor" | "staff"; // default: "doctor"
}
```

---

## Bilinen Riskler

- calendarUtils.ts — cross-stream derivation eklenmemeli
- StaffDoctors.tsx — availability fetch loop geri gelmemeli
- Client-side conflict check hiçbir yere eklenmemeli
- Gemini bazen import'ları unutuyor — her promptun sonunda import kontrolü yaptır
- Gemini bazen önceki değişiklikleri eziyor — kritik değişikliklerden sonra ilgili satırları doğrulat

---

## Yeni Chat'te Nasıl Kullanılır

1. Bu dosyayı Claude'a ver
2. "Bu context dosyasına göre devam et" de
3. Claude mimariyi, kararları ve bekleyen işleri hatırlayacak
4. Sıradaki adımı sor, Claude Gemini prompt'unu yazar