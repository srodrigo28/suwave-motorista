function getApiBaseUrl() {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://99dev.pro/suwave-api").replace(/\/$/, "");
  return baseUrl.endsWith("/api/v1") ? baseUrl : `${baseUrl}/api/v1`;
}

const apiBaseUrl = getApiBaseUrl();
export const DRIVER_AUTH_EXPIRED_EVENT = "suwave-driver-auth-expired";

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
    return new DriverApiError("O servidor oscilou agora. Tente entrar novamente em instantes.", code, fields);
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

type ConflictDetail = { exists: boolean; same_account: boolean };

export type AccountAvailability = {
  available: boolean;
  conflicts: Partial<Record<"email" | "cpf" | "whatsapp", ConflictDetail>>;
};

export type UploadResult = {
  storage_file_id?: number | string | null;
  url: string;
};

export const DRIVER_UPLOAD_TRACE_STORAGE_KEY = "suwave-driver-upload-trace";

type DriverUploadContext = "driver_face" | "driver_cnh" | "driver_vehicle";

type DriverUploadTraceEvent = {
  action: string;
  context?: DriverUploadContext;
  file?: {
    name: string;
    size: number;
    type: string;
  };
  linked_endpoint?: string;
  payload?: Record<string, unknown>;
  storage_file_id?: number | string | null;
  trace_id: string;
  url?: string | null;
  when: string;
};

function createDriverTraceId(context?: string) {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `driver-${context ?? "trace"}-${Date.now()}-${randomPart}`;
}

function recordDriverUploadTrace(event: Omit<DriverUploadTraceEvent, "trace_id" | "when"> & { trace_id?: string }) {
  const traceEvent: DriverUploadTraceEvent = {
    ...event,
    trace_id: event.trace_id ?? createDriverTraceId(event.context),
    when: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const previous = JSON.parse(window.localStorage.getItem(DRIVER_UPLOAD_TRACE_STORAGE_KEY) || "[]") as DriverUploadTraceEvent[];
      window.localStorage.setItem(DRIVER_UPLOAD_TRACE_STORAGE_KEY, JSON.stringify([traceEvent, ...previous].slice(0, 80)));
    } catch {
      window.localStorage.setItem(DRIVER_UPLOAD_TRACE_STORAGE_KEY, JSON.stringify([traceEvent]));
    }
  }

  // Mantem a rastreabilidade visivel durante testes manuais sem expor tokens.
  console.info("[SUWAVE motorista upload]", traceEvent);

  return traceEvent.trace_id;
}

function uploadTracePayload(upload: UploadResult) {
  return {
    storage_file_id: upload.storage_file_id ?? null,
    url: upload.url,
  };
}

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
  color?: string | null;
  front_photo_url?: string | null;
  interior_photo_url?: string | null;
  model: string;
  plate: string;
  rear_photo_url?: string | null;
  side_photo_url?: string | null;
  status: string;
  year?: string | number | null;
};

export type DriverProfile = {
  documents?: {
    cnh_back_url?: string | null;
    cnh_front_url?: string | null;
    face_photo_url?: string | null;
  } | null;
  face_photo_url?: string | null;
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  cpf?: string | null;
  cnpj?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  phone?: string | null;
  pix_account?: string | null;
  pix_key_type?: string | null;
  status: string;
  is_online: boolean;
  online_since?: string | null;
  last_accuracy_meters?: number | null;
  last_latitude?: number | null;
  last_longitude?: number | null;
  last_location_at?: string | null;
  approval_started_at?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
  rating_average?: number | null;
  rating_count?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  vehicles: DriverVehicle[];
};

export type DriverRideRequest = {
  accepted_at?: string | null;
  declined_at?: string | null;
  destination_label?: string | null;
  distance_meters?: number | null;
  driver_id?: string | null;
  driver?: DriverProfile | null;
  id: string;
  origin_label?: string | null;
  passenger_name?: string | null;
  passenger_phone?: string | null;
  requested_at: string;
  requested_seats: number;
  status: "PROCURANDO" | "SEM_MOTORISTA" | "ACEITA" | "RECUSADA" | "CONCLUIDA";
};

export type DriverRouteCoordinate = {
  lat: number;
  lng: number;
};

export type DriverPlannedTrip = {
  id: string;
  driver_id: string;
  origin_latitude: number;
  origin_longitude: number;
  origin_label?: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_label: string;
  departure_date: string;
  return_date: string;
  outbound_distance_km: number;
  return_distance_km: number;
  total_distance_km: number;
  duration_seconds: number;
  route_geometry?: DriverRouteCoordinate[] | null;
  status: "ATIVA" | "CANCELADA" | "CONCLUIDA";
  created_at: string;
  updated_at: string;
};

export type DriverEarningsHistory = {
  amount: string;
  amount_cents: number;
  created_at: string;
  description: string;
  id: string;
  status: string;
  title: string;
  type: "ride" | "planned_trip";
};

export type DriverEarnings = {
  accepted_rides: number;
  active_trips: number;
  available_balance: string;
  available_balance_cents: number;
  estimated_trip_total: string;
  estimated_trip_total_cents: number;
  history: DriverEarningsHistory[];
  month_total: string;
  month_total_cents: number;
  today_total: string;
  today_total_cents: number;
};

export type DriverDelivery = {
  accepted_at?: string | null;
  address: string;
  delivered_at?: string | null;
  delivery_fee: string;
  id: string;
  items_count: number;
  picked_up_at?: string | null;
  seller: string;
  short_id: string;
  status: "paid" | "preparing" | "on_route" | "delivered";
  status_label: string;
  total: string;
};

export type DriverHistoryItem = {
  date_label: string;
  distance_label: string;
  id: string;
  metrics: Array<{ label: string; value: string }>;
  sort_at: string;
  status: string;
  status_label: string;
  status_tone: "scheduled" | "completed" | "cancelled";
  subtitle: string;
  title: string;
  type: "ride" | "planned_trip" | "delivery";
};

export type CreateDriverTripInput = {
  origin_latitude: number;
  origin_longitude: number;
  origin_label?: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_label: string;
  departure_date: string;
  return_date: string;
  outbound_distance_km: number;
  return_distance_km: number;
  total_distance_km: number;
  duration_seconds: number;
  route_geometry?: DriverRouteCoordinate[] | null;
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

export type DriverNotification = {
  action_label?: string | null;
  action_url?: string | null;
  body: string;
  created_at: string;
  id: string;
  read: boolean;
  title: string;
  tone: "danger" | "info" | "success" | "warning" | string;
  user_id?: string;
};

async function parseResponse<T>(response: Response, options: { authRequired?: boolean } = {}) {
  const authRequired = options.authRequired ?? true;
  const body = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & Record<string, unknown>;

  if (!response.ok) {
    if (authRequired && response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(DRIVER_AUTH_EXPIRED_EVENT));
      throw new DriverApiError("Sua sessão expirou. Entre novamente para continuar.", "token_expired");
    }
    throw apiError(body);
  }

  return body.data as T;
}

async function apiRequest(path: string, init?: RequestInit) {
  try {
    const signal = AbortSignal.timeout(15000);
    return await fetch(`${apiBaseUrl}${path}`, { signal, ...init });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error("A API demorou muito para responder. Verifique sua conexão.");
    }
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

  return parseResponse<DriverAuthSession>(response, { authRequired: false });
}

export async function linkDriverRole(token: string) {
  const response = await apiRequest("/auth/link-role", {
    body: JSON.stringify({ role: "driver" }),
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
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

export async function uploadDriverImage(token: string, file: File, context: DriverUploadContext) {
  const traceId = recordDriverUploadTrace({
    action: "upload_started",
    context,
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
    },
  });
  const formData = new FormData();
  formData.append("context", context);
  formData.append("file", file);

  const response = await apiRequest("/uploads/images", {
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  const upload = await parseResponse<UploadResult>(response);
  recordDriverUploadTrace({
    action: "upload_completed",
    context,
    file: {
      name: file.name,
      size: file.size,
      type: file.type,
    },
    payload: uploadTracePayload(upload),
    storage_file_id: upload.storage_file_id ?? null,
    trace_id: traceId,
    url: upload.url,
  });

  return upload;
}

export async function saveDriverFacePhoto(token: string, upload: UploadResult) {
  const response = await apiRequest("/driver/photo/face", {
    body: JSON.stringify({ storage_file_id: normalizeStorageFileId(upload.storage_file_id), url: upload.url }),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  const result = await parseResponse(response);
  recordDriverUploadTrace({
    action: "image_linked_to_driver_face",
    context: "driver_face",
    linked_endpoint: "/driver/photo/face",
    payload: uploadTracePayload(upload),
    storage_file_id: upload.storage_file_id ?? null,
    url: upload.url,
  });

  return result;
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

  const result = await parseResponse(response);
  recordDriverUploadTrace({
    action: "image_linked_to_driver_cnh_front",
    context: "driver_cnh",
    linked_endpoint: "/driver/documents/cnh",
    payload: {
      storage_file_id: input.cnh_front_file_id ?? null,
      url: input.cnh_front_url,
    },
    storage_file_id: input.cnh_front_file_id ?? null,
    url: input.cnh_front_url,
  });
  recordDriverUploadTrace({
    action: "image_linked_to_driver_cnh_back",
    context: "driver_cnh",
    linked_endpoint: "/driver/documents/cnh",
    payload: {
      storage_file_id: input.cnh_back_file_id ?? null,
      url: input.cnh_back_url,
    },
    storage_file_id: input.cnh_back_file_id ?? null,
    url: input.cnh_back_url,
  });

  return result;
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
    year?: string | number | null;
  },
) {
  const response = await apiRequest("/driver/vehicle", {
    body: JSON.stringify(normalizeVehicleUploadIds(input)),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  const result = await parseResponse(response);
  recordDriverUploadTrace({
    action: "images_linked_to_driver_vehicle",
    context: "driver_vehicle",
    linked_endpoint: "/driver/vehicle",
    payload: {
      front: { storage_file_id: input.front_photo_file_id ?? null, url: input.front_photo_url ?? null },
      interior: { storage_file_id: input.interior_photo_file_id ?? null, url: input.interior_photo_url ?? null },
      rear: { storage_file_id: input.rear_photo_file_id ?? null, url: input.rear_photo_url ?? null },
      side: { storage_file_id: input.side_photo_file_id ?? null, url: input.side_photo_url ?? null },
    },
  });

  return result;
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
    year?: string | number | null;
  },
) {
  const response = await apiRequest(`/driver/vehicle/${vehicleId}`, {
    body: JSON.stringify(normalizeVehicleUploadIds(input)),
    headers: authJsonHeaders(token),
    method: "PUT",
  });

  const result = await parseResponse(response);
  recordDriverUploadTrace({
    action: "images_updated_on_driver_vehicle",
    context: "driver_vehicle",
    linked_endpoint: `/driver/vehicle/${vehicleId}`,
    payload: {
      front: { storage_file_id: input.front_photo_file_id ?? null, url: input.front_photo_url ?? null },
      interior: { storage_file_id: input.interior_photo_file_id ?? null, url: input.interior_photo_url ?? null },
      rear: { storage_file_id: input.rear_photo_file_id ?? null, url: input.rear_photo_url ?? null },
      side: { storage_file_id: input.side_photo_file_id ?? null, url: input.side_photo_url ?? null },
    },
  });

  return result;
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

export async function completeDriverRideRequest(token: string, rideRequestId: string) {
  const response = await apiRequest(`/driver/ride-requests/${rideRequestId}/complete`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverRideRequest>(response);
}

export async function listAvailableDriverDeliveries(token: string) {
  const response = await apiRequest("/driver/deliveries/available", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverDelivery[]>(response);
}

export async function acceptDriverDelivery(token: string, orderId: string) {
  const response = await apiRequest(`/driver/deliveries/${orderId}/accept`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverDelivery>(response);
}

export async function pickupDriverDelivery(token: string, orderId: string) {
  const response = await apiRequest(`/driver/deliveries/${orderId}/pickup`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverDelivery>(response);
}

export async function completeDriverDelivery(token: string, orderId: string) {
  const response = await apiRequest(`/driver/deliveries/${orderId}/complete`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverDelivery>(response);
}

export async function listDriverTrips(token: string) {
  const response = await apiRequest("/driver/trips", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverPlannedTrip[]>(response);
}

export async function listDriverHistory(token: string) {
  const response = await apiRequest("/driver/history", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverHistoryItem[]>(response);
}

export async function getDriverEarnings(token: string) {
  const response = await apiRequest("/driver/earnings", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverEarnings>(response);
}

export async function listDriverNotifications(token: string) {
  const response = await apiRequest("/notifications", {
    headers: { Authorization: `Bearer ${token}` },
  });

  return parseResponse<DriverNotification[]>(response);
}

export async function createDriverTrip(token: string, input: CreateDriverTripInput) {
  const response = await apiRequest("/driver/trips", {
    body: JSON.stringify(input),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse<DriverPlannedTrip>(response);
}

export async function completeDriverTrip(token: string, tripId: string) {
  const response = await apiRequest(`/driver/trips/${tripId}/complete`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverPlannedTrip>(response);
}

export async function cancelDriverTrip(token: string, tripId: string) {
  const response = await apiRequest(`/driver/trips/${tripId}/cancel`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverPlannedTrip>(response);
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
