# Terminology Discovery

Generated on 2026-04-22 from src/ (.ts, .tsx, .json, .md).

## Main i18n / language files

- src/contexts/LanguageContext.tsx
- src/i18n/ar.ts
- src/i18n/config.ts
- src/i18n/en.ts
- src/i18n/es.ts
- src/i18n/fr.ts
- src/i18n/ru.ts
- src/i18n/tr.ts

## Search terms covered

- blackout
- blok istisnası
- Blok İstisnası
- bloklu
- Bloklu zaman
- custom_hours
- custom-hours
- istisna
- İstisna
- kapalı gün
- Müsait Değil
- Override

## Occurrences

| File | Line | Exact string | Context | Source line |
| --- | ---: | --- | --- | --- |
| src/components/calendar/DoctorCalendar.tsx | 51 | Override | import/reference | import { OverrideModal } from "@/components/calendar/OverrideModal"; |
| src/components/calendar/DoctorCalendar.tsx | 51 | Override | import/reference | import { OverrideModal } from "@/components/calendar/OverrideModal"; |
| src/components/calendar/DoctorCalendar.tsx | 99 | Override | type/interface definition | AvailabilityOverride, |
| src/components/calendar/DoctorCalendar.tsx | 183 | custom_hours | code reference | "custom_hours" \\| "blackout", |
| src/components/calendar/DoctorCalendar.tsx | 191 | custom_hours | code reference | custom_hours: { |
| src/components/calendar/DoctorCalendar.tsx | 192 | custom-hours | code reference | background: "hsl(var(--calendar-custom-hours-bg))", |
| src/components/calendar/DoctorCalendar.tsx | 193 | custom-hours | code reference | text: "hsl(var(--calendar-custom-hours-fg))", |
| src/components/calendar/DoctorCalendar.tsx | 194 | custom-hours | code reference | mutedText: "hsl(var(--calendar-custom-hours-meta))", |
| src/components/calendar/DoctorCalendar.tsx | 195 | custom-hours | code reference | accent: "hsl(var(--calendar-custom-hours-accent))", |
| src/components/calendar/DoctorCalendar.tsx | 256 | unavailable | code reference | kind: "available" \\| "unavailable" \\| "blocked"; |
| src/components/calendar/DoctorCalendar.tsx | 262 | Override | type/interface definition | override: AvailabilityOverride \\| null; |
| src/components/calendar/DoctorCalendar.tsx | 325 | Blackout | type/interface definition | interface BlackoutSurfaceEvent { |
| src/components/calendar/DoctorCalendar.tsx | 347 | unavailable | code reference | \\| "unavailable" |
| src/components/calendar/DoctorCalendar.tsx | 354 | Blackout | code reference | \\| BlackoutSurfaceEvent; |
| src/components/calendar/DoctorCalendar.tsx | 412 | Override | type/interface definition | function getOverrideBadge(type: AvailabilityOverride["type"]) { |
| src/components/calendar/DoctorCalendar.tsx | 412 | Override | type/interface definition | function getOverrideBadge(type: AvailabilityOverride["type"]) { |
| src/components/calendar/DoctorCalendar.tsx | 419 | Bloklu zaman | form label or placeholder | label: "Bloklu zaman", |
| src/components/calendar/DoctorCalendar.tsx | 420 | custom_hours | code reference | color: OVERRIDE_EVENT_STYLES.custom_hours.accent, |
| src/components/calendar/DoctorCalendar.tsx | 424 | Override | type/interface definition | function compareOverrides(left: AvailabilityOverride, right: AvailabilityOverride) { |
| src/components/calendar/DoctorCalendar.tsx | 424 | Override | type/interface definition | function compareOverrides(left: AvailabilityOverride, right: AvailabilityOverride) { |
| src/components/calendar/DoctorCalendar.tsx | 424 | Override | type/interface definition | function compareOverrides(left: AvailabilityOverride, right: AvailabilityOverride) { |
| src/components/calendar/DoctorCalendar.tsx | 556 | unavailable | code reference | return "unavailable"; |
| src/components/calendar/DoctorCalendar.tsx | 597 | unavailable | code reference | return "unavailable"; |
| src/components/calendar/DoctorCalendar.tsx | 605 | unavailable | code reference | return "unavailable"; |
| src/components/calendar/DoctorCalendar.tsx | 1008 | custom-hours | code reference | : "scheduler-agenda-event-custom-hours"; |
| src/components/calendar/DoctorCalendar.tsx | 1262 | Override | code reference | const [overrideModal, setOverrideModal] = useState<{ |
| src/components/calendar/DoctorCalendar.tsx | 1266 | custom_hours | code reference | initialType?: "blackout" \\| "custom_hours"; |
| src/components/calendar/DoctorCalendar.tsx | 1267 | Override | type/interface definition | override?: AvailabilityOverride; |
| src/components/calendar/DoctorCalendar.tsx | 1273 | Override | code reference | const [overrideToDelete, setOverrideToDelete] = |
| src/components/calendar/DoctorCalendar.tsx | 1274 | Override | type/interface definition | useState<AvailabilityOverride \\| null>(null); |
| src/components/calendar/DoctorCalendar.tsx | 1375 | Override | type/interface definition | api.availabilityOverrides.listByDoctor( |
| src/components/calendar/DoctorCalendar.tsx | 1379 | Override | type/interface definition | ) as Promise<AvailabilityOverride[]>, |
| src/components/calendar/DoctorCalendar.tsx | 1415 | Override | code reference | isLoading: isOverrideListLoading, |
| src/components/calendar/DoctorCalendar.tsx | 1419 | Override | type/interface definition | api.availabilityOverrides.listByDoctor( |
| src/components/calendar/DoctorCalendar.tsx | 1423 | Override | type/interface definition | ) as Promise<AvailabilityOverride[]>, |
| src/components/calendar/DoctorCalendar.tsx | 1456 | Override | code reference | const removeOverride = useMutation({ |
| src/components/calendar/DoctorCalendar.tsx | 1457 | Override | type/interface definition | mutationFn: async (overrideId: string) => api.availabilityOverrides.remove(overrideId), |
| src/components/calendar/DoctorCalendar.tsx | 1460 | Override | code reference | setOverrideToDelete(null); |
| src/components/calendar/DoctorCalendar.tsx | 1501 | Override | code reference | const sameDayOverrides = (data?.overrides ?? []).filter( |
| src/components/calendar/DoctorCalendar.tsx | 1505 | Override | code reference | const blackoutOverride = sameDayOverrides.find( |
| src/components/calendar/DoctorCalendar.tsx | 1505 | Override | code reference | const blackoutOverride = sameDayOverrides.find( |
| src/components/calendar/DoctorCalendar.tsx | 1539 | Override | code reference | if (blackoutOverride) { |
| src/components/calendar/DoctorCalendar.tsx | 1549 | Override | type/interface definition | return api.availabilityOverrides.create({ |
| src/components/calendar/DoctorCalendar.tsx | 1552 | custom_hours | API/domain type literal | type: "custom_hours", |
| src/components/calendar/DoctorCalendar.tsx | 1663 | Override | code reference | const dayOverrides = (data?.overrides ?? []).filter( |
| src/components/calendar/DoctorCalendar.tsx | 1667 | Override | code reference | if (dayOverrides.some((override) => override.type === "blackout")) { |
| src/components/calendar/DoctorCalendar.tsx | 1671 | Override | code reference | const blockedRanges = dayOverrides |
| src/components/calendar/DoctorCalendar.tsx | 1674 | custom_hours | code reference | override.type === "custom_hours" && |
| src/components/calendar/DoctorCalendar.tsx | 1832 | Override | code reference | const sortedOverrides = useMemo( |
| src/components/calendar/DoctorCalendar.tsx | 1833 | Override | code reference | () => [...overrideList].sort(compareOverrides), |
| src/components/calendar/DoctorCalendar.tsx | 1967 | Override | code reference | const getBlockingOverrideForRange = (start: Date, end: Date) => { |
| src/components/calendar/DoctorCalendar.tsx | 1969 | Override | code reference | const dayOverrides = (data?.overrides ?? []) |
| src/components/calendar/DoctorCalendar.tsx | 1971 | Override | code reference | .sort(compareOverrides); |
| src/components/calendar/DoctorCalendar.tsx | 1974 | Override | code reference | dayOverrides.find((override) => { |
| src/components/calendar/DoctorCalendar.tsx | 2072 | Override | type/interface definition | blockingOverride: AvailabilityOverride \\| null; |
| src/components/calendar/DoctorCalendar.tsx | 2072 | Override | type/interface definition | blockingOverride: AvailabilityOverride \\| null; |
| src/components/calendar/DoctorCalendar.tsx | 2079 | Override | code reference | const blockingOverride = getBlockingOverrideForRange(start, end); |
| src/components/calendar/DoctorCalendar.tsx | 2079 | Override | code reference | const blockingOverride = getBlockingOverrideForRange(start, end); |
| src/components/calendar/DoctorCalendar.tsx | 2085 | Override | code reference | blockingOverride, |
| src/components/calendar/DoctorCalendar.tsx | 2090 | Override | code reference | kind: blockingOverride |
| src/components/calendar/DoctorCalendar.tsx | 2094 | unavailable | code reference | : "unavailable", |
| src/components/calendar/DoctorCalendar.tsx | 2113 | custom_hours | code reference | event.type === "custom_hours" && |
| src/components/calendar/DoctorCalendar.tsx | 2116 | custom_hours | code reference | event.type === "custom_hours" && "scheduler-event-custom-hours", |
| src/components/calendar/DoctorCalendar.tsx | 2116 | custom-hours | code reference | event.type === "custom_hours" && "scheduler-event-custom-hours", |
| src/components/calendar/DoctorCalendar.tsx | 2230 | custom_hours | code reference | if (event.type === "blackout" \\|\\| event.type === "custom_hours") { |
| src/components/calendar/DoctorCalendar.tsx | 2280 | Override | type/interface definition | const override = event.resource as AvailabilityOverride; |
| src/components/calendar/DoctorCalendar.tsx | 2281 | Override | code reference | setOverrideModal({ |
| src/components/calendar/DoctorCalendar.tsx | 2290 | custom_hours | code reference | if (event.type === "custom_hours") { |
| src/components/calendar/DoctorCalendar.tsx | 2291 | Override | type/interface definition | const override = event.resource as AvailabilityOverride; |
| src/components/calendar/DoctorCalendar.tsx | 2292 | Override | code reference | setOverrideModal({ |
| src/components/calendar/DoctorCalendar.tsx | 2315 | Override | code reference | const handleOpenOverrideCreate = ( |
| src/components/calendar/DoctorCalendar.tsx | 2317 | custom_hours | API/domain type literal | type: "blackout" \\| "custom_hours", |
| src/components/calendar/DoctorCalendar.tsx | 2325 | Override | code reference | setOverrideModal({ |
| src/components/calendar/DoctorCalendar.tsx | 2338 | Override | type/interface definition | override?: AvailabilityOverride \\| null; |
| src/components/calendar/DoctorCalendar.tsx | 2836 | unavailable | code reference | : quickActionSlotStatus === "unavailable" |
| src/components/calendar/DoctorCalendar.tsx | 2849 | unavailable | code reference | quickActionSlot.kind === "unavailable"); |
| src/components/calendar/DoctorCalendar.tsx | 2868 | Override | code reference | const nextBlockingOverride = getBlockingOverrideForRange(nextStart, nextEnd); |
| src/components/calendar/DoctorCalendar.tsx | 2868 | Override | code reference | const nextBlockingOverride = getBlockingOverrideForRange(nextStart, nextEnd); |
| src/components/calendar/DoctorCalendar.tsx | 2873 | Override | code reference | kind: nextBlockingOverride ? "blocked" : nextAvailabilityTarget ? "available" : "unavailable", |
| src/components/calendar/DoctorCalendar.tsx | 2873 | unavailable | code reference | kind: nextBlockingOverride ? "blocked" : nextAvailabilityTarget ? "available" : "unavailable", |
| src/components/calendar/DoctorCalendar.tsx | 2879 | Override | code reference | override: nextBlockingOverride ?? null, |
| src/components/calendar/DoctorCalendar.tsx | 3014 | Override | code reference | const handleQuickActionEditOverride = () => { |
| src/components/calendar/DoctorCalendar.tsx | 3025 | Override | code reference | setOverrideModal({ |
| src/components/calendar/DoctorCalendar.tsx | 3074 | Override | button/menu/action label or handler | onClick={handleQuickActionEditOverride} |
| src/components/calendar/DoctorCalendar.tsx | 3083 | unavailable | code reference | if (quickActionSlotStatus === "unavailable") { |
| src/components/calendar/DoctorCalendar.tsx | 3160 | istisna | code reference | Blok istisnasi ekle |
| src/components/calendar/DoctorCalendar.tsx | 3189 | istisna | code reference | Blok istisnasi ekle |
| src/components/calendar/DoctorCalendar.tsx | 3210 | Override | code reference | if (slotState.blockingOverride) { |
| src/components/calendar/DoctorCalendar.tsx | 3213 | Override | code reference | override: slotState.blockingOverride, |
| src/components/calendar/DoctorCalendar.tsx | 3246 | unavailable | code reference | kind: "unavailable", |
| src/components/calendar/DoctorCalendar.tsx | 3301 | istisna | code reference | title="SaÄŸ tÄ±k: gÃ¼nlÃ¼k istisna ekle." |
| src/components/calendar/DoctorCalendar.tsx | 4058 | istisna | code reference | Bu iÅŸlem seÃ§ili aralÄ±k iÃ§in blok istisnasÄ± oluÅŸturur. HaftalÄ±k mÃ¼saitlik kuralÄ± korunur. |
| src/components/calendar/DoctorCalendar.tsx | 4144 | Override | code reference | handleOpenOverrideCreate(contextMenuState.date, "blackout") |
| src/components/calendar/DoctorCalendar.tsx | 4152 | custom_hours | code reference | handleOpenOverrideCreate(contextMenuState.date, "custom_hours") |
| src/components/calendar/DoctorCalendar.tsx | 4152 | Override | code reference | handleOpenOverrideCreate(contextMenuState.date, "custom_hours") |
| src/components/calendar/DoctorCalendar.tsx | 4155 | istisna | code reference | Bu gune blok istisnasi ekle |
| src/components/calendar/DoctorCalendar.tsx | 4327 | bloklu | code reference | Son 30 gun ve gelecek icin kapanis ve bloklu zaman istisnalari. |
| src/components/calendar/DoctorCalendar.tsx | 4327 | istisna | code reference | Son 30 gun ve gelecek icin kapanis ve bloklu zaman istisnalari. |
| src/components/calendar/DoctorCalendar.tsx | 4336 | Override | code reference | setOverrideModal({ |
| src/components/calendar/DoctorCalendar.tsx | 4351 | Override | code reference | {isOverrideListLoading ? ( |
| src/components/calendar/DoctorCalendar.tsx | 4357 | Override | code reference | ) : sortedOverrides.length > 0 ? ( |
| src/components/calendar/DoctorCalendar.tsx | 4359 | Override | code reference | {sortedOverrides.map((override) => { |
| src/components/calendar/DoctorCalendar.tsx | 4360 | Override | code reference | const badge = getOverrideBadge(override.type); |
| src/components/calendar/DoctorCalendar.tsx | 4387 | custom_hours | code reference | {override.type === "custom_hours" && override.start_time && override.end_time ? ( |
| src/components/calendar/DoctorCalendar.tsx | 4403 | Override | code reference | setOverrideModal({ |
| src/components/calendar/DoctorCalendar.tsx | 4421 | Override | button/menu/action label or handler | onClick={() => setOverrideToDelete(override)} |
| src/components/calendar/DoctorCalendar.tsx | 4432 | istisna | UI copy | <p className="text-sm text-muted-foreground">Tanimli istisna bulunmuyor.</p> |
| src/components/calendar/DoctorCalendar.tsx | 4506 | istisna | code reference | })} tarihli istisna kaldirilacak.\` |
| src/components/calendar/DoctorCalendar.tsx | 4507 | istisna | code reference | : "Bu istisna kaldirilacak."} |
| src/components/calendar/DoctorCalendar.tsx | 4511 | Override | button/menu/action label or handler | <AlertDialogCancel onClick={() => setOverrideToDelete(null)}> |
| src/components/calendar/DoctorCalendar.tsx | 4516 | Override | code reference | disabled={removeOverride.isPending} |
| src/components/calendar/DoctorCalendar.tsx | 4519 | Override | code reference | removeOverride.mutate(overrideToDelete.id); |
| src/components/calendar/DoctorCalendar.tsx | 4523 | Override | code reference | {removeOverride.isPending ? "Siliniyor..." : "Sil"} |
| src/components/calendar/DoctorCalendar.tsx | 4551 | Override | code reference | <OverrideModal |
| src/components/calendar/DoctorCalendar.tsx | 4554 | Override | code reference | setOverrideModal({ |
| src/components/calendar/DoctorCalendar.tsx | 4569 | Override | code reference | setOverrideModal({ |
| src/components/calendar/OverrideModal.tsx | 9 | Override | type/interface definition | import type { Appointment, AvailabilityOverride } from "@/types/calendar"; |
| src/components/calendar/OverrideModal.tsx | 40 | Override | type/interface definition | export interface OverrideModalProps { |
| src/components/calendar/OverrideModal.tsx | 47 | custom_hours | code reference | initialType?: "blackout" \\| "custom_hours"; |
| src/components/calendar/OverrideModal.tsx | 48 | Override | type/interface definition | override?: AvailabilityOverride; |
| src/components/calendar/OverrideModal.tsx | 57 | Override | code reference | export function OverrideModal({ |
| src/components/calendar/OverrideModal.tsx | 68 | Override | type/interface definition | }: OverrideModalProps) { |
| src/components/calendar/OverrideModal.tsx | 72 | custom_hours | code reference | const [type, setType] = useState<"blackout" \\| "custom_hours">("blackout"); |
| src/components/calendar/OverrideModal.tsx | 119 | custom_hours | code reference | if (type !== "custom_hours") return ""; |
| src/components/calendar/OverrideModal.tsx | 133 | custom_hours | code reference | start_time: type === "custom_hours" ? startTime : undefined, |
| src/components/calendar/OverrideModal.tsx | 134 | custom_hours | code reference | end_time: type === "custom_hours" ? endTime : undefined, |
| src/components/calendar/OverrideModal.tsx | 139 | Override | type/interface definition | return api.availabilityOverrides.update(override.id, payload); |
| src/components/calendar/OverrideModal.tsx | 142 | Override | type/interface definition | return api.availabilityOverrides.create({ |
| src/components/calendar/OverrideModal.tsx | 148 | overrideCreated | toast message | toast.success(mode === "edit" ? t.overrideUpdated : t.overrideCreated); |
| src/components/calendar/OverrideModal.tsx | 148 | overrideUpdated | toast message | toast.success(mode === "edit" ? t.overrideUpdated : t.overrideCreated); |
| src/components/calendar/OverrideModal.tsx | 157 | overrideSaveFailed | toast message | toast.error(error instanceof Error ? error.message : t.overrideSaveFailed); |
| src/components/calendar/OverrideModal.tsx | 163 | deleteOverrideTitle | code reference | if (!override) throw new Error(t.deleteOverrideTitle); |
| src/components/calendar/OverrideModal.tsx | 164 | Override | type/interface definition | return api.availabilityOverrides.remove(override.id); |
| src/components/calendar/OverrideModal.tsx | 167 | overrideRemoved | toast message | toast.success(t.overrideRemoved); |
| src/components/calendar/OverrideModal.tsx | 172 | overrideRemoveFailed | toast message | toast.error(error instanceof Error ? error.message : t.overrideRemoveFailed); |
| src/components/calendar/OverrideModal.tsx | 182 | overrideType | code reference | {t.overrideType} |
| src/components/calendar/OverrideModal.tsx | 185 | overrideCreateTitle | code reference | {mode === "edit" ? t.overrideEditTitle : t.overrideCreateTitle} |
| src/components/calendar/OverrideModal.tsx | 185 | overrideEditTitle | code reference | {mode === "edit" ? t.overrideEditTitle : t.overrideCreateTitle} |
| src/components/calendar/OverrideModal.tsx | 188 | overrideModalDesc | code reference | {t.overrideModalDesc} |
| src/components/calendar/OverrideModal.tsx | 250 | overrideType | form label or placeholder | <Label>{t.overrideType}</Label> |
| src/components/calendar/OverrideModal.tsx | 253 | custom_hours | code reference | onValueChange={(value) => setType(value as "blackout" \\| "custom_hours")} |
| src/components/calendar/OverrideModal.tsx | 261 | closeThisDay | UI copy | <span className="text-sm font-medium">{t.closeThisDay}</span> |
| src/components/calendar/OverrideModal.tsx | 264 | custom-hours | code reference | htmlFor="override-custom-hours" |
| src/components/calendar/OverrideModal.tsx | 267 | custom_hours | button/menu/action label or handler | <RadioGroupItem value="custom_hours" id="override-custom-hours" /> |
| src/components/calendar/OverrideModal.tsx | 267 | custom-hours | button/menu/action label or handler | <RadioGroupItem value="custom_hours" id="override-custom-hours" /> |
| src/components/calendar/OverrideModal.tsx | 268 | defineCustomHours | UI copy | <span className="text-sm font-medium">{t.defineCustomHours}</span> |
| src/components/calendar/OverrideModal.tsx | 273 | custom_hours | code reference | {type === "custom_hours" ? ( |
| src/components/calendar/OverrideModal.tsx | 366 | deleteOverrideTitle | modal/dialog title | <AlertDialogTitle>{t.deleteOverrideTitle}</AlertDialogTitle> |
| src/components/calendar/OverrideModal.tsx | 367 | overrideDeleteConfirm | modal/dialog description | <AlertDialogDescription>{t.overrideDeleteConfirm}</AlertDialogDescription> |
| src/i18n/ar.ts | 110 | unavailable | i18n translation entry | unavailable: "ØºÙŠØ± Ù…ØªØ§Ø­", |
| src/i18n/ar.ts | 149 | addException | i18n translation entry | addException: "Ø¥Ø¶Ø§ÙØ© Ø§Ø³ØªØ«Ù†Ø§Ø¡", |
| src/i18n/ar.ts | 155 | exceptions | i18n translation entry | exceptions: "Ø§Ù„Ø§Ø³ØªØ«Ù†Ø§Ø¡Ø§Øª", |
| src/i18n/ar.ts | 160 | overrideEditTitle | i18n translation entry | overrideEditTitle: "ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ø§Ø³ØªØ«Ù†Ø§Ø¡", |
| src/i18n/ar.ts | 161 | overrideCreateTitle | i18n translation entry | overrideCreateTitle: "Ø¥Ø¶Ø§ÙØ© Ø§Ø³ØªØ«Ù†Ø§Ø¡", |
| src/i18n/ar.ts | 216 | notAvailable | i18n translation entry | notAvailable: "ØºÙŠØ± Ù…ØªØ§Ø­", |
| src/i18n/en.ts | 159 | unavailable | i18n translation entry | doctorsLoadError: "Doctor data is unavailable right now. Please try again shortly.", |
| src/i18n/en.ts | 169 | unavailable | i18n translation entry | unavailable: "Unavailable", |
| src/i18n/en.ts | 234 | addException | i18n translation entry | addException: "Add Exception", |
| src/i18n/en.ts | 240 | Blackout | i18n translation entry | blackout: "Blackout", |
| src/i18n/en.ts | 244 | overrideRemoved | i18n translation entry | overrideRemoved: "Exception removed", |
| src/i18n/en.ts | 245 | overrideRemoveFailed | i18n translation entry | overrideRemoveFailed: "Exception could not be removed", |
| src/i18n/en.ts | 256 | exceptions | i18n translation entry | exceptions: "Exceptions", |
| src/i18n/en.ts | 257 | exceptions | i18n translation entry | exceptionsDesc: "Special closures or custom hours planned for the last 30 days and the upcoming period.", |
| src/i18n/en.ts | 258 | exceptions | i18n translation entry | noExceptionsDefined: "No exceptions have been defined.", |
| src/i18n/en.ts | 258 | noExceptionsDefined | i18n translation entry | noExceptionsDefined: "No exceptions have been defined.", |
| src/i18n/en.ts | 263 | deleteOverrideTitle | i18n translation entry | deleteOverrideTitle: "Delete exception?", |
| src/i18n/en.ts | 264 | deleteOverrideDesc | i18n translation entry | deleteOverrideDesc: "This exception will be removed.", |
| src/i18n/en.ts | 265 | deleteOverrideDateDesc | i18n translation entry | deleteOverrideDateDesc: "The exception dated {{date}} will be removed.", |
| src/i18n/en.ts | 280 | overrideEditTitle | i18n translation entry | overrideEditTitle: "Edit Exception", |
| src/i18n/en.ts | 281 | overrideCreateTitle | i18n translation entry | overrideCreateTitle: "Add Exception", |
| src/i18n/en.ts | 282 | overrideModalDesc | i18n translation entry | overrideModalDesc: "Close a specific day or define custom working hours for that day.", |
| src/i18n/en.ts | 283 | overrideType | i18n translation entry | overrideType: "Type", |
| src/i18n/en.ts | 284 | Blackout | i18n translation entry | closeThisDay: "Close this day (Blackout)", |
| src/i18n/en.ts | 284 | closeThisDay | i18n translation entry | closeThisDay: "Close this day (Blackout)", |
| src/i18n/en.ts | 285 | defineCustomHours | i18n translation entry | defineCustomHours: "Define custom hours (Custom hours)", |
| src/i18n/en.ts | 287 | overrideUpdated | i18n translation entry | overrideUpdated: "Exception updated", |
| src/i18n/en.ts | 288 | overrideCreated | i18n translation entry | overrideCreated: "Exception added", |
| src/i18n/en.ts | 289 | overrideSaveFailed | i18n translation entry | overrideSaveFailed: "An error occurred", |
| src/i18n/en.ts | 290 | overrideDeleteConfirm | i18n translation entry | overrideDeleteConfirm: "This action permanently removes the selected exception.", |
| src/i18n/en.ts | 438 | notAvailable | i18n translation entry | notAvailable: "Not Available", |
| src/i18n/en.ts | 440 | exceptions | i18n translation entry | doctorsPageManageDesc: "Manage doctor calendars, availability slots, and exceptions from here.", |
| src/i18n/en.ts | 466 | unavailable | i18n translation entry | specialtiesLoadError: "Specialty data is unavailable right now. Please try again shortly.", |
| src/i18n/es.ts | 148 | unavailable | i18n translation entry | unavailable: "No disponible", |
| src/i18n/es.ts | 200 | addException | i18n translation entry | addException: "Agregar excepciÃ³n", |
| src/i18n/es.ts | 208 | overrideRemoved | i18n translation entry | overrideRemoved: "ExcepciÃ³n eliminada", |
| src/i18n/es.ts | 212 | exceptions | i18n translation entry | exceptions: "Excepciones", |
| src/i18n/es.ts | 214 | deleteOverrideTitle | i18n translation entry | deleteOverrideTitle: "Â¿Eliminar excepciÃ³n?", |
| src/i18n/es.ts | 221 | overrideEditTitle | i18n translation entry | overrideEditTitle: "Editar excepciÃ³n", |
| src/i18n/es.ts | 222 | overrideCreateTitle | i18n translation entry | overrideCreateTitle: "Agregar excepciÃ³n", |
| src/i18n/es.ts | 223 | overrideUpdated | i18n translation entry | overrideUpdated: "ExcepciÃ³n actualizada", |
| src/i18n/es.ts | 224 | overrideCreated | i18n translation entry | overrideCreated: "ExcepciÃ³n agregada", |
| src/i18n/es.ts | 300 | notAvailable | i18n translation entry | notAvailable: "No disponible", |
| src/i18n/fr.ts | 165 | unavailable | i18n translation entry | unavailable: "Indisponible", |
| src/i18n/fr.ts | 224 | exceptions | i18n translation entry | calendarOverviewDesc: "DisponibilitÃ©s, rendez-vous et exceptions quotidiennes dans une seule vue.", |
| src/i18n/fr.ts | 226 | addException | i18n translation entry | addException: "Ajouter une exception", |
| src/i18n/fr.ts | 236 | overrideRemoved | i18n translation entry | overrideRemoved: "Exception supprimÃ©e", |
| src/i18n/fr.ts | 237 | overrideRemoveFailed | i18n translation entry | overrideRemoveFailed: "L'exception n'a pas pu Ãªtre supprimÃ©e", |
| src/i18n/fr.ts | 248 | exceptions | i18n translation entry | exceptions: "Exceptions", |
| src/i18n/fr.ts | 249 | exceptions | i18n translation entry | exceptionsDesc: "Fermetures spÃ©ciales ou horaires personnalisÃ©s prÃ©vus pour les 30 derniers jours et la pÃ©riode Ã  venir.", |
| src/i18n/fr.ts | 250 | noExceptionsDefined | i18n translation entry | noExceptionsDefined: "Aucune exception n'a Ã©tÃ© dÃ©finie.", |
| src/i18n/fr.ts | 255 | deleteOverrideTitle | i18n translation entry | deleteOverrideTitle: "Supprimer cette exception ?", |
| src/i18n/fr.ts | 256 | deleteOverrideDesc | i18n translation entry | deleteOverrideDesc: "Cette exception sera supprimÃ©e.", |
| src/i18n/fr.ts | 257 | deleteOverrideDateDesc | i18n translation entry | deleteOverrideDateDesc: "L'exception datÃ©e du {{date}} sera supprimÃ©e.", |
| src/i18n/fr.ts | 272 | overrideEditTitle | i18n translation entry | overrideEditTitle: "Modifier l'exception", |
| src/i18n/fr.ts | 273 | overrideCreateTitle | i18n translation entry | overrideCreateTitle: "Ajouter une exception", |
| src/i18n/fr.ts | 274 | overrideModalDesc | i18n translation entry | overrideModalDesc: "Fermez un jour prÃ©cis ou dÃ©finissez des horaires personnalisÃ©s pour ce jour.", |
| src/i18n/fr.ts | 275 | overrideType | i18n translation entry | overrideType: "Type", |
| src/i18n/fr.ts | 276 | closeThisDay | i18n translation entry | closeThisDay: "Fermer cette journÃ©e", |
| src/i18n/fr.ts | 277 | defineCustomHours | i18n translation entry | defineCustomHours: "DÃ©finir des horaires personnalisÃ©s", |
| src/i18n/fr.ts | 279 | overrideUpdated | i18n translation entry | overrideUpdated: "Exception mise Ã  jour", |
| src/i18n/fr.ts | 280 | overrideCreated | i18n translation entry | overrideCreated: "Exception ajoutÃ©e", |
| src/i18n/fr.ts | 281 | overrideSaveFailed | i18n translation entry | overrideSaveFailed: "Une erreur s'est produite", |
| src/i18n/fr.ts | 282 | overrideDeleteConfirm | i18n translation entry | overrideDeleteConfirm: "Cette action supprime dÃ©finitivement l'exception sÃ©lectionnÃ©e.", |
| src/i18n/fr.ts | 422 | notAvailable | i18n translation entry | notAvailable: "Indisponible", |
| src/i18n/fr.ts | 424 | exceptions | i18n translation entry | doctorsPageManageDesc: "GÃ©rez les calendriers, disponibilitÃ©s et exceptions des mÃ©decins depuis ici.", |
| src/i18n/ru.ts | 102 | unavailable | i18n translation entry | unavailable: "ĞĞµĞ´Ğ¾ÑÑ‚ÑƒĞ¿Ğ½Ğ¾", |
| src/i18n/ru.ts | 141 | addException | i18n translation entry | addException: "Ğ”Ğ¾Ğ±Ğ°Ğ²Ğ¸Ñ‚ÑŒ Ğ¸ÑĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ğµ", |
| src/i18n/ru.ts | 147 | exceptions | i18n translation entry | exceptions: "Ğ˜ÑĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ñ", |
| src/i18n/ru.ts | 152 | overrideEditTitle | i18n translation entry | overrideEditTitle: "Ğ˜Ğ·Ğ¼ĞµĞ½Ğ¸Ñ‚ÑŒ Ğ¸ÑĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ğµ", |
| src/i18n/ru.ts | 153 | overrideCreateTitle | i18n translation entry | overrideCreateTitle: "Ğ”Ğ¾Ğ±Ğ°Ğ²Ğ¸Ñ‚ÑŒ Ğ¸ÑĞºĞ»ÑÑ‡ĞµĞ½Ğ¸Ğµ", |
| src/i18n/ru.ts | 208 | notAvailable | i18n translation entry | notAvailable: "ĞĞµĞ´Ğ¾ÑÑ‚ÑƒĞ¿Ğ½Ğ¾", |
| src/i18n/tr.ts | 169 | unavailable | i18n translation entry | unavailable: "MÃ¼sait DeÄŸil", |
| src/i18n/tr.ts | 232 | istisna | i18n translation entry | calendarOverviewDesc: "MÃ¼sait saatler, randevular ve gÃ¼nlÃ¼k istisnalar tek gÃ¶rÃ¼nÃ¼mde.", |
| src/i18n/tr.ts | 234 | addException | i18n translation entry | addException: "Ä°stisna Ekle", |
| src/i18n/tr.ts | 244 | overrideRemoved | i18n translation entry | overrideRemoved: "Ä°stisna silindi", |
| src/i18n/tr.ts | 245 | overrideRemoveFailed | i18n translation entry | overrideRemoveFailed: "Ä°stisna silinemedi", |
| src/i18n/tr.ts | 256 | exceptions | i18n translation entry | exceptions: "Ä°stisnalar", |
| src/i18n/tr.ts | 257 | exceptions | i18n translation entry | exceptionsDesc: "Son 30 gÃ¼n ve gelecek iÃ§in planlanan Ã¶zel kapanÄ±ÅŸ veya mesai istisnalarÄ±.", |
| src/i18n/tr.ts | 257 | istisna | i18n translation entry | exceptionsDesc: "Son 30 gÃ¼n ve gelecek iÃ§in planlanan Ã¶zel kapanÄ±ÅŸ veya mesai istisnalarÄ±.", |
| src/i18n/tr.ts | 258 | istisna | i18n translation entry | noExceptionsDefined: "TanÄ±mlÄ± istisna bulunmuyor.", |
| src/i18n/tr.ts | 258 | noExceptionsDefined | i18n translation entry | noExceptionsDefined: "TanÄ±mlÄ± istisna bulunmuyor.", |
| src/i18n/tr.ts | 263 | deleteOverrideTitle | i18n translation entry | deleteOverrideTitle: "Ä°stisna silinsin mi?", |
| src/i18n/tr.ts | 264 | deleteOverrideDesc | i18n translation entry | deleteOverrideDesc: "Bu istisna kaldÄ±rÄ±lacak.", |
| src/i18n/tr.ts | 264 | istisna | i18n translation entry | deleteOverrideDesc: "Bu istisna kaldÄ±rÄ±lacak.", |
| src/i18n/tr.ts | 265 | deleteOverrideDateDesc | i18n translation entry | deleteOverrideDateDesc: "{{date}} tarihli istisna kaldÄ±rÄ±lacak.", |
| src/i18n/tr.ts | 265 | istisna | i18n translation entry | deleteOverrideDateDesc: "{{date}} tarihli istisna kaldÄ±rÄ±lacak.", |
| src/i18n/tr.ts | 280 | overrideEditTitle | i18n translation entry | overrideEditTitle: "Ä°stisnayÄ± DÃ¼zenle", |
| src/i18n/tr.ts | 281 | overrideCreateTitle | i18n translation entry | overrideCreateTitle: "Ä°stisna Ekle", |
| src/i18n/tr.ts | 282 | overrideModalDesc | i18n translation entry | overrideModalDesc: "Belirli bir gÃ¼nÃ¼ kapatÄ±n veya o gÃ¼n iÃ§in Ã¶zel Ã§alÄ±ÅŸma saati tanÄ±mlayÄ±n.", |
| src/i18n/tr.ts | 283 | overrideType | i18n translation entry | overrideType: "TÃ¼r", |
| src/i18n/tr.ts | 284 | Blackout | i18n translation entry | closeThisDay: "Bu gÃ¼nÃ¼ kapat (Blackout)", |
| src/i18n/tr.ts | 284 | closeThisDay | i18n translation entry | closeThisDay: "Bu gÃ¼nÃ¼ kapat (Blackout)", |
| src/i18n/tr.ts | 285 | defineCustomHours | i18n translation entry | defineCustomHours: "Ã–zel saat belirle (Custom hours)", |
| src/i18n/tr.ts | 287 | overrideUpdated | i18n translation entry | overrideUpdated: "Ä°stisna gÃ¼ncellendi", |
| src/i18n/tr.ts | 288 | overrideCreated | i18n translation entry | overrideCreated: "Ä°stisna eklendi", |
| src/i18n/tr.ts | 289 | overrideSaveFailed | i18n translation entry | overrideSaveFailed: "Hata oluÅŸtu", |
| src/i18n/tr.ts | 290 | istisna | i18n translation entry | overrideDeleteConfirm: "Bu iÅŸlem seÃ§ili istisnayÄ± kalÄ±cÄ± olarak kaldÄ±rÄ±r.", |
| src/i18n/tr.ts | 290 | overrideDeleteConfirm | i18n translation entry | overrideDeleteConfirm: "Bu iÅŸlem seÃ§ili istisnayÄ± kalÄ±cÄ± olarak kaldÄ±rÄ±r.", |
| src/i18n/tr.ts | 438 | notAvailable | i18n translation entry | notAvailable: "MÃ¼sait DeÄŸil", |
| src/i18n/tr.ts | 440 | istisna | i18n translation entry | doctorsPageManageDesc: "Doktor takvimlerini, mÃ¼saitlik slotlarÄ±nÄ± ve istisnalarÄ± buradan yÃ¶netin.", |
| src/pages/admin/ManageDoctors.tsx | 80 | Override | code reference | function getDoctorAvatarUrl(doc: any, avatarOverrides: Record<string, string>) { |
| src/pages/admin/ManageDoctors.tsx | 83 | Override | code reference | avatarOverrides[userId] ?? |
| src/pages/admin/ManageDoctors.tsx | 100 | Override | code reference | const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({}); |
| src/pages/admin/ManageDoctors.tsx | 100 | Override | code reference | const [avatarOverrides, setAvatarOverrides] = useState<Record<string, string>>({}); |
| src/pages/admin/ManageDoctors.tsx | 214 | Override | code reference | setAvatarOverrides((current) => ({ ...current, [userId]: avatarUrl })); |
| src/pages/admin/ManageDoctors.tsx | 407 | Override | code reference | const avatarUrl = getDoctorAvatarUrl(doc, avatarOverrides); |
| src/pages/DoctorProfile.tsx | 168 | unavailable | UI copy | {daySlots && daySlots.length > 0 ? <span className="text-muted-foreground" style={{ color: "#65a98f", fontSize: "0.85rem" }}>{daySlots.map((s) => \`${s.start_time.slice(0, 5)} - ${s.end_time.slice(0, 5)}\`).join(", ")}</span> : <span className="text-muted-foreground/50 text-xs" style={{ color: "#b5d1cc", fontSize: "0.75rem" }}>{t.unavailable}</span>} |
| src/pages/staff/StaffDashboard.tsx | 285 | notAvailable | code reference | {doctor.isAvailableToday ? t.available : t.notAvailable} |
| src/services/api.ts | 444 | Override | type/interface definition | availabilityOverrides: { |
| src/services/api.ts | 452 | custom_hours | API/domain type literal | type: "blackout" \\| "custom_hours"; |
| src/types/calendar.ts | 12 | Override | type/interface definition | export interface AvailabilityOverride { |
| src/types/calendar.ts | 16 | custom_hours | API/domain type literal | type: "blackout" \\| "custom_hours"; |
| src/types/calendar.ts | 65 | custom_hours | API/domain type literal | type: "availability" \\| "appointment" \\| "blackout" \\| "custom_hours"; |
| src/types/calendar.ts | 66 | Override | type/interface definition | resource?: Appointment \\| AvailabilitySlot \\| AvailabilityOverride; |
| src/utils/calendarUtils.ts | 12 | Override | type/interface definition | AvailabilityOverride, |
| src/utils/calendarUtils.ts | 73 | Override | type/interface definition | overrides: AvailabilityOverride[], |

