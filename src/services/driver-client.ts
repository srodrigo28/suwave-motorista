function getApiBaseUrl() {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://99dev.pro/suwave-api").replace(/\/$/, "");
  return baseUrl.endsWith("/api/v1") ? baseUrl : `${baseUrl}/api/v1`;
}

const apiBaseUrl = getApiBaseUrl();

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

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

function apiErrorMessage(body: Record<string, unknown>) {
  const error = body.error && typeof body.error === "object" ? (body.error as Record<string, unknown>) : undefined;
  const validationField = findValidationField(error?.fields ?? body.errors);

  if (validationField) {
    return `Verifique o campo ${fieldLabels[validationField]} e tente novamente.`;
  }

  const errorMessage = typeof error?.message === "string" ? error.message : undefined;
  const message = typeof body.message === "string" ? body.message : undefined;

  if (message?.includes("semantic errors")) {
    return "Alguns dados informados são inválidos. Revise o cadastro e tente novamente.";
  }

  return errorMessage || message || "Não foi possível concluir a operação.";
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

export type UploadResult = {
  storage_file_id?: string | null;
  url: string;
};

export type DriverReviewStatus = {
  approved: boolean;
  seconds_remaining: number;
  status: string;
  missing: string[];
};

export type DriverAvailability = {
  can_receive_rides: boolean;
  is_online: boolean;
  missing: string[];
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

async function parseResponse<T>(response: Response) {
  const body = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & Record<string, unknown>;

  if (!response.ok) {
    throw new Error(apiErrorMessage(body));
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
  cpf?: string;
  email: string;
  full_name: string;
  password: string;
  whatsapp?: string;
}) {
  const response = await apiRequest("/auth/register", {
    body: JSON.stringify({ ...input, accepted_terms: true }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return parseResponse<DriverAuthSession>(response);
}

export async function loginDriverAccount(input: { email?: string; whatsapp?: string; password: string }) {
  const response = await apiRequest("/auth/login", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return parseResponse<DriverAuthSession>(response);
}

export async function saveDriverProfile(
  token: string,
  input: {
    birth_date?: string;
    cnpj?: string;
    cpf?: string;
    email: string;
    full_name: string;
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
    body: JSON.stringify({ storage_file_id: upload.storage_file_id, url: upload.url }),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function saveDriverCnh(
  token: string,
  input: {
    cnh_back_file_id?: string | null;
    cnh_back_url: string;
    cnh_front_file_id?: string | null;
    cnh_front_url: string;
  },
) {
  const response = await apiRequest("/driver/documents/cnh", {
    body: JSON.stringify(input),
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
    front_photo_file_id?: string | null;
    front_photo_url?: string | null;
    interior_photo_file_id?: string | null;
    interior_photo_url?: string | null;
    model: string;
    plate: string;
    rear_photo_file_id?: string | null;
    rear_photo_url?: string | null;
    side_photo_file_id?: string | null;
    side_photo_url?: string | null;
  },
) {
  const response = await apiRequest("/driver/vehicle", {
    body: JSON.stringify(input),
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
    front_photo_file_id?: string | null;
    front_photo_url?: string | null;
    interior_photo_file_id?: string | null;
    interior_photo_url?: string | null;
    model: string;
    plate: string;
    rear_photo_file_id?: string | null;
    rear_photo_url?: string | null;
    side_photo_file_id?: string | null;
    side_photo_url?: string | null;
  },
) {
  const response = await apiRequest(`/driver/vehicle/${vehicleId}`, {
    body: JSON.stringify(input),
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
