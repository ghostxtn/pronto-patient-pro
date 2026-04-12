const BASE_URL = "http://localhost/api";
const LOGIN_EMAIL = "owner@testklinik.local";
const LOGIN_PASSWORD = "Password123!";
const TOTAL_DOCTORS = 100;
const TOTAL_STAFF = 50;
const TENANT_HOST = "test-klinik.localhost";

function createHeaders(accessToken) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Host: TENANT_HOST,
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function parseResponse(response) {
  const raw = await response.text();

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  const payload = await parseResponse(response);

  if (!response.ok) {
    const error = new Error(`HTTP ${response.status} ${response.statusText}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

async function login() {
  const payload = await request("/auth/login", {
    method: "POST",
    headers: createHeaders(),
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
  });

  if (!payload || typeof payload !== "object" || typeof payload.accessToken !== "string") {
    throw new Error(`Login succeeded but accessToken was missing. Response: ${JSON.stringify(payload)}`);
  }

  return payload.accessToken;
}

async function getFirstSpecializationId(accessToken) {
  const payload = await request("/specializations", {
    method: "GET",
    headers: createHeaders(accessToken),
  });

  if (!Array.isArray(payload)) {
    throw new Error(`Expected /specializations to return an array. Response: ${JSON.stringify(payload)}`);
  }

  const first = payload.find((item) => item && typeof item.id === "string");

  if (!first) {
    throw new Error("No specialization found. Create at least one specialization before seeding doctors.");
  }

  return first.id;
}

function logError(label, index, error) {
  console.error(`${label} ${index} failed: ${error.message}`);

  if ("payload" in error && error.payload !== undefined) {
    console.error(error.payload);
  }
}

async function createDoctors(accessToken, specializationId, counters) {
  for (let i = 1; i <= TOTAL_DOCTORS; i += 1) {
    const body = {
      email: `loadtest.doctor${i}@testklinik.local`,
      password: LOGIN_PASSWORD,
      firstName: `Doktor${i}`,
      lastName: "Test",
      role: "doctor",
      doctorProfile: {
        specializationId,
      },
    };

    try {
      await request("/users/staff", {
        method: "POST",
        headers: createHeaders(accessToken),
        body: JSON.stringify(body),
      });
      counters.doctorOk += 1;
    } catch (error) {
      counters.doctorErr += 1;
      logError("Doctor", i, error);
    }

    if (i % 10 === 0) {
      console.log(`Doctors: ${i}/${TOTAL_DOCTORS}...`);
    }
  }
}

async function createStaff(accessToken, counters) {
  for (let i = 1; i <= TOTAL_STAFF; i += 1) {
    const body = {
      email: `loadtest.staff${i}@testklinik.local`,
      password: LOGIN_PASSWORD,
      firstName: `Staff${i}`,
      lastName: "Test",
      role: "staff",
    };

    try {
      await request("/users/staff", {
        method: "POST",
        headers: createHeaders(accessToken),
        body: JSON.stringify(body),
      });
      counters.staffOk += 1;
    } catch (error) {
      counters.staffErr += 1;
      logError("Staff", i, error);
    }

    if (i % 10 === 0) {
      console.log(`Staff: ${i}/${TOTAL_STAFF}...`);
    }
  }
}

async function main() {
  const counters = {
    doctorOk: 0,
    doctorErr: 0,
    staffOk: 0,
    staffErr: 0,
  };

  console.log("Logging in...");
  const accessToken = await login();

  console.log("Fetching specialization for doctor creation...");
  const specializationId = await getFirstSpecializationId(accessToken);

  console.log(`Using specialization: ${specializationId}`);

  await createDoctors(accessToken, specializationId, counters);
  await createStaff(accessToken, counters);

  let patientOk = 0;
  let patientErr = 0;
  for (let i = 1; i <= 100; i += 1) {
    try {
      const res = await fetch("http://localhost/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Host: "test-klinik.localhost",
        },
        body: JSON.stringify({
          email: `loadtest.patient${i}@testklinik.local`,
          password: "Password123!",
          firstName: `Hasta${i}`,
          lastName: "Test",
          kvkkConsent: true,
        }),
      });
      if (res.ok || res.status === 201) {
        patientOk += 1;
      } else {
        const body = await res.text();
        console.error(`Patient ${i} failed: ${res.status} ${body}`);
        patientErr += 1;
      }
    } catch (e) {
      console.error(`Patient ${i} error: ${e.message}`);
      patientErr += 1;
    }
    if (i % 10 === 0) {
      console.log(`Patients: ${i}/100...`);
    }
  }

  console.log(`Done. Doctors: ${counters.doctorOk}/100, Staff: ${counters.staffOk}/50, Patients: ${patientOk}/100, Errors: ${counters.doctorErr + counters.staffErr + patientErr}`);
}

main().catch((error) => {
  console.error("Seed load test failed before completion.");
  console.error(error);
  process.exitCode = 1;
});
