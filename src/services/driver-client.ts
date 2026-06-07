function getApiBaseUrl() {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://99dev.pro/suwave-api").replace(/\/$/, "");
  return baseUrl.endsWith("/api/v1") ? baseUrl : `${baseUrl}/api/v1`;
}

const apiBaseUrl = getApiBaseUrl();

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

export class DriverApiError extends Error {
  code?: string;
  fields?: Record<string, unknown>;

  constructor(message: string, code?: string, fields?: Record<string, unknown>) {
    super(message);
    this.name = "DriverApiError";
    this.code = code;
    this.fields = fields;
  }
}

const fieldLabels: Record<string, string> = {
  accepted_terms: "aceite dos termos",
  birth_date: "data de nascimento",
  cnpj: "CNPJ",
  cpf: "CPF",
  email: "e-mail",
  full_name: "nome completo",
  password: "senha",
  pix_account: "conta Pix",
  pix_key_type: "tipo de chave Pix",
  whatsapp: "WhatsApp",
};

function findValidationField(value: unknown): string | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (fieldLabels[key]) {
      return key;
    }
    const nestedField = findValidationField(nestedValue);
    if (nestedField) {
      return nestedField;
    }
  }

  return undefined;
}

function findValidationMessages(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => (typeof item === "string" ? [item] : findValidationMessages(item)));
  }

  if (typeof value !== "object") {
    return [];
  }

  return Object.values(value).flatMap(findValidationMessages);
}

function apiError(body: Record<string, unknown>) {
  const error = body.error && typeof body.error === "object" ? (body.error as Record<string, unknown>) : undefined;
  const validationData = error?.fields ?? body.errors;
  const validationField = findValidationField(validationData);
  const code = typeof error?.code === "string" ? error.code : undefined;
  const fields = error?.fields && typeof error.fields === "object" ? (error.fields as Record<string, unknown>) : undefined;

  if (validationField) {
    return new DriverApiError(`Verifique o campo ${fieldLabels[validationField]} e tente novamente.`, code, fields);
  }

  const validationMessages = findValidationMessages(validationData);
  if (validationMessages.length > 0) {
    return new DriverApiError(`Revise os dados informados: ${validationMessages[0]}`, code, fields);
  }

  const errorMessage = typeof error?.message === "string" ? error.message : undefined;
  const message = typeof body.message === "string" ? body.message : undefined;

  if (code === "internal_error") {
    return new DriverApiError("A API retornou erro interno. Verifique o deploy, migrations e logs do servidor.", code, fields);
  }

  if (message?.includes("semantic errors")) {
    return new DriverApiError("Alguns dados informados são inválidos. Revise o cadastro e tente novamente.", code, fields);
  }

  return new DriverApiError(errorMessage || message || "Não foi possível concluir a operação.", code, fields);
}

export type DriverAuthSession = {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    full_name: string;
  };
};

export type AccountAvailability = {
  available: boolean;
  conflicts: Partial<Record<"email" | "cpf" | "whatsapp", boolean>>;
};

export type UploadResult = {
  storage_file_id?: number | string | null;
  url: string;
};

export type DriverReviewStatus = {
  approved: boolean;
  driver: DriverProfile;
  seconds_remaining: number;
  status: string;
  missing: string[];
};

export type DriverAvailability = {
  can_receive_rides: boolean;
  driver: DriverProfile;
  is_online: boolean;
  missing: string[];
};

export type DriverVehicle = {
  id: string;
  brand: string;
  model: string;
  plate: string;
  status: string;
};

export type DriverProfile = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  is_online: boolean;
  last_accuracy_meters?: number | null;
  last_latitude?: number | null;
  last_longitude?: number | null;
  vehicles: DriverVehicle[];
};

export type DriverRideRequest = {
  accepted_at?: string | null;
  declined_at?: string | null;
  destination_label?: string | null;
  distance_meters?: number | null;
  driver_id?: string | null;
  id: string;
  origin_label?: string | null;
  passenger_name?: string | null;
  passenger_phone?: string | null;
  requested_at: string;
  requested_seats: number;
  status: "PROCURANDO" | "SEM_MOTORISTA" | "ACEITA" | "RECUSADA";
};

export type DriverTerms = {
  body: string;
  document_key: string;
  id?: string | null;
  privacy_url?: string | null;
  title: string;
  updated_at?: string | null;
  version: number;
};

async function parseResponse<T>(response: Response) {
  const body = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & Record<string, unknown>;

  if (!response.ok) {
    throw apiError(body);
  }

  return body.data as T;
}

async function apiRequest(path: string, init?: RequestInit) {
  try {
    return await fetch(`${apiBaseUrl}${path}`, init);
  } catch {
    throw new Error("API principal indisponível. Verifique a conexão ou a URL configurada da API SUWAVE.");
  }
}

export async function registerDriverAccount(input: {
  birth_date?: string;
  email: string;
  full_name: string;
  gender: string;
  password: string;
}) {
  const response = await apiRequest("/auth/register", {
    body: JSON.stringify({ ...input, accepted_terms: true }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return parseResponse<DriverAuthSession>(response);
}

export async function checkDriverAccountAvailability(input: { cpf?: string; email?: string; whatsapp?: string }) {
  const response = await apiRequest("/auth/account/availability", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return parseResponse<AccountAvailability>(response);
}

export async function loginDriverAccount(input: { email?: string; whatsapp?: string; password: string }) {
  const response = await apiRequest("/auth/login", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return parseResponse<DriverAuthSession>(response);
}

export async function requestDriverPasswordReset(input: { email?: string; whatsapp?: string }) {
  const response = await apiRequest("/auth/password/forgot", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return parseResponse<{ email: string; whatsapp?: string | null }>(response);
}

export async function getDriverTerms() {
  const response = await apiRequest("/driver/terms");
  return parseResponse<DriverTerms>(response);
}

export async function getDriverProfile(token: string) {
  const response = await apiRequest("/driver/me", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverProfile>(response);
}

export async function saveDriverProfile(
  token: string,
  input: {
    birth_date?: string;
    cnpj?: string;
    cpf?: string;
    email: string;
    full_name: string;
    gender: string;
    phone?: string;
    pix_account?: string;
    pix_key_type?: string;
  },
) {
  const response = await apiRequest("/driver/profile", {
    body: JSON.stringify(input),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function updateDriverProfile(
  token: string,
  input: {
    birth_date?: string;
    cnpj?: string;
    cpf?: string;
    email: string;
    full_name: string;
    gender: string;
    phone?: string;
    pix_account?: string;
    pix_key_type?: string;
  },
) {
  const response = await apiRequest("/driver/profile", {
    body: JSON.stringify(input),
    headers: authJsonHeaders(token),
    method: "PUT",
  });

  return parseResponse(response);
}

export async function uploadDriverImage(token: string, file: File, context: "driver_face" | "driver_cnh" | "driver_vehicle") {
  const formData = new FormData();
  formData.append("context", context);
  formData.append("file", file);

  const response = await apiRequest("/uploads/images", {
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<UploadResult>(response);
}

export async function saveDriverFacePhoto(token: string, upload: UploadResult) {
  const response = await apiRequest("/driver/photo/face", {
    body: JSON.stringify({ storage_file_id: normalizeStorageFileId(upload.storage_file_id), url: upload.url }),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function saveDriverCnh(
  token: string,
  input: {
    cnh_back_file_id?: number | string | null;
    cnh_back_url: string;
    cnh_front_file_id?: number | string | null;
    cnh_front_url: string;
  },
) {
  const response = await apiRequest("/driver/documents/cnh", {
    body: JSON.stringify({
      ...input,
      cnh_back_file_id: normalizeStorageFileId(input.cnh_back_file_id),
      cnh_front_file_id: normalizeStorageFileId(input.cnh_front_file_id),
    }),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function submitDriverReview(token: string) {
  const response = await apiRequest("/driver/submit-review", {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse(response);
}

export async function getDriverReviewStatus(token: string) {
  const response = await apiRequest("/driver/review-status", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverReviewStatus>(response);
}

export async function saveDriverVehicle(
  token: string,
  input: {
    brand: string;
    front_photo_file_id?: number | string | null;
    front_photo_url?: string | null;
    interior_photo_file_id?: number | string | null;
    interior_photo_url?: string | null;
    model: string;
    plate: string;
    rear_photo_file_id?: number | string | null;
    rear_photo_url?: string | null;
    side_photo_file_id?: number | string | null;
    side_photo_url?: string | null;
  },
) {
  const response = await apiRequest("/driver/vehicle", {
    body: JSON.stringify(normalizeVehicleUploadIds(input)),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function updateDriverVehicle(
  token: string,
  vehicleId: string,
  input: {
    brand: string;
    front_photo_file_id?: number | string | null;
    front_photo_url?: string | null;
    interior_photo_file_id?: number | string | null;
    interior_photo_url?: string | null;
    model: string;
    plate: string;
    rear_photo_file_id?: number | string | null;
    rear_photo_url?: string | null;
    side_photo_file_id?: number | string | null;
    side_photo_url?: string | null;
  },
) {
  const response = await apiRequest(`/driver/vehicle/${vehicleId}`, {
    body: JSON.stringify(normalizeVehicleUploadIds(input)),
    headers: authJsonHeaders(token),
    method: "PUT",
  });

  return parseResponse(response);
}

export async function pingDriverLocation(
  token: string,
  input: {
    accuracy_meters?: number | null;
    latitude: number;
    longitude: number;
  },
) {
  const response = await apiRequest("/driver/location/ping", {
    body: JSON.stringify(input),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function setDriverOnline(token: string) {
  const response = await apiRequest("/driver/availability/online", {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverAvailability>(response);
}

export async function setDriverOffline(token: string) {
  const response = await apiRequest("/driver/availability/offline", {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverAvailability>(response);
}

export async function listDriverRideRequests(token: string) {
  const response = await apiRequest("/driver/ride-requests", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverRideRequest[]>(response);
}

export async function acceptDriverRideRequest(token: string, rideRequestId: string) {
  const response = await apiRequest(`/driver/ride-requests/${rideRequestId}/accept`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverRideRequest>(response);
}

export async function declineDriverRideRequest(token: string, rideRequestId: string) {
  const response = await apiRequest(`/driver/ride-requests/${rideRequestId}/decline`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverRideRequest>(response);
}

function authJsonHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function normalizeStorageFileId(value: number | string | null | undefined) {
  return value == null ? null : String(value);
}

function normalizeVehicleUploadIds<T extends {
  front_photo_file_id?: number | string | null;
  interior_photo_file_id?: number | string | null;
  rear_photo_file_id?: number | string | null;
  side_photo_file_id?: number | string | null;
}>(input: T) {
  return {
    ...input,
    front_photo_file_id: normalizeStorageFileId(input.front_photo_file_id),
    interior_photo_file_id: normalizeStorageFileId(input.interior_photo_file_id),
    rear_photo_file_id: normalizeStorageFileId(input.rear_photo_file_id),
    side_photo_file_id: normalizeStorageFileId(input.side_photo_file_id),
  };
}
