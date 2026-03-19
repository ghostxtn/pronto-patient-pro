const API_BASE = import.meta.env.VITE_API_URL || "/api";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function debugAuthLog(message: string, details?: unknown) {
  console.debug(`[auth][api] ${message}`, details ?? "");
}

export function setTokens(access?: string | null, refresh?: string | null) {
  debugAuthLog("setTokens", {
    hasAccessToken: Boolean(access),
    hasRefreshToken: Boolean(refresh),
  });

  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function clearTokens() {
  debugAuthLog("clearTokens");
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function getClinicDomainHeader() {
  if (typeof window === "undefined") {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();

  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]") {
    return "test-klinik.localhost";
  }

  return hostname || null;
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    debugAuthLog("refreshAccessToken missing refresh token");
    throw new ApiError(401, "Missing refresh token");
  }

  debugAuthLog("refreshAccessToken start");

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  const body = await parseResponse(response);

  if (!response.ok || !body || typeof body !== "object") {
    debugAuthLog("refreshAccessToken failed", {
      status: response.status,
      body,
    });
    throw new ApiError(response.status, "Token refresh failed", body);
  }

  const accessToken =
    "accessToken" in body && typeof body.accessToken === "string"
      ? body.accessToken
      : null;
  const nextRefreshToken =
    "refreshToken" in body && typeof body.refreshToken === "string"
      ? body.refreshToken
      : refreshToken;

  if (!accessToken) {
    debugAuthLog("refreshAccessToken missing access token in response", body);
    throw new ApiError(response.status, "Missing access token in refresh response", body);
  }

  setTokens(accessToken, nextRefreshToken);
  debugAuthLog("refreshAccessToken success");
  return accessToken;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const accessToken = getAccessToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const clinicDomain = getClinicDomainHeader();

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (clinicDomain && !headers.has("X-Clinic-Domain")) {
    headers.set("X-Clinic-Domain", clinicDomain);
  }

  if (!isFormData && options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await parseResponse(response);

  if (response.status === 401 && retry && endpoint !== "/auth/refresh") {
    debugAuthLog("request received 401, attempting refresh", { endpoint });

    let nextAccessToken: string;

    try {
      nextAccessToken = await refreshAccessToken();
    } catch (error) {
      debugAuthLog("refresh failed, redirecting to /auth", {
        endpoint,
        error,
      });
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
      throw error;
    }

    const retryHeaders = new Headers(options.headers || {});

    retryHeaders.set("Authorization", `Bearer ${nextAccessToken}`);
    if (!isFormData && options.body && !retryHeaders.has("Content-Type")) {
      retryHeaders.set("Content-Type", "application/json");
    }

    const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: retryHeaders,
    });

    const retryBody = await parseResponse(retryResponse);

    if (retryResponse.status === 401) {
      debugAuthLog("retry after refresh still returned 401, redirecting to /auth", {
        endpoint,
        body: retryBody,
      });
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/auth";
      }
      throw new ApiError(
        retryResponse.status,
        (retryBody as { message?: string })?.message || "Request failed",
        retryBody,
      );
    }

    if (!retryResponse.ok) {
      debugAuthLog("retry after refresh failed without invalidating session", {
        endpoint,
        status: retryResponse.status,
        body: retryBody,
      });
      throw new ApiError(
        retryResponse.status,
        (retryBody as { message?: string })?.message || "Request failed",
        retryBody,
      );
    }

    debugAuthLog("retry after refresh succeeded", { endpoint });
    return retryBody as T;
  }

  if (!response.ok) {
    debugAuthLog("request failed", {
      endpoint,
      status: response.status,
      body,
    });
    throw new ApiError(
      response.status,
      (body as { message?: string })?.message || "Request failed",
      body,
    );
  }

  return body as T;
}

type AuthResponse = {
  accessToken?: string;
  refreshToken?: string;
  user?: unknown;
};

const api = {
  auth: {
    login: (email: string, pass: string) =>
      request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password: pass }),
      }),
    register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
      request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    googleLogin: (idToken: string) =>
      request<AuthResponse>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      }),
    logout: () =>
      request<{ message: string }>("/auth/logout", {
        method: "POST",
      }),
    me: () => request<any>("/auth/me"),
  },
  clinics: {
    list: () => request<any[]>("/clinics"),
    get: (id: string) => request<any>(`/clinics/${id}`),
    create: (data: unknown) =>
      request<any>("/clinics", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<any>(`/clinics/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  profiles: {
    me: () => request<any>("/profiles/me"),
    get: (id: string) => request<any>(`/profiles/${id}`),
    update: (id: string, data: unknown) =>
      request<any>(id === "me" ? "/profiles/me" : `/profiles/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },
  homepagePreview: {
    get: () =>
      request<{
        doctors: Array<{
          id: string;
          firstName?: string | null;
          lastName?: string | null;
          title?: string | null;
          bio?: string | null;
          specialization?: {
            id?: string | null;
            name?: string | null;
          } | null;
        }>;
        specialties: Array<{
          id: string;
          name: string;
          description?: string | null;
        }>;
      }>("/homepage-preview"),
  },
  specializations: {
    publicDiscovery: () =>
      request<
        Array<{
          id: string;
          name: string;
          description?: string | null;
        }>
      >("/specializations/public-discovery"),
    list: () => request<any[]>("/specializations"),
    get: (id: string) => request<any>(`/specializations/${id}`),
    create: (data: unknown) =>
      request<any>("/specializations", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<any>(`/specializations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/specializations/${id}`, {
        method: "DELETE",
      }),
  },
  doctors: {
    list: (params?: { specialization_id?: string; status?: "active" | "inactive" | "all" }) => {
      const search = new URLSearchParams();
      if (params?.specialization_id) {
        search.set("specialization_id", params.specialization_id);
      }
      if (params?.status) {
        search.set("status", params.status);
      }
      return request<any[]>(`/doctors${search.toString() ? `?${search.toString()}` : ""}`);
    },
    publicDiscovery: () =>
      request<
        Array<{
          id: string;
          firstName?: string | null;
          lastName?: string | null;
          title?: string | null;
          bio?: string | null;
          specialization?: {
            id?: string | null;
            name?: string | null;
          } | null;
        }>
      >("/doctors/public-discovery"),
    get: (id: string) => request<any>(`/doctors/${id}`),
    create: (data: unknown) =>
      request<any>("/doctors", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<any>(`/doctors/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/doctors/${id}`, {
        method: "DELETE",
      }),
  },
  availability: {
    listByDoctor: (doctorId: string) => request<any[]>(`/availability/${doctorId}`),
    create: (data: unknown) =>
      request<any>("/availability", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<any>(`/availability/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/availability/${id}`, {
        method: "DELETE",
      }),
  },
  patients: {
    list: (params?: { search?: string; page?: number; limit?: number }) => {
      const search = new URLSearchParams();
      if (params?.search) search.set("search", params.search);
      if (params?.page !== undefined) search.set("page", String(params.page));
      if (params?.limit !== undefined) search.set("limit", String(params.limit));
      return request<any[] | { data: any[]; total: number }>(
        `/patients${search.toString() ? `?${search.toString()}` : ""}`,
      );
    },
    get: (id: string) => request<any>(`/patients/${id}`),
    create: (data: unknown) =>
      request<any>("/patients", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<any>(`/patients/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<any>(`/patients/${id}`, {
        method: "DELETE",
      }),
  },
  staff: {
    list: (params?: { search?: string; status?: "active" | "inactive" | "all" }) => {
      const search = new URLSearchParams();
      search.set("role", "staff");
      if (params?.search) search.set("search", params.search);
      if (params?.status && params.status !== "all") search.set("status", params.status);
      return request<any[]>(`/users?${search.toString()}`);
    },
    create: (data: unknown) =>
      request<any>("/users/staff", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<any>(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    setStatus: (id: string, isActive: boolean) =>
      request<any>(`/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      }),
    delete: (id: string) =>
      request<any>(`/users/${id}`, {
        method: "DELETE",
      }),
  },
  appointments: {
    list: (params?: {
      doctor_id?: string;
      patient_id?: string;
      date_from?: string;
      date_to?: string;
      status?: string;
    }) => {
      const search = new URLSearchParams();
      if (params?.doctor_id) search.set("doctor_id", params.doctor_id);
      if (params?.patient_id) search.set("patient_id", params.patient_id);
      if (params?.date_from) search.set("date_from", params.date_from);
      if (params?.date_to) search.set("date_to", params.date_to);
      if (params?.status) search.set("status", params.status);
      return request<any[]>(
        `/appointments${search.toString() ? `?${search.toString()}` : ""}`,
      );
    },
    get: (id: string) => request<any>(`/appointments/${id}`),
    create: (data: unknown) =>
      request<any>("/appointments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: unknown) =>
      request<any>(`/appointments/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    updateStatus: (id: string, status: string) =>
      request<any>(`/appointments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    delete: (id: string) =>
      request<any>(`/appointments/${id}`, {
        method: "DELETE",
      }),
    notes: {
      list: (appointmentId: string) =>
        request<any[]>(`/appointments/${appointmentId}/notes`),
      create: (appointmentId: string, data: unknown) =>
        request<any>(`/appointments/${appointmentId}/notes`, {
          method: "POST",
          body: JSON.stringify(data),
        }),
      update: (appointmentId: string, noteId: string, data: unknown) =>
        request<any>(`/appointments/${appointmentId}/notes/${noteId}`, {
          method: "PATCH",
          body: JSON.stringify(data),
        }),
      delete: (appointmentId: string, noteId: string) =>
        request<any>(`/appointments/${appointmentId}/notes/${noteId}`, {
          method: "DELETE",
        }),
    },
  },
  storage: {
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<{ url: string }>("/storage/avatar", {
        method: "POST",
        body: formData,
      });
    },
    uploadAppointmentFile: (appointmentId: string, file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<{ url: string }>(`/storage/appointments/${appointmentId}/files`, {
        method: "POST",
        body: formData,
      });
    },
    deleteFile: (fileKey: string) =>
      request<any>(`/storage/files/${fileKey}`, {
        method: "DELETE",
      }),
  },
};

export default api;
