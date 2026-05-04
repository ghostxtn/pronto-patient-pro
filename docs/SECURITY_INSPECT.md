# Backend Security Inspection Report

Inspection date: 2026-05-04  
Scope: `backend/src/**/*.controller.ts`, selected auth and appointment service files.  
Note: No source files were modified during this inspection.

## 1. Decorator Audit — `@Public` / `@Roles` Eksikleri (MEDIUM #5)

### Global guard context

Status: ✅ FIXED

`backend/src/app.module.ts`

```ts
69	    { provide: APP_GUARD, useClass: ThrottlerGuard },
70	    { provide: APP_GUARD, useClass: JwtAuthGuard },
71	    { provide: APP_GUARD, useClass: RolesGuard },
72	    { provide: APP_GUARD, useClass: TenantGuard },
```

Because `JwtAuthGuard`, `RolesGuard`, and `TenantGuard` are global, endpoints without `@Public()` are authenticated by default. `@Roles()` still matters for authorization.

### Endpoints with no effective `@Roles()` and no effective `@Public()`

Status: ✅ FIXED

No endpoint was found with neither a method-level nor class-level `@Roles()` / `@Public()` decorator, after accounting for class-level decorators.

Class-level cases verified:

`backend/src/staff/staff.controller.ts`

```ts
20	@Controller('users')
21	@Roles('owner')
22	export class StaffController {
```

All methods in `StaffController` inherit `@Roles('owner')`.

`backend/src/health/health.controller.ts`

```ts
5	@Public()
6	@SkipThrottle()
7	@Controller('health')
8	export class HealthController {
```

Both health endpoints inherit `@Public()` and `@SkipThrottle()`.

### Purpose-based endpoints to review

#### `backend/src/specializations/specializations.controller.ts`

Status: ⚠️ PARTIAL

Public read endpoints are explicitly public:

```ts
47	  @Public()
48	  @Get('public-discovery')
```

```ts
59	  @Public()
60	  @Get()
```

```ts
71	  @Public()
72	  @Get(':id')
```

Mutation endpoints are role-protected:

```ts
38	  @Post()
39	  @Roles('owner', 'admin')
```

```ts
86	  @Patch(':id')
87	  @Roles('owner', 'admin')
```

```ts
96	  @Patch(':id/image')
97	  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
98	  @Roles('owner', 'admin')
```

```ts
141	  @Delete(':id')
142	  @Roles('owner', 'admin')
```

Finding: decorators are present. Review whether `GET /specializations/:id` should be public, because the service returns the full row for active or inactive records if the ID is known:

`backend/src/specializations/specializations.service.ts`

```ts
72	  async findById(id: string, clinicId: string) {
73	    const [specialization] = await this.db
74	      .select()
75	      .from(specializations)
76	      .where(eq(specializations.id, id))
```

No `is_active=true` condition is applied in `findById`.

#### `backend/src/profiles/profiles.controller.ts`

Status: ✅ FIXED

All endpoints have explicit role decorators:

```ts
13	  @Get('me')
14	  @Audit('VIEW_PROFILE', 'user')
15	  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
```

```ts
20	  @Patch('me')
21	  @Audit('UPDATE_PROFILE', 'user')
22	  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
```

```ts
30	  @Get()
31	  @Audit('LIST_USERS', 'user')
32	  @Roles('owner', 'admin')
```

```ts
37	  @Patch(':id/role')
38	  @Audit('UPDATE_ROLE', 'user')
39	  @Roles('owner')
```

#### `backend/src/auth/auth.controller.ts` — `auth/me`

Status: ✅ FIXED

`GET /auth/me` has both explicit JWT guard and explicit roles:

```ts
215	  @Get('me')
216	  @UseGuards(JwtAuthGuard)
217	  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
218	  me(@CurrentUser() user: { userId: string; email: string; role: string; clinicId: string }) {
```

#### `POST /auth/logout`

Status: ⚠️ PARTIAL

Logout is public:

```ts
207	  @Public()
208	  @Post('logout')
209	  @HttpCode(200)
210	  logout(@Res({ passthrough: true }) res: Response) {
211	    res.clearCookie('refreshToken', { path: '/' });
```

Action needed: review whether logout should require authentication and call `authService.logout(userId)` to delete Redis refresh token. Current public endpoint only clears the browser cookie.

## 2. ParseUUIDPipe Audit (MEDIUM #7)

### Summary

Status: ⚠️ PARTIAL

Many UUID route params correctly use `ParseUUIDPipe`, but several controllers still accept UUID-looking route params as raw strings.

### Route parameter table

| Endpoint | File | Route param line | Status |
| --- | --- | --- | --- |
| `GET /appointments/:id` | `backend/src/appointments/appointments.controller.ts` | `64	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /appointments/:id` | `backend/src/appointments/appointments.controller.ts` | `79	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /appointments/:id/status` | `backend/src/appointments/appointments.controller.ts` | `90	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `DELETE /appointments/:id` | `backend/src/appointments/appointments.controller.ts` | `104	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `POST /appointments/:appointmentId/notes` | `backend/src/appointments/appointments.controller.ts` | `117	    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,` | ✅ FIXED |
| `GET /appointments/:appointmentId/notes` | `backend/src/appointments/appointments.controller.ts` | `133	    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,` | ✅ FIXED |
| `PATCH /appointments/notes/:noteId` | `backend/src/appointments/appointments.controller.ts` | `150	    @Param('noteId', ParseUUIDPipe) noteId: string,` | ✅ FIXED |
| `DELETE /appointments/notes/:noteId` | `backend/src/appointments/appointments.controller.ts` | `166	    @Param('noteId', ParseUUIDPipe) noteId: string,` | ✅ FIXED |
| `GET /availability/:doctorId` | `backend/src/availability/availability.controller.ts` | `59	    @Param('doctorId', ParseUUIDPipe) doctorId: string,` | ✅ FIXED |
| `PATCH /availability/:id` | `backend/src/availability/availability.controller.ts` | `68	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `DELETE /availability/:id` | `backend/src/availability/availability.controller.ts` | `79	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /availability-overrides/:id` | `backend/src/availability-overrides/availability-overrides.controller.ts` | `81	    @Param('id') id: string,` | ❌ MISSING |
| `DELETE /availability-overrides/:id` | `backend/src/availability-overrides/availability-overrides.controller.ts` | `95	    @Param('id') id: string,` | ❌ MISSING |
| `GET /clinics/:id` | `backend/src/clinics/clinics.controller.ts` | `62	  findById(@Param('id') id: string) {` | ❌ MISSING |
| `PATCH /clinics/:id` | `backend/src/clinics/clinics.controller.ts` | `69	  update(@Param('id') id: string, @Body() dto: UpdateClinicDto) {` | ❌ MISSING |
| `PATCH /clinics/:id/logo` | `backend/src/clinics/clinics.controller.ts` | `83	    @Param('id') id: string,` | ❌ MISSING |
| `DELETE /clinics/:id` | `backend/src/clinics/clinics.controller.ts` | `124	  softDelete(@Param('id') id: string) {` | ❌ MISSING |
| `GET /doctors/:id` | `backend/src/doctors/doctors.controller.ts` | `75	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /doctors/:id` | `backend/src/doctors/doctors.controller.ts` | `87	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /doctors/:id/admin` | `backend/src/doctors/doctors.controller.ts` | `97	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /doctors/:id/status` | `backend/src/doctors/doctors.controller.ts` | `108	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `DELETE /doctors/:id` | `backend/src/doctors/doctors.controller.ts` | `119	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /clinical-notes/:id` | `backend/src/patient-clinical-notes/patient-clinical-notes.controller.ts` | `57	    @Param('id') id: string,` | ❌ MISSING |
| `DELETE /clinical-notes/:id` | `backend/src/patient-clinical-notes/patient-clinical-notes.controller.ts` | `68	    @Param('id') id: string,` | ❌ MISSING |
| `GET /patients/:id` | `backend/src/patients/patients.controller.ts` | `43	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /patients/:id` | `backend/src/patients/patients.controller.ts` | `53	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `DELETE /patients/:id` | `backend/src/patients/patients.controller.ts` | `64	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /profiles/:id/role` | `backend/src/profiles/profiles.controller.ts` | `41	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `GET /specializations/:id` | `backend/src/specializations/specializations.controller.ts` | `74	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /specializations/:id` | `backend/src/specializations/specializations.controller.ts` | `89	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /specializations/:id/image` | `backend/src/specializations/specializations.controller.ts` | `105	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `DELETE /specializations/:id` | `backend/src/specializations/specializations.controller.ts` | `144	    @Param('id', ParseUUIDPipe) id: string,` | ✅ FIXED |
| `PATCH /users/:id` | `backend/src/staff/staff.controller.ts` | `56	    @Param('id') id: string,` | ❌ MISSING |
| `PATCH /users/:id/status` | `backend/src/staff/staff.controller.ts` | `66	    @Param('id') id: string,` | ❌ MISSING |
| `DELETE /users/:id` | `backend/src/staff/staff.controller.ts` | `75	  remove(@Param('id') id: string, @CurrentUser() user: { clinicId: string }) {` | ❌ MISSING |
| `POST /storage/avatar/:userId` | `backend/src/storage/storage.controller.ts` | `63	    @Param('userId', ParseUUIDPipe) userId: string,` | ✅ FIXED |
| `POST /storage/appointments/:appointmentId/files` | `backend/src/storage/storage.controller.ts` | `90	    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,` | ✅ FIXED |
| `GET /storage/appointments/:appointmentId/files` | `backend/src/storage/storage.controller.ts` | `110	    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,` | ✅ FIXED |
| `GET /storage/files/:fileId/download` | `backend/src/storage/storage.controller.ts` | `124	    @Param('fileId', ParseUUIDPipe) fileId: string,` | ✅ FIXED |
| `DELETE /storage/files/:fileId` | `backend/src/storage/storage.controller.ts` | `141	    @Param('fileId', ParseUUIDPipe) fileId: string,` | ✅ FIXED |

## 3. Double Booking Check (MEDIUM #6)

Status: ✅ FIXED

### Patient double-booking across different doctors

Yes. `create()` resolves the patient ID and then checks for any non-cancelled appointment for that patient, in the same clinic and date, whose time range overlaps the requested time. This is not scoped to doctor ID, so it prevents a patient from booking overlapping appointments with different doctors.

`backend/src/appointments/appointments.service.ts`

```ts
116	    const [conflictingPatientAppointment] = await this.db
117	      .select({ id: appointments.id })
118	      .from(appointments)
119	      .where(
120	        and(
121	          eq(appointments.patient_id, patientId),
122	          eq(appointments.clinic_id, clinicId),
123	          eq(appointments.appointment_date, dto.appointmentDate),
124	          ne(appointments.status, 'cancelled'),
125	          lt(appointments.start_time, dto.endTime),
126	          gt(appointments.end_time, dto.startTime),
127	        ),
128	      )
129	      .limit(1);
130	
131	    if (conflictingPatientAppointment) {
132	      throw new ConflictException(
133	        'Patient already has an appointment during this time slot',
134	      );
135	    }
```

### Doctor double-booking

Yes. `create()` calls `assertNoAppointmentOverlap()` before inserting the appointment:

```ts
108	    await this.assertNoAppointmentOverlap(
109	      clinicId,
110	      dto.doctorId,
111	      dto.appointmentDate,
112	      dto.startTime,
113	      dto.endTime,
114	    );
```

The overlap function is scoped to `clinic_id`, `doctor_id`, appointment date, and non-cancelled appointments:

```ts
728	    const conditions = [
729	      eq(appointments.clinic_id, clinicId),
730	      eq(appointments.doctor_id, doctorId),
731	      eq(appointments.appointment_date, appointmentDate),
732	      ne(appointments.status, 'cancelled'),
733	    ];
```

It then checks blocking statuses and overlapping time ranges:

```ts
752	    const hasOverlap = existingAppointments.some((appointment: {
753	      start_time: string;
754	      end_time: string;
755	      status: string;
756	    }) =>
757	      isBlockingAppointmentStatus(appointment.status) &&
758	      rangesOverlap(
759	        requestedRange,
760	        {
761	          start: timeToMinutes(appointment.start_time),
762	          end: timeToMinutes(appointment.end_time),
763	        },
764	      ),
765	    );
766	
767	    if (hasOverlap) {
768	      throw new ForbiddenException('Doctor already has an appointment in this time range');
769	    }
```

### Update path

Status: ⚠️ PARTIAL

Doctor overlap is checked on schedule changes:

```ts
311	    if (scheduleChanged) {
312	      this.validateAppointmentRange(nextAppointmentDate, nextStartTime, nextEndTime);
313	      await this.assertRequestedRangeIsBookable(
...
321	      await this.assertNoAppointmentOverlap(
322	        clinicId,
323	        currentAppointment.doctor_id,
324	        nextAppointmentDate,
325	        nextStartTime,
326	        nextEndTime,
327	        id,
328	      );
```

Finding: the update path does not repeat the patient overlap query shown in `create()`. If appointment update can move an appointment into a patient’s existing appointment slot, patient double-booking may still be possible through admin/staff update flows.

## 4. PII in Logs (MEDIUM #8)

Status: ⚠️ PARTIAL

### Console / Logger calls in `auth.service.ts`

Most Google auth logger calls mask email and Google ID or log internal UUIDs only.

`backend/src/auth/auth.service.ts`

```ts
536	    this.logger.log(
537	      `[auth][googleLogin] start ${JSON.stringify({
538	        clinicId,
539	        email: this.maskEmail(googleUser.email),
540	        googleId: this.maskGoogleId(googleUser.googleId),
541	      })}`,
542	    );
```

```ts
600	    if (emailUser) {
601	      this.logger.log(
602	        `[auth][googleLogin] found existing user by email ${JSON.stringify({
603	          ...this.summarizeUser(emailUser),
604	          hasPassword: Boolean(emailUser.password_hash),
605	          email: this.maskEmail(emailUser.email),
606	        })}`,
607	      );
```

Other logger calls expose IDs but not direct email/name/phone/TC:

```ts
671	    this.logger.log(
672	      `[auth][googleLogin] created new google user ${JSON.stringify(
673	        this.summarizeUser(newUser),
674	      )}`,
675	    );
```

```ts
1190	    this.logger.log(
1191	      `[auth][googleLogin] ensurePatientProfile start ${JSON.stringify(
1192	        this.summarizeUser(user),
1193	      )}`,
1194	    );
```

```ts
1226	      this.logger.log(
1227	        `[auth][googleLogin] patient profile created ${JSON.stringify({
1228	          patientId: patient.id,
1229	          userId: user.id,
1230	          clinicId,
1231	        })}`,
1232	      );
```

### Logger calls in `google.strategy.ts`

Emails and Google IDs are masked before logging:

`backend/src/auth/strategies/google.strategy.ts`

```ts
52	    this.logger.log(
53	      `[auth][googleStrategy] validate start ${JSON.stringify({
54	        clinicId: req.tenant?.clinicId,
55	        googleId: this.maskGoogleId(profile.id),
56	        email: this.maskEmail(profile.emails?.[0]?.value ?? ''),
57	      })}`,
58	    );
```

```ts
89	      this.logger.log(
90	        `[auth][googleStrategy] validate success ${JSON.stringify({
91	          clinicId,
92	          email: this.maskEmail(email),
93	          googleId: this.maskGoogleId(googleId),
94	          requiresOtp: 'requiresOtp' in result ? result.requiresOtp : false,
95	        })}`,
96	      );
```

```ts
99	      this.logger.error(
100	        `[auth][googleStrategy] validate failed ${JSON.stringify({
101	          clinicId,
102	          email: this.maskEmail(email),
103	          googleId: this.maskGoogleId(googleId),
104	          errorName: error instanceof Error ? error.name : 'UnknownError',
105	        })}`,
106	      );
```

### Audit log metadata contains raw email addresses

Status: ⚠️ PARTIAL

Although not `console.*` or Nest `Logger`, `auth.service.ts` writes raw email addresses into audit metadata:

```ts
151	        metadata: { email: dto.email, reason: 'account_locked' },
```

```ts
182	        metadata: { email: dto.email, reason: 'invalid_password' },
```

```ts
313	      metadata: { email: flow.email, purpose: flow.purpose },
```

```ts
338	        metadata: { email: dto.email, userExists: false },
```

```ts
372	      metadata: { email: user.email },
```

```ts
712	      metadata: { email: payload.email, purpose: payload.purpose },
```

Action needed: decide whether audit metadata may contain raw email under the data handling policy. If not, store masked email or a keyed hash.

## 5. Rate Limiting Gaps (MEDIUM #9)

### Global throttling

Status: ⚠️ PARTIAL

Global throttling is enabled at 300 requests/minute:

`backend/src/app.module.ts`

```ts
43	    ThrottlerModule.forRoot([
44	      { name: 'global', ttl: 60000, limit: 300 },
45	    ]),
```

### `backend/src/availability/availability.controller.ts`

Status: ⚠️ PARTIAL

No `@SkipThrottle()` is present. Only public slot lookup has endpoint-specific throttling:

```ts
34	  @Public()
35	  @UseGuards(TenantGuard)
36	  @Throttle({ default: { limit: 30, ttl: 60000 } })
37	  @Get('slots')
```

Endpoints missing endpoint-specific `@Throttle()` and relying only on global throttling:

```ts
46	  @Post()
47	  @Roles('owner', 'admin', 'doctor', 'staff')
```

```ts
56	  @Get(':doctorId')
57	  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
```

```ts
65	  @Patch(':id')
66	  @Roles('owner', 'admin', 'doctor', 'staff')
```

```ts
76	  @Delete(':id')
77	  @Roles('owner', 'admin', 'doctor', 'staff')
```

### `backend/src/storage/storage.controller.ts`

Status: ⚠️ PARTIAL

No `@SkipThrottle()` is present. Upload and download/list endpoints mostly have endpoint-specific throttling:

```ts
40	  @Post('avatar')
41	  @Audit('UPLOAD_AVATAR', 'file')
42	  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
43	  @Throttle({ default: { limit: 10, ttl: 60000 } })
```

```ts
56	  @Post('avatar/:userId')
57	  @Audit('UPLOAD_AVATAR', 'file')
58	  @UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
59	  @Roles('owner', 'admin')
60	  @Throttle({ default: { limit: 10, ttl: 60000 } })
```

```ts
84	  @Post('appointments/:appointmentId/files')
85	  @Audit('UPLOAD_FILE', 'file')
86	  @Roles('owner', 'admin', 'doctor')
87	  @Throttle({ default: { limit: 10, ttl: 60000 } })
```

```ts
106	  @Get('appointments/:appointmentId/files')
107	  @Roles('owner', 'admin', 'doctor')
108	  @Throttle({ default: { limit: 30, ttl: 60000 } })
```

```ts
119	  @Get('files/:fileId/download')
120	  @Audit('DOWNLOAD_FILE', 'file')
121	  @Roles('owner', 'doctor', 'staff')
122	  @Throttle({ default: { limit: 30, ttl: 60000 } })
```

Endpoint missing endpoint-specific `@Throttle()` and relying only on global throttling:

```ts
137	  @Delete('files/:fileId')
138	  @Audit('DELETE_FILE', 'file')
139	  @Roles('owner', 'admin', 'doctor')
```

## 6. KVKK Consent IP Fix

Status: ❌ MISSING

Registration receives client IP from the controller:

`backend/src/auth/auth.controller.ts`

```ts
51	    const result = await this.authService.register(dto, req.tenant!.clinicId, {
52	      ipAddress:
53	        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
54	        req.headers['x-real-ip']?.toString() ||
55	        req.ip,
```

However, the registration flow only stores the consent flag in the OTP payload:

`backend/src/auth/auth.service.ts`

```ts
114	    return this.createOtpChallenge(
115	      {
116	        purpose: 'register',
117	        clinicId,
118	        email: dto.email,
119	        passwordHash,
120	        firstName: dto.firstName,
121	        lastName: dto.lastName,
122	        kvkkConsent: dto.kvkkConsent,
123	      },
124	      ctx,
125	    );
```

When the user row is inserted, `kvkk_consent_ip` is explicitly set to `null`:

```ts
747	    const [user] = await this.db
748	      .insert(users)
749	      .values({
750	        email: flow.email,
751	        password_hash: flow.passwordHash!,
752	        first_name: flow.firstName!,
753	        last_name: flow.lastName!,
754	        clinic_id: flow.clinicId,
755	        role: 'patient',
756	        kvkk_consent_at: flow.kvkkConsent ? new Date() : null,
757	        kvkk_consent_version: flow.kvkkConsent ? '1.0' : null,
758	        kvkk_consent_ip: null,
759	      })
760	      .returning();
```

Action needed: carry `ctx.ipAddress` into the registration OTP payload or store it at completion time.

## 7. Google OAuth KVKK Fix

Status: ❌ MISSING

### Google strategy passes IP context

`backend/src/auth/strategies/google.strategy.ts`

```ts
73	      const result = await this.authService.googleLogin({
74	        googleId,
75	        email,
76	        firstName,
77	        lastName,
78	        avatar,
79	      }, clinicId, {
80	        ipAddress:
81	          req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
82	          req.headers['x-real-ip']?.toString() ||
83	          req.ip,
```

### New Google user creation does not set KVKK consent fields

`backend/src/auth/auth.service.ts`

```ts
657	    const [newUser] = await this.db
658	      .insert(users)
659	      .values({
660	        email: googleUser.email,
661	        password_hash: null,
662	        first_name: googleUser.firstName,
663	        last_name: googleUser.lastName,
664	        clinic_id: clinicId,
665	        role: 'patient',
666	        google_id: googleUser.googleId,
667	        avatar_url: googleUser.avatar,
668	      })
669	      .returning();
```

There is no `kvkk_consent_at`, `kvkk_consent_version`, or `kvkk_consent_ip` in the new Google user insert.

The subsequent OTP challenge also does not include a KVKK consent flag:

```ts
678	    return this.createOtpChallenge(
679	      {
680	        purpose: 'google',
681	        clinicId,
682	        email: newUser.email,
683	        userId: newUser.id,
684	      },
685	      ctx,
686	    );
```

Action needed: add an explicit consent step for new Google registrations, or require/record consent before creating/activating the user.

## Summary Table

| Issue | Status | File | Action needed |
| --- | --- | --- | --- |
| MEDIUM #5 decorator audit | ✅ FIXED | `backend/src/**/*.controller.ts` | No effective missing `@Roles`/`@Public` found. Review public specialization detail and public logout semantics. |
| Public specialization detail may expose inactive/full row by known UUID | ⚠️ PARTIAL | `backend/src/specializations/specializations.controller.ts`, `backend/src/specializations/specializations.service.ts` | Consider making `GET /specializations/:id` authenticated or filtering `is_active=true` for public reads. |
| Public logout does not revoke Redis refresh token | ⚠️ PARTIAL | `backend/src/auth/auth.controller.ts` | Consider authenticated logout that calls `authService.logout(userId)`. |
| MEDIUM #7 ParseUUIDPipe audit | ⚠️ PARTIAL | Several controllers | Add `ParseUUIDPipe` to raw UUID params in clinics, staff, clinical-notes, and availability-overrides controllers. |
| MEDIUM #6 patient double-booking on create | ✅ FIXED | `backend/src/appointments/appointments.service.ts` | No action for create path. |
| MEDIUM #6 doctor double-booking | ✅ FIXED | `backend/src/appointments/appointments.service.ts` | No action for create/update doctor overlap path. |
| Patient double-booking on appointment update | ⚠️ PARTIAL | `backend/src/appointments/appointments.service.ts` | Add patient overlap validation to schedule update path. |
| MEDIUM #8 console/Nest logger PII | ⚠️ PARTIAL | `backend/src/auth/auth.service.ts`, `backend/src/auth/strategies/google.strategy.ts` | Logger mostly masks email/Google ID; review whether UUID logging is acceptable. |
| Raw email in auth audit metadata | ⚠️ PARTIAL | `backend/src/auth/auth.service.ts` | Mask or hash email in audit metadata if policy requires minimizing PII in logs. |
| MEDIUM #9 availability rate limits | ⚠️ PARTIAL | `backend/src/availability/availability.controller.ts` | Add endpoint-specific throttles to create/read/update/delete availability endpoints if global 300/min is too broad. |
| MEDIUM #9 storage rate limits | ⚠️ PARTIAL | `backend/src/storage/storage.controller.ts` | Add endpoint-specific throttle to `DELETE /storage/files/:fileId`. |
| KVKK consent IP | ❌ MISSING | `backend/src/auth/auth.service.ts` | Store actual client IP instead of `kvkk_consent_ip: null`. |
| Google OAuth KVKK consent fields | ❌ MISSING | `backend/src/auth/auth.service.ts`, `backend/src/auth/strategies/google.strategy.ts` | Add explicit consent capture and persist `kvkk_consent_at`, `kvkk_consent_version`, `kvkk_consent_ip`. |
