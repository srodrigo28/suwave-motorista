const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1").replace(/\/$/, "");

type ApiEnvelope<T> = {
  data: T;
  message?: string;
};

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

async function parseResponse<T>(response: Response) {
  const body = (await response.json().catch(() => ({}))) as Partial<ApiEnvelope<T>> & {
    error?: { message?: string };
    message?: string;
  };

  if (!response.ok) {
    throw new Error(body.error?.message || body.message || "Não foi possível concluir a operação.");
  }

  return body.data as T;
}

export async function registerDriverAccount(input: {
  birth_date?: string;
  cpf?: string;
  email: string;
  full_name: string;
  password: string;
  whatsapp?: string;
}) {
  const response = await fetch(`${apiBaseUrl}/auth/register`, {
    body: JSON.stringify({ ...input, accepted_terms: true }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  return parseResponse<DriverAuthSession>(response);
}

export async function loginDriverAccount(input: { email?: string; whatsapp?: string; password: string }) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
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
    cpf?: string;
    email: string;
    full_name: string;
    phone?: string;
  },
) {
  const response = await fetch(`${apiBaseUrl}/driver/profile`, {
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
    cpf?: string;
    email: string;
    full_name: string;
    phone?: string;
  },
) {
  const response = await fetch(`${apiBaseUrl}/driver/profile`, {
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

  const response = await fetch(`${apiBaseUrl}/uploads/images`, {
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<UploadResult>(response);
}

export async function saveDriverFacePhoto(token: string, upload: UploadResult) {
  const response = await fetch(`${apiBaseUrl}/driver/photo/face`, {
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
  const response = await fetch(`${apiBaseUrl}/driver/documents/cnh`, {
    body: JSON.stringify(input),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function submitDriverReview(token: string) {
  const response = await fetch(`${apiBaseUrl}/driver/submit-review`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse(response);
}

export async function getDriverReviewStatus(token: string) {
  const response = await fetch(`${apiBaseUrl}/driver/review-status`, {
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
  const response = await fetch(`${apiBaseUrl}/driver/vehicle`, {
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
  const response = await fetch(`${apiBaseUrl}/driver/vehicle/${vehicleId}`, {
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
  const response = await fetch(`${apiBaseUrl}/driver/location/ping`, {
    body: JSON.stringify(input),
    headers: authJsonHeaders(token),
    method: "POST",
  });

  return parseResponse(response);
}

export async function setDriverOnline(token: string) {
  const response = await fetch(`${apiBaseUrl}/driver/availability/online`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverAvailability>(response);
}

export async function setDriverOffline(token: string) {
  const response = await fetch(`${apiBaseUrl}/driver/availability/offline`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });

  return parseResponse<DriverAvailability>(response);
}

function authJsonHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}
