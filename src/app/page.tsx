"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiArrowLeft, FiCamera, FiCheckCircle, FiChevronRight, FiEdit3, FiLogOut, FiRefreshCw } from "react-icons/fi";
import {
  getDriverReviewStatus,
  acceptDriverRideRequest,
  checkDriverAccountAvailability,
  createDriverTrip,
  declineDriverRideRequest,
  DriverApiError,
  getDriverEarnings,
  getDriverProfile,
  getDriverTerms,
  loginDriverAccount,
  acceptDriverDelivery,
  cancelDriverTrip,
  completeDriverDelivery,
  completeDriverRideRequest,
  completeDriverTrip,
  listDriverHistory,
  listAvailableDriverDeliveries,
  pickupDriverDelivery,
  listDriverRideRequests,
  pingDriverLocation,
  registerDriverAccount,
  requestDriverPasswordReset,
  saveDriverCnh,
  saveDriverFacePhoto,
  saveDriverProfile,
  saveDriverVehicle,
  setDriverOffline,
  setDriverOnline,
  submitDriverReview,
  updateDriverVehicle,
  uploadDriverImage,
  DRIVER_AUTH_EXPIRED_EVENT,
  type DriverDelivery,
  type DriverEarnings,
  type DriverHistoryItem,
  type DriverProfile,
  type DriverRideRequest,
  type DriverTerms,
} from "@/services/driver-client";
import {
  useDriverFlowStore,
  type DriverWorkMode,
  type DriverSignupForm,
  type VehicleBrandOption,
  type VehicleForm,
  type VehicleUploads,
} from "@/stores/driver-flow-store";

type Screen =
  | "login"
  | "forgot-password"
  | "forgot-success"
  | "signup"
  | "terms"
  | "face"
  | "cnh"
  | "submitted"
  | "status"
  | "dashboard"
  | "profile"
  | "register-trip"
  | "trip-history"
  | "vehicle-list"
  | "vehicle-mode"
  | "vehicle-brand"
  | "vehicle-data"
  | "vehicle-photos"
  | "vehicle-review";

type PasswordResetContact = {
  email?: string;
  whatsapp?: string;
};

type DriverMapLocation = {
  accuracy_meters?: number | null;
  latitude: number;
  longitude: number;
};

type DriverMapPlace = {
  label?: string | null;
  locality?: string | null;
  provider?: string;
  region?: string | null;
};

type DriverRoutePlace = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  locality?: string;
  region?: string;
};

type DriverRouteCoordinate = {
  lat: number;
  lng: number;
};

type DriverRouteSummary = {
  distanceKm: number;
  distanceLabel: string;
  durationLabel: string;
  durationSeconds: number;
  geometry: DriverRouteCoordinate[];
  provider: string;
};

type GoogleLatLngLiteral = {
  lat: number;
  lng: number;
};

type DriverMapLayer = "roadmap" | "satellite";

type GoogleCircle = {
  setCenter: (center: GoogleLatLngLiteral) => void;
  setMap: (map: GoogleMap | null) => void;
  setRadius: (radius: number) => void;
};

type GoogleLatLngBounds = {
  extend: (point: GoogleLatLngLiteral) => void;
};

type GoogleMap = {
  addListener: (eventName: string, handler: () => void) => unknown;
  fitBounds: (bounds: GoogleLatLngBounds, padding?: number) => void;
  getZoom: () => number | undefined;
  setCenter: (center: GoogleLatLngLiteral) => void;
  setMapTypeId: (mapTypeId: DriverMapLayer) => void;
  setZoom: (zoom: number) => void;
};

type GoogleMarker = {
  setMap: (map: GoogleMap | null) => void;
  setPosition: (position: GoogleLatLngLiteral) => void;
};

type GooglePolyline = {
  setMap: (map: GoogleMap | null) => void;
  setPath: (path: GoogleLatLngLiteral[]) => void;
};

type GoogleMapsNamespace = {
  Circle: new (options: {
    center: GoogleLatLngLiteral;
    fillColor: string;
    fillOpacity: number;
    map: GoogleMap;
    radius: number;
    strokeColor: string;
    strokeOpacity: number;
    strokeWeight: number;
  }) => GoogleCircle;
  Map: new (
    element: HTMLElement,
    options: {
      center: GoogleLatLngLiteral;
      clickableIcons: boolean;
      disableDefaultUI: boolean;
      fullscreenControl: boolean;
      gestureHandling: string;
      mapTypeId: DriverMapLayer;
      mapTypeControl: boolean;
      scaleControl: boolean;
      streetViewControl: boolean;
      zoom: number;
      zoomControl: boolean;
    },
  ) => GoogleMap;
  LatLngBounds: new () => GoogleLatLngBounds;
  Marker: new (options: {
    map: GoogleMap;
    optimized?: boolean;
    position: GoogleLatLngLiteral;
    title: string;
  }) => GoogleMarker;
  Polyline: new (options: {
    geodesic: boolean;
    map: GoogleMap;
    path: GoogleLatLngLiteral[];
    strokeColor: string;
    strokeOpacity: number;
    strokeWeight: number;
  }) => GooglePolyline;
};

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function getStoredDriverToken() {
  if (typeof window === "undefined") {
    return undefined;
  }

  return localStorage.getItem("suwave-driver-token") ?? undefined;
}

const primarySteps = ["1", "2", "3", "4", "5"];
const vehicleSteps = ["1", "2", "3", "4"];
const defaultDriverMapZoom = 16;
const maxDriverMapZoom = 18;
const minDriverMapZoom = 12;
const defaultDriverMapLocation = {
  accuracy_meters: 80,
  latitude: -11.8604,
  longitude: -55.5091,
};
const mapTileUrlTemplate =
  process.env.NEXT_PUBLIC_MAP_TILE_URL_TEMPLATE || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
let googleMapsScriptPromise: Promise<GoogleMapsNamespace> | null = null;

const fallbackBrands: VehicleBrandOption[] = [
  { codigo: "gm", nome: "Chevrolet" },
  { codigo: "fiat", nome: "Fiat" },
  { codigo: "toyota", nome: "Toyota" },
  { codigo: "volkswagen", nome: "Volkswagen" },
  { codigo: "hyundai", nome: "Hyundai" },
  { codigo: "ford", nome: "Ford" },
  { codigo: "honda", nome: "Honda" },
  { codigo: "renault", nome: "Renault" },
  { codigo: "nissan", nome: "Nissan" },
  { codigo: "jeep", nome: "Jeep" },
  { codigo: "citroen", nome: "Citroën" },
  { codigo: "peugeot", nome: "Peugeot" },
];

const brandLogoSlugs: Record<string, string> = {
  audi: "audi",
  bmw: "bmw",
  chevrolet: "chevrolet",
  citroën: "citroen",
  citroen: "citroen",
  fiat: "fiat",
  ford: "ford",
  honda: "honda",
  hyundai: "hyundai",
  jeep: "jeep",
  kia: "kia",
  mercedes: "mercedesbenz",
  "mercedes-benz": "mercedesbenz",
  mitsubishi: "mitsubishi",
  nissan: "nissan",
  peugeot: "peugeot",
  renault: "renault",
  toyota: "toyota",
  volkswagen: "volkswagen",
  volvo: "volvo",
};

function normalizeBrandName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getBrandLogoSlug(name: string) {
  const normalized = normalizeBrandName(name);
  return brandLogoSlugs[normalized] ?? brandLogoSlugs[normalized.split(" ")[0]];
}

function getBrandInitials(name: string) {
  return name
    .split(/\s|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function isIOSDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function Icon({ name }: { name: string }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 2,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "mail":
      return (
        <svg {...common}>
          <path d="M4 6h16v12H4z" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common}>
          <path d="M4.8 19.1 5.9 16A8 8 0 1 1 8 18.1l-3.2 1Z" />
          <path d="M9.4 8.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.3.1.5-.1.7l-.4.5c.7 1.2 1.6 2 2.8 2.6l.5-.6c.2-.2.4-.3.7-.2l1.4.7c.3.1.4.3.4.6v.4c0 .3-.1.6-.4.8-.5.4-1.1.6-1.8.5-2.9-.5-5.6-2.8-6.5-5.6-.2-.7-.1-1.4.3-1.9Z" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect height="11" rx="2" width="16" x="4" y="10" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "eye":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case "eye-off":
      return (
        <svg {...common}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6a18.5 18.5 0 0 1-2.1 2.6" />
          <path d="M9.9 9.9a2.5 2.5 0 0 0 3.5 3.5" />
          <path d="M4 4l16 16" />
          <path d="M9.4 17.5A10.8 10.8 0 0 1 2.5 12a18 18 0 0 1 3.2-3.7" />
        </svg>
      );
    case "menu":
      return (
        <svg {...common}>
          <path d="M5 8.5h14" />
          <path d="M5 12h14" />
          <path d="M5 15.5h14" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case "minus":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.8 1.8 0 0 0-2-.4 1.8 1.8 0 0 0-1 1.6V21a2 2 0 0 1-4 0v-.1a1.8 1.8 0 0 0-1-1.6 1.8 1.8 0 0 0-2 .4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.8 1.8 0 0 0 .4-2 1.8 1.8 0 0 0-1.6-1H3a2 2 0 0 1 0-4h.1a1.8 1.8 0 0 0 1.6-1 1.8 1.8 0 0 0-.4-2l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.8 1.8 0 0 0 2 .4 1.8 1.8 0 0 0 1-1.6V3a2 2 0 0 1 4 0v.1a1.8 1.8 0 0 0 1 1.6 1.8 1.8 0 0 0 2-.4l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.8 1.8 0 0 0-.4 2 1.8 1.8 0 0 0 1.6 1h.1a2 2 0 0 1 0 4h-.1a1.8 1.8 0 0 0-1.6 1Z" />
        </svg>
      );
    case "help":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9a2.7 2.7 0 0 1 5.1 1.3c0 1.8-2.6 2.1-2.6 3.7" />
          <path d="M12 17h.01" />
        </svg>
      );
    case "close":
      return (
        <svg {...common}>
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 5 5 9-10" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5" />
          <path d="m12 5-7 7 7 7" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <path d="M20 21a8 8 0 0 0-16 0" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <path d="M7 3v3M17 3v3" />
          <rect height="17" rx="2" width="18" x="3" y="4" />
          <path d="M3 10h18" />
        </svg>
      );
    case "clock":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case "id":
      return (
        <svg {...common}>
          <rect height="14" rx="2" width="18" x="3" y="5" />
          <circle cx="8" cy="11" r="2" />
          <path d="M6 16a3 3 0 0 1 4 0M13 10h5M13 14h4" />
        </svg>
      );
    case "briefcase":
      return (
        <svg {...common}>
          <path d="M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
          <rect height="14" rx="2" width="18" x="3" y="6" />
          <path d="M3 12h18M10 12v2h4v-2" />
        </svg>
      );
    case "pix":
      return (
        <svg {...common}>
          <path d="m12 3 9 9-9 9-9-9 9-9Z" />
          <path d="m8 12 4-4 4 4-4 4-4-4Z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...common}>
          <path d="M6.5 3.5 9 3l2 5-1.5 1c1 2 2.5 3.5 4.5 4.5l1-1.5 5 2-.5 2.5c-.2 1-1.1 1.7-2.1 1.6C9.6 18.4 5.6 14.4 4.9 6.6c-.1-1 .6-1.9 1.6-2.1Z" />
        </svg>
      );
    case "home":
      return (
        <svg {...common}>
          <path d="m4 11 8-7 8 7" />
          <path d="M6 10v10h12V10" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "camera":
      return (
        <svg {...common}>
          <path d="M8 7 9.5 5h5L16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3Z" />
          <circle cx="12" cy="13" r="3.5" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 2v4M12 18v4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M2 12h4M18 12h4M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "ban":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <path d="m7 7 10 10" />
        </svg>
      );
    case "car":
      return (
        <svg {...common}>
          <path d="M6 16h12M7 16l1.4-5.2A2.5 2.5 0 0 1 10.8 9h2.4a2.5 2.5 0 0 1 2.4 1.8L17 16" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case "van":
      return (
        <svg {...common}>
          <path d="M3 16h15" />
          <path d="M4 16V9a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v7" />
          <path d="M14 10h3l3 3v3h-6" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="17" cy="17" r="1.5" />
        </svg>
      );
    case "moto":
      return (
        <svg {...common}>
          <circle cx="7" cy="17" r="2" />
          <circle cx="18" cy="17" r="2" />
          <path d="M9 17h4l2.2-4H12l-2-3H7" />
          <path d="M14 10h3l2 2" />
          <path d="M10.5 9.5 12 12" />
        </svg>
      );
    case "bike":
      return (
        <svg {...common}>
          <circle cx="6.5" cy="17" r="2.5" />
          <circle cx="17.5" cy="17" r="2.5" />
          <path d="M8 17 11 10h2l3 7" />
          <path d="M10.5 10H7.5" />
          <path d="M12 10 14.5 8.5" />
        </svg>
      );
    case "road":
      return (
        <svg {...common}>
          <path d="M8 21 10 3" />
          <path d="m14 3 2 18" />
          <path d="M12 5v3" />
          <path d="M12 11v3" />
          <path d="M12 17v2" />
          <path d="M4 21h16" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );
    case "download":
      return (
        <svg {...common}>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      );
    case "locate":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3" />
          <path d="M12 19v3" />
          <path d="M2 12h3" />
          <path d="M19 12h3" />
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

function BrandLockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand-lockup ${compact ? "compact" : ""}`}>
      <Image
        alt="SUWAVE Motorista"
        height={150}
        src="/motorista/inicio-logo.png"
        width={520}
      />
    </div>
  );
}

function Splash() {
  return (
    <div className="splash" aria-label="Suwave Motorista">
      <Image
        alt=""
        className="splash-image"
        fill
        priority
        sizes="100vw"
        src="/motorista/splash.png"
      />
    </div>
  );
}

function InstallSheet({
  canInstall,
  isIOS,
  onClose,
  onInstall,
}: {
  canInstall: boolean;
  isIOS: boolean;
  onClose: () => void;
  onInstall: () => void;
}) {
  return (
    <div className="install-overlay">
      <aside aria-label="Instalar SUWAVE Motorista" className="install-sheet">
        <button
          aria-label="Fechar convite de instalação"
          className="install-close"
          onClick={onClose}
          type="button"
        >
          <Icon name="close" />
        </button>
        <div className="install-lead">
          <span className="install-mark">
            <Image
              alt=""
              fill
              sizes="54px"
              src="/motorista/inicio-logo.png"
            />
          </span>
          <div>
            <strong>Instalar SUWAVE Motorista</strong>
            <p>Abra mais rápido e receba corridas como aplicativo no celular.</p>
          </div>
        </div>
        {isIOS ? (
          <p className="install-hint">
            No iPhone, toque em Compartilhar e depois em Adicionar à Tela de Início.
          </p>
        ) : !canInstall ? (
          <p className="install-hint">
            Se o navegador não abrir a instalação, use o menu e toque em Instalar app.
          </p>
        ) : null}
        <div className="install-actions">
          <button onClick={onClose} type="button">
            Agora não
          </button>
          <button onClick={onInstall} type="button">
            <Icon name="download" />
            {canInstall ? "Instalar" : "Entendi"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <strong>9:41</strong>
      <span className="island" />
      <span className="signals">▮▮▮ ◒ ▰</span>
    </div>
  );
}

function Progress({
  total,
  current,
  labels,
}: {
  total: string[];
  current: number;
  labels?: string[];
}) {
  return (
    <div className="progress" style={{ "--steps": total.length } as React.CSSProperties}>
      {total.map((step, index) => {
        const done = index + 1 < current;
        const active = index + 1 === current;
        return (
          <div className="progress-item" key={step}>
            <span className={done ? "done" : active ? "active" : ""}>
              {done ? "✓" : step}
            </span>
            {labels ? <small>{labels[index]}</small> : null}
          </div>
        );
      })}
    </div>
  );
}

function Field({
  disabled = false,
  inputMode,
  icon,
  label,
  maxLength,
  onChange,
  secure = false,
  type,
  value,
}: {
  disabled?: boolean;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  icon: string;
  label: string;
  maxLength?: number;
  onChange?: (value: string) => void;
  secure?: boolean;
  type?: string;
  value?: string;
}) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = secure ? (isPasswordVisible ? "text" : "password") : (type ?? "text");

  return (
    <label className={`field ${disabled ? "is-disabled" : ""}`}>
      <span className="field-icon">
        <Icon name={icon} />
      </span>
      <input
        disabled={disabled}
        inputMode={inputMode}
        maxLength={maxLength}
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={label}
        type={inputType}
        value={value}
      />
      {secure ? (
        <button
          aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
          className="field-eye"
          onClick={() => setIsPasswordVisible((visible) => !visible)}
          type="button"
        >
          <Icon name={isPasswordVisible ? "eye-off" : "eye"} />
        </button>
      ) : null}
    </label>
  );
}

function SelectField({
  icon,
  label,
  onChange,
  options,
  value,
}: {
  icon: string;
  label: string;
  onChange: (value: string) => void;
  options: Array<{ icon: string; label: string; value: string }>;
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value);

  return (
    <div className={`field select-field ${isOpen ? "select-field-open" : ""}`}>
      <span className="field-icon">
        <Icon name={icon} />
      </span>
      <button
        aria-expanded={isOpen}
        className={selectedOption ? "select-trigger has-value" : "select-trigger"}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        {selectedOption?.label ?? label}
      </button>
      <button
        aria-label={isOpen ? "Fechar opções" : "Abrir opções"}
        className="select-chevron"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        ⌄
      </button>
      {isOpen ? (
        <div className="select-content" role="listbox">
          {options.map((option) => (
            <button
              aria-selected={value === option.value}
              className={value === option.value ? "select-option selected" : "select-option"}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              type="button"
            >
              <i aria-hidden="true">
                <Icon name={option.icon} />
              </i>
              <span>{option.label}</span>
              {value === option.value ? <b aria-hidden="true">✓</b> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RadioGroupField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  value: string;
}) {
  return (
    <fieldset className="radio-field">
      <legend>{label}</legend>
      <div>
        {options.map((option) => (
          <label className={value === option.value ? "radio-option selected" : "radio-option"} key={option.value}>
            <input
              checked={value === option.value}
              name={label}
              onChange={() => onChange(option.value)}
              type="radio"
              value={option.value}
            />
            <span aria-hidden="true" />
            <strong>{option.label}</strong>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskDate(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskCpf(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function maskCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  }
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

function maskPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function maskedDateToIso(value: string) {
  const digits = onlyDigits(value);
  if (digits.length !== 8) {
    return "";
  }
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() + 1 !== Number(month) ||
    date.getDate() !== Number(day)
  ) {
    return "";
  }

  return `${year}-${month}-${day}`;
}

function ActionButton({
  children,
  disabled = false,
  iconDirection = "right",
  onClick,
  secondary = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  iconDirection?: "left" | "right";
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button
      className={`${secondary ? "action secondary" : "action"} ${iconDirection === "left" ? "action-back" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {iconDirection === "left" ? <ActionIcon direction="left" /> : null}
      {children}
      {iconDirection === "right" ? <ActionIcon direction="right" /> : null}
    </button>
  );
}

function ActionIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <span aria-hidden="true" className="action-icon">
      <svg fill="none" viewBox="0 0 24 24">
        {direction === "left" ? (
          <>
            <path d="M19 12H6" />
            <path d="m11 6-6 6 6 6" />
          </>
        ) : (
          <>
            <path d="M5 12h13" />
            <path d="m13 6 6 6-6 6" />
          </>
        )}
      </svg>
    </span>
  );
}

function FormToast({ message, tone = "warning" }: { message?: string; tone?: "warning" | "success" }) {
  if (!message) {
    return null;
  }

  return (
    <div aria-live="polite" className={`form-toast is-${tone}`} role="status">
      <span aria-hidden="true">{tone === "success" ? "✓" : "!"}</span>
      <p>{message}</p>
    </div>
  );
}

function FooterNote() {
  return null;
}

function driverAvailabilityMessage(conflicts: Partial<Record<"email" | "cpf" | "whatsapp", boolean>>) {
  const blockedFields = [
    conflicts.cpf ? "CPF" : "",
    conflicts.whatsapp ? "WhatsApp" : "",
  ].filter(Boolean);

  if (blockedFields.length > 0) {
    return `${blockedFields.join(" e ")} já cadastrado em outra conta SUWAVE. Entre com a conta correta ou fale com o suporte para atualizar seus dados.`;
  }

  return "";
}

function Login({
  initialError,
  onClearInitialError,
  go,
  onAuthenticated,
}: {
  initialError?: string;
  onClearInitialError?: () => void;
  go: (screen: Screen) => void;
  onAuthenticated: (token: string) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const visibleError = error || initialError;

  async function resolveInvalidCredentialsMessage(isEmail: boolean) {
    try {
      const availability = await checkDriverAccountAvailability(
        isEmail ? { email: identifier.trim() } : { whatsapp: onlyDigits(identifier) },
      );
      const hasAccount = isEmail ? availability.conflicts.email : availability.conflicts.whatsapp;
      return hasAccount ? "Senha incorreta." : isEmail ? "E-mail não encontrado." : "WhatsApp não encontrado.";
    } catch {
      return "E-mail ou senha inválidos.";
    }
  }

  async function handleLogin() {
    onClearInitialError?.();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const isEmail = identifier.includes("@");
      const session = await loginDriverAccount({
        ...(isEmail ? { email: identifier.trim() } : { whatsapp: onlyDigits(identifier) }),
        password,
      });
      localStorage.setItem("suwave-driver-token", session.access_token);
      onAuthenticated(session.access_token);
      setSuccess(`Bem-vindo, ${session.user.full_name}.`);
      window.setTimeout(() => go("dashboard"), 650);
    } catch (err) {
      if (err instanceof DriverApiError && err.code === "invalid_credentials") {
        setError(await resolveInvalidCredentialsMessage(identifier.includes("@")));
        return;
      }
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="scroll-screen center-screen login-screen">
      <Image
        alt="SUWAVE Motorista"
        className="login-logo"
        height={150}
        priority
        src="/motorista/inicio-logo.png"
        width={520}
      />
      <div className="login-hero" aria-hidden="true">
        <Image
          alt=""
          className="login-hero-art"
          height={425}
          priority
          src="/motorista/inicio-carro-cidade.png"
          width={638}
        />
      </div>
      <Field icon="mail" label="E-mail ou WhatsApp" onChange={setIdentifier} value={identifier} />
      <Field icon="lock" label="Senha" onChange={setPassword} secure value={password} />
      <button className="link-button" onClick={() => go("forgot-password")} type="button">
        Esqueci minha senha
      </button>
      <FormToast message={success || visibleError} tone={success ? "success" : "warning"} />
      <ActionButton onClick={handleLogin}>{isSubmitting ? "Entrando..." : "Entrar"}</ActionButton>
      <ActionButton onClick={() => go("signup")} secondary>
        Cadastrar como motorista
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function ForgotPassword({
  go,
  setResetContact,
}: {
  go: (screen: Screen) => void;
  setResetContact: (contact: PasswordResetContact) => void;
}) {
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasEmail = email.trim().length > 0;
  const hasWhatsapp = onlyDigits(whatsapp).length > 0;

  async function handleSubmit() {
    setMessage("");
    const cleanEmail = email.trim();
    const cleanWhatsapp = onlyDigits(whatsapp);

    if (!cleanEmail && !cleanWhatsapp) {
      setMessage("Informe seu e-mail ou WhatsApp para redefinir sua senha.");
      return;
    }

    if (cleanEmail && cleanWhatsapp) {
      setMessage("Escolha apenas e-mail ou WhatsApp para continuar.");
      return;
    }

    setIsSubmitting(true);
    try {
      const contact = {
        ...(cleanEmail ? { email: cleanEmail } : {}),
        ...(cleanWhatsapp ? { whatsapp: cleanWhatsapp } : {}),
      };
      await requestDriverPasswordReset(contact);
      setResetContact(contact);
      go("forgot-success");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "E-mail ou WhatsApp não encontrado.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="scroll-screen center-screen login-screen forgot-password-screen">
      <Image
        alt="SUWAVE Motorista"
        className="login-logo"
        height={150}
        priority
        src="/motorista/inicio-logo.png"
        width={520}
      />
      <div className="login-hero" aria-hidden="true">
        <Image
          alt=""
          className="login-hero-art"
          height={425}
          priority
          src="/motorista/inicio-carro-cidade.png"
          width={638}
        />
      </div>
      <div className="forgot-copy">
        <p>Informe seu e-mail ou WhatsApp para redefinir sua senha</p>
      </div>
      <Field disabled={hasWhatsapp} icon="mail" label="E-mail" onChange={setEmail} type="email" value={email} />
      <Field
        disabled={hasEmail}
        icon="whatsapp"
        inputMode="tel"
        label="WhatsApp"
        onChange={(value) => setWhatsapp(maskPhone(value))}
        value={whatsapp}
      />
      <FormToast message={message} />
      <ActionButton onClick={handleSubmit}>{isSubmitting ? "Enviando..." : "Redefinir senha"}</ActionButton>
      <ActionButton iconDirection="left" onClick={() => go("login")} secondary>
        Voltar
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function ForgotPasswordSuccess({
  contact,
  go,
}: {
  contact: PasswordResetContact;
  go: (screen: Screen) => void;
}) {
  const [message, setMessage] = useState("");
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    if (!contact.email && !contact.whatsapp) {
      go("forgot-password");
      return;
    }

    setMessage("");
    setIsResending(true);
    try {
      await requestDriverPasswordReset(contact);
      setMessage("Link reenviado com sucesso.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não foi possível reenviar o link.");
    } finally {
      setIsResending(false);
    }
  }

  return (
    <section className="scroll-screen center-screen login-screen forgot-success-screen">
      <Image
        alt="SUWAVE Motorista"
        className="login-logo"
        height={150}
        priority
        src="/motorista/inicio-logo.png"
        width={520}
      />
      <div className="login-hero" aria-hidden="true">
        <Image
          alt=""
          className="login-hero-art"
          height={425}
          priority
          src="/motorista/inicio-carro-cidade.png"
          width={638}
        />
      </div>
      <div className="success-check" aria-hidden="true">
        <Icon name="check" />
      </div>
      <div className="forgot-success-copy">
        <h1>Enviado com sucesso</h1>
        <p>
          Enviamos um link para redefinir sua senha.
          <br />
          Você tem 24 horas para usar o link enviado.
          <br />
          Verifique seu e-mail ou WhatsApp.
        </p>
      </div>
      <FormToast message={message} />
      <ActionButton iconDirection="left" onClick={() => go("login")}>Voltar para entrar</ActionButton>
      <ActionButton disabled={isResending} onClick={handleResend} secondary>
        {isResending ? "Reenviando..." : "Reenviar link"}
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function Signup({
  form,
  go,
  setForm,
  setSignupStep,
  signupStep,
}: {
  form: DriverSignupForm;
  go: (screen: Screen) => void;
  setForm: (form: DriverSignupForm) => void;
  setSignupStep: (step: number) => void;
  signupStep: number;
}) {
  const [error, setError] = useState("");
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  function updateField(field: keyof DriverSignupForm, value: string | boolean) {
    setForm({ ...form, [field]: value });
  }

  function validateAccountStep() {
    setError("");
    if (!form.full_name.trim()) {
      setError("Informe seu nome completo.");
      return false;
    }
    if (!form.birth_date.trim()) {
      setError("Informe sua data de nascimento.");
      return false;
    }
    if (!form.email.trim()) {
      setError("Informe seu e-mail.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Informe um e-mail válido.");
      return false;
    }
    if (!form.password.trim()) {
      setError("Informe uma senha.");
      return false;
    }
    if (form.password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return false;
    }
    if (form.password !== form.confirm_password) {
      setError("As senhas precisam ser iguais.");
      return false;
    }
    const birthDateIso = maskedDateToIso(form.birth_date);

    if (!birthDateIso) {
      setError("Informe a data no formato DD/MM/AAAA.");
      return false;
    }
    if (!form.gender) {
      setError("Selecione seu sexo.");
      return false;
    }

    return true;
  }

  async function validateAvailability(input: { cpf?: string; email?: string; whatsapp?: string }) {
    const availability = await checkDriverAccountAvailability(input);
    const message = driverAvailabilityMessage(availability.conflicts);

    if (availability.conflicts.cpf || availability.conflicts.whatsapp) {
      throw new Error(message);
    }

    return message;
  }

  async function handleNextSignupStep() {
    if (!validateAccountStep()) {
      return;
    }

    setError("");
    setSignupStep(2);
  }

  async function handleContinue() {
    if (!validateAccountStep()) {
      return;
    }

    setError("");
    const cpf = onlyDigits(form.cpf);
    const cnpj = onlyDigits(form.cnpj);
    const whatsapp = onlyDigits(form.whatsapp);

    if (cpf.length !== 11) {
      setError("Informe um CPF com 11 números.");
      return;
    }
    if (cnpj && cnpj.length !== 14) {
      setError("Informe um CNPJ com 14 números.");
      return;
    }
    if (whatsapp.length < 10) {
      setError("Informe um WhatsApp com DDD.");
      return;
    }
    if (!form.pix_key_type) {
      setError("Selecione o tipo da chave Pix.");
      return;
    }
    if (!form.pix_account.trim()) {
      setError("Informe a conta Pix.");
      return;
    }

    setIsCheckingAvailability(true);
    try {
      const email = form.email.trim().toLowerCase();
      const availabilityMessage = await validateAvailability({ cpf, email, whatsapp });
      setError(availabilityMessage);
      if (!availabilityMessage) {
        go("terms");
      }
    } catch (err) {
      if (err instanceof DriverApiError && err.code === "internal_error") {
        setError("");
        go("terms");
        return;
      }

      setError(err instanceof Error ? err.message : "Não foi possível validar os dados agora.");
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  function handleBack() {
    if (isCheckingAvailability) {
      return;
    }

    if (signupStep === 1) {
      go("login");
    } else {
      setSignupStep(1);
    }
  }

  return (
    <section className="scroll-screen">
      <BrandLockup compact />
      <Progress current={signupStep} total={primarySteps} />
      <h1 className="signup-title">Cadastro do motorista</h1>
      <p className="subtitle signup-subtitle">
        {signupStep === 1 ? "Preencha seus dados" : "Dados de contato e Pix"}
      </p>
      <div className="form-stack">
        {signupStep === 1 ? (
          <>
            <Field icon="user" label="Nome completo" onChange={(value) => updateField("full_name", value)} value={form.full_name} />
            <Field
              icon="calendar"
              inputMode="numeric"
              label="Data de nascimento"
              maxLength={10}
              onChange={(value) => updateField("birth_date", maskDate(value))}
              value={form.birth_date}
            />
            <RadioGroupField
              label="Sexo"
              onChange={(value) => updateField("gender", value)}
              options={[
                { label: "Masculino", value: "masculino" },
                { label: "Feminino", value: "feminino" },
                { label: "Outros", value: "outros" },
              ]}
              value={form.gender}
            />
            <Field icon="mail" label="E-mail" onChange={(value) => updateField("email", value)} type="email" value={form.email} />
            <Field icon="lock" label="Senha" onChange={(value) => updateField("password", value)} secure value={form.password} />
            <Field
              icon="lock"
              label="Confirmar senha"
              onChange={(value) => updateField("confirm_password", value)}
              secure
              value={form.confirm_password}
            />
          </>
        ) : (
          <>
            <Field
              icon="phone"
              inputMode="tel"
              label="WhatsApp"
              maxLength={15}
              onChange={(value) => updateField("whatsapp", maskPhone(value))}
              value={form.whatsapp}
            />
            <Field
              icon="briefcase"
              inputMode="numeric"
              label="CNPJ (opcional)"
              maxLength={18}
              onChange={(value) => updateField("cnpj", maskCnpj(value))}
              value={form.cnpj}
            />
            <Field
              icon="id"
              inputMode="numeric"
              label="CPF"
              maxLength={14}
              onChange={(value) => updateField("cpf", maskCpf(value))}
              value={form.cpf}
            />
            <SelectField
              icon="pix"
              label="Selecione tipo Pix"
              onChange={(value) => updateField("pix_key_type", value)}
              options={[
                { label: "E-mail", value: "email", icon: "mail" },
                { label: "Telefone", value: "phone", icon: "phone" },
                { label: "CPF", value: "cpf", icon: "id" },
                { label: "CNPJ", value: "cnpj", icon: "briefcase" },
                { label: "Chave aleatória", value: "random", icon: "spark" },
              ]}
              value={form.pix_key_type}
            />
            <Field
              icon="pix"
              label="Conta Pix"
              onChange={(value) => updateField("pix_account", value)}
              value={form.pix_account}
            />
          </>
        )}
      </div>
      <FormToast message={error} />
      {signupStep === 1 ? (
        <ActionButton disabled={isCheckingAvailability} onClick={handleNextSignupStep}>
          {isCheckingAvailability ? "Validando..." : "Continuar"}
        </ActionButton>
      ) : (
        <ActionButton disabled={isCheckingAvailability} onClick={handleContinue}>
          {isCheckingAvailability ? "Validando..." : "Continuar"}
        </ActionButton>
      )}
      <button className="plain-back" disabled={isCheckingAvailability} onClick={handleBack} type="button">
        Voltar
      </button>
      <FooterNote />
    </section>
  );
}

const fallbackDriverTerms: DriverTerms = {
  body:
    "A SUWAVE Motorista conecta motoristas e passageiros em cidades pequenas e regiões próximas. Devido às diferentes legislações municipais, necessidades operacionais e regras locais, este Termo de Uso poderá ser complementado por um termo específico da cidade de atuação do motorista, quando necessário.",
  document_key: "driver_terms",
  id: null,
  privacy_url: "/more",
  title: "Termos de uso",
  updated_at: null,
  version: 1,
};

function TermsScreen({
  form,
  go,
  setForm,
}: {
  form: DriverSignupForm;
  go: (screen: Screen) => void;
  setForm: (form: DriverSignupForm) => void;
}) {
  const [error, setError] = useState("");
  const [terms, setTerms] = useState<DriverTerms>(fallbackDriverTerms);

  useEffect(() => {
    let active = true;

    getDriverTerms()
      .then((document) => {
        if (active) {
          setTerms(document);
        }
      })
      .catch(() => {
        if (active) {
          setTerms(fallbackDriverTerms);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function updateField(field: "accepted_terms" | "accepted_privacy", value: boolean) {
    setForm({ ...form, [field]: value });
  }

  function handleContinue() {
    setError("");

    if (!form.accepted_terms || !form.accepted_privacy) {
      setError("Marque os dois aceites para continuar.");
      return;
    }

    go("face");
  }

  return (
    <section className="scroll-screen terms-screen">
      <header className="terms-header">
        <button aria-label="Voltar" onClick={() => go("signup")} type="button">
          <Icon name="arrow-left" />
        </button>
        <h1>{terms.title}</h1>
        <span aria-hidden="true" />
      </header>
      <div className="terms-card">
        <p>{terms.body}</p>
      </div>
      <p className="terms-privacy">
        É importante também que você leia a nossa{" "}
        <a href={terms.privacy_url || "/more"} target="_blank" rel="noreferrer">
          Política de Privacidade
        </a>
        .
      </p>
      <label className="terms-row">
        <input
          checked={form.accepted_terms}
          onChange={(event) => updateField("accepted_terms", event.target.checked)}
          type="checkbox"
        />
        <span>
          Eu li, <strong>entendi e concordo</strong> com os Termos de Uso e Política de Privacidade.
        </span>
      </label>
      <label className="terms-row">
        <input
          checked={form.accepted_privacy}
          onChange={(event) => updateField("accepted_privacy", event.target.checked)}
          type="checkbox"
        />
        <span>Concordo com o tratamento dos dados pessoais disponibilizados, nos termos da LGPD.</span>
      </label>
      <FormToast message={error} />
      <ActionButton onClick={handleContinue}>Continuar</ActionButton>
    </section>
  );
}

function FacePhoto({
  faceFile,
  go,
  onBack,
  setFaceFile,
}: {
  faceFile?: File;
  go: (screen: Screen) => void;
  onBack: () => void;
  setFaceFile: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  function stopCamera() {
    cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    cameraStreamRef.current = null;
    setIsCameraActive(false);
    setIsCameraReady(false);
  }

  function clearPreview() {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return "";
    });
  }

  async function startCamera() {
    setError("");
    setCameraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("A câmera não está disponível neste navegador. Use o botão de escolher foto.");
      return;
    }

    try {
      stopCamera();
      clearPreview();
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });

      cameraStreamRef.current = stream;
      setIsCameraActive(true);
    } catch {
      setCameraError("Não foi possível abrir a câmera. Verifique a permissão do navegador.");
    }
  }

  function updatePreview(file: File) {
    setPreviewUrl((currentUrl) => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }

      return URL.createObjectURL(file);
    });
  }

  function handleFaceFile(file?: File) {
    if (!file) {
      setError("Selecione uma foto do rosto para continuar.");
      return;
    }

    setError("");
    setCameraError("");
    updatePreview(file);
    setFaceFile(file);
    stopCamera();
  }

  function handleCaptureFace() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !isCameraReady) {
      setError("Aguarde a câmera carregar para tirar a foto.");
      return;
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setError("Não foi possível capturar a imagem da câmera.");
      return;
    }

    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")?.drawImage(video, 0, 0, width, height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Não foi possível salvar a foto capturada.");
          return;
        }

        handleFaceFile(new File([blob], `rosto-motorista-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }

  function handleNext() {
    if (!faceFile) {
      setError("Selecione uma foto do rosto para continuar.");
      return;
    }

    setError("");
    go("cnh");
  }

  useEffect(() => {
    return () => {
      cameraStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const stream = cameraStreamRef.current;

    if (!isCameraActive || !video || !stream) {
      return;
    }

    video.srcObject = stream;
    void video.play().catch(() => {
      setCameraError("A câmera abriu, mas o navegador não iniciou a prévia. Toque em Abrir câmera novamente.");
      setIsCameraReady(false);
    });
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <section className="scroll-screen face-screen">
      <header className="face-flow-header">
        <button aria-label="Voltar" onClick={onBack} type="button">
          <Icon name="arrow-left" />
        </button>
        <p>Cadastro do motorista</p>
        <span aria-hidden="true" />
      </header>
      <Progress current={3} total={primarySteps} />
      <h1>Validar foto do rosto</h1>
      <p className="subtitle">Tire uma foto nitida do seu rosto</p>
      <div className={previewUrl ? "face-card has-photo" : isCameraActive ? "face-card live" : "face-card"}>
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img alt="Foto capturada do rosto" className="face-preview-photo" src={previewUrl} />
        ) : isCameraActive ? (
          <video
            aria-label="Câmera frontal para foto do rosto"
            autoPlay
            className="face-camera-video"
            muted
            onCanPlay={() => setIsCameraReady(true)}
            playsInline
            ref={videoRef}
          />
        ) : (
          <Image
            alt="Modelo de posicionamento correto do rosto"
            className="face-reference-photo"
            height={1024}
            priority
            src="/face-validation-model.png"
            width={1024}
          />
        )}
        <div className="face-oval" />
      </div>
      <div className="face-tips">
        <span className="tip">
          <Icon name="spark" /> Boa iluminação
        </span>
        <span className="tip">
          <Icon name="user" /> Rosto centralizado
        </span>
        <span className="tip">
          <Icon name="ban" /> Sem acessórios
        </span>
      </div>
      <canvas aria-hidden="true" className="face-capture-canvas" ref={canvasRef} />
      {faceFile ? (
        <div className="success-line">
          <span>✓</span>
          Foto válida! Sua foto está nítida e bem enquadrada.
        </div>
      ) : null}
      {cameraError ? <p className="camera-error">{cameraError}</p> : null}
      <input
        accept="image/*"
        capture="user"
        hidden
        onChange={(event) => handleFaceFile(event.target.files?.[0])}
        ref={fileInputRef}
        type="file"
      />
      <FormToast message={error} />
      {isCameraActive ? (
        <ActionButton disabled={!isCameraReady} onClick={handleCaptureFace}>
          Tirar foto
        </ActionButton>
      ) : faceFile ? (
        <>
          <ActionButton onClick={handleNext}>Próximo</ActionButton>
          <div className="face-retake-actions">
            <button onClick={startCamera} type="button">
              <Icon name="camera" />
              Tirar outra
            </button>
            <button onClick={() => fileInputRef.current?.click()} type="button">
              <Icon name="user" />
              Escolher outra
            </button>
          </div>
        </>
      ) : (
        <>
          <ActionButton onClick={startCamera}>Abrir câmera</ActionButton>
          <ActionButton onClick={() => fileInputRef.current?.click()} secondary>
            Escolher foto
          </ActionButton>
        </>
      )}
      <p className="security">▣ Suas fotos são protegidas e usadas apenas para verificação de segurança.</p>
      <FooterNote />
    </section>
  );
}

function Cnh({
  cnhBack,
  cnhFront,
  faceFile,
  go,
  onAuthenticated,
  resetFlow,
  setCnhBack,
  setCnhFront,
  signupForm,
}: {
  cnhBack?: File;
  cnhFront?: File;
  faceFile?: File;
  go: (screen: Screen) => void;
  onAuthenticated: (token: string) => void;
  resetFlow: () => void;
  setCnhBack: (file: File) => void;
  setCnhFront: (file: File) => void;
  signupForm: DriverSignupForm;
}) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [submitStep, setSubmitStep] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleUpload(file: File | undefined, side: "front" | "back") {
    if (!file) {
      setError("Selecione a imagem da CNH.");
      return;
    }

    setError("");
    if (side === "front") {
      setCnhFront(file);
    } else {
      setCnhBack(file);
    }
  }

  async function handleFinish() {
    if (!faceFile) {
      setError("Envie a foto do rosto antes de finalizar.");
      return;
    }
    if (!cnhFront || !cnhBack) {
      setError("Envie frente e verso da CNH antes de finalizar.");
      return;
    }

    const birthDateIso = maskedDateToIso(signupForm.birth_date);
    const cpf = onlyDigits(signupForm.cpf);
    const cnpj = onlyDigits(signupForm.cnpj);
    const whatsapp = onlyDigits(signupForm.whatsapp);

    setIsSubmitting(true);
    setSubmitStep("Criando sua conta...");
    setError("");
    try {
      const email = signupForm.email.trim().toLowerCase();
      let session;

      try {
        session = await registerDriverAccount({
          birth_date: birthDateIso || undefined,
          email,
          full_name: signupForm.full_name,
          gender: signupForm.gender,
          password: signupForm.password,
        });
      } catch (err) {
        if (!(err instanceof DriverApiError)) {
          throw err;
        }

        if (err.code !== "email_already_exists") {
          throw err;
        }

        try {
          session = await loginDriverAccount({
            email,
            password: signupForm.password,
          });
        } catch (loginErr) {
          if (loginErr instanceof DriverApiError && loginErr.code === "invalid_credentials") {
            throw new Error("Este e-mail já existe em outro app SUWAVE. Para juntar as contas, informe a senha dessa conta ou recupere a senha.");
          }

          throw loginErr;
        }
      }

      localStorage.setItem("suwave-driver-token", session.access_token);
      onAuthenticated(session.access_token);

      setSubmitStep("Salvando seus dados...");
      await saveDriverProfile(session.access_token, {
        birth_date: birthDateIso || undefined,
        cnpj,
        cpf,
        email,
        full_name: signupForm.full_name,
        gender: signupForm.gender,
        phone: whatsapp,
        pix_account: signupForm.pix_account.trim(),
        pix_key_type: signupForm.pix_key_type,
      });

      setSubmitStep("Enviando foto do rosto...");
      const faceUpload = await uploadDriverImage(session.access_token, faceFile, "driver_face");
      await saveDriverFacePhoto(session.access_token, faceUpload);

      setSubmitStep("Enviando CNH...");
      const [cnhFrontUpload, cnhBackUpload] = await Promise.all([
        uploadDriverImage(session.access_token, cnhFront, "driver_cnh"),
        uploadDriverImage(session.access_token, cnhBack, "driver_cnh"),
      ]);
      await saveDriverCnh(session.access_token, {
        cnh_back_file_id: cnhBackUpload.storage_file_id,
        cnh_back_url: cnhBackUpload.url,
        cnh_front_file_id: cnhFrontUpload.storage_file_id,
        cnh_front_url: cnhFrontUpload.url,
      });
      setSubmitStep("Enviando para análise...");
      await submitDriverReview(session.access_token);
      resetFlow();
      go("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível finalizar o cadastro.");
    } finally {
      setIsSubmitting(false);
      setSubmitStep("");
    }
  }

  return (
    <section className="scroll-screen cnh-screen">
      <p className="eyebrow">Cadastro do motorista</p>
      <Progress current={4} total={primarySteps} />
      <h1>Enviar CNH</h1>
      <p className="subtitle">Envie imagens nitidas do documento</p>
      <div className="upload-card">
        <strong>Frente da CNH</strong>
        <div className="doc-preview cnh-front">
          <i />
          <b />
          <span />
        </div>
        <span>{cnhFront ? "✓ Selecionado" : "Pendente"}</span>
        <input
          accept="image/*,.pdf"
          hidden
          onChange={(event) => handleUpload(event.target.files?.[0], "front")}
          ref={frontInputRef}
          type="file"
        />
        <button onClick={() => frontInputRef.current?.click()} type="button">
          <Icon name="camera" />
          {cnhFront ? "Trocar imagem" : "Enviar imagem"}
        </button>
      </div>
      <div className="upload-card">
        <strong>Verso da CNH</strong>
        <div className="doc-preview cnh-back">
          <i />
          <b />
        </div>
        <span>{cnhBack ? "✓ Selecionado" : "Pendente"}</span>
        <input
          accept="image/*,.pdf"
          hidden
          onChange={(event) => handleUpload(event.target.files?.[0], "back")}
          ref={backInputRef}
          type="file"
        />
        <button onClick={() => backInputRef.current?.click()} type="button">
          <Icon name="camera" />
          {cnhBack ? "Trocar imagem" : "Enviar imagem"}
        </button>
      </div>
      <p className="info-line">ⓘ Verifique se todos os dados estão legíveis</p>
      <FormToast message={error} />
      <ActionButton disabled={isSubmitting} onClick={handleFinish}>
        {isSubmitting ? submitStep || "Concluindo..." : "Concluir cadastro"}
      </ActionButton>
      <ActionButton iconDirection="left" onClick={() => go("face")} secondary>
        Voltar
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function Submitted({ go }: { go: (screen: Screen) => void }) {
  return (
    <section className="scroll-screen submitted-screen">
      <button aria-label="Voltar" className="submitted-back" onClick={() => go("cnh")} type="button">
        <FiArrowLeft aria-hidden="true" />
      </button>

      <div className="submitted-hero">
        <div className="submitted-copy">
          <h1>Cadastro enviado para análise</h1>
          <p>Todos os dados foram recebidos com sucesso.</p>
        </div>
        <div className="submitted-car-art" aria-hidden="true">
          <Image
            alt=""
            className="submitted-car-image"
            height={425}
            src="/motorista/cadastro-analise-carro.png"
            width={638}
          />
        </div>
      </div>

      <div className="checklist submitted-checklist">
        <span><Icon name="check" /> Cadastro do motorista concluído</span>
        <span><Icon name="check" /> Escolha da modalidade concluída</span>
        <span><Icon name="check" /> CNH enviada</span>
        <span><Icon name="check" /> Termos e Política aceitos</span>
      </div>

      <div className="submitted-analysis-card">
        <span aria-hidden="true" className="submitted-shield">
          <Icon name="shield" />
        </span>
        <div>
          <strong>Seu cadastro está em análise.</strong>
          <p>Nossa equipe fará a avaliação e em breve entrará em contato.</p>
        </div>
      </div>

      <button className="submitted-home-button" onClick={() => go("login")} type="button">
        <Icon name="home" />
        <span>Voltar ao início</span>
      </button>
    </section>
  );
}

const reviewMissingLabels: Record<string, string> = {
  cnh_back: "verso da CNH",
  cnh_front: "frente da CNH",
  cnpj: "CNPJ",
  cpf: "CPF",
  email: "e-mail",
  face_photo: "foto do rosto",
  full_name: "nome completo",
  gender: "sexo",
  pix_account: "conta Pix",
  pix_key_type: "tipo de chave Pix",
};

const reviewApprovalWindowSeconds = 10 * 60;

function formatReviewTime(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function Status({
  go,
  token,
}: {
  go: (screen: Screen) => void;
  token?: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(reviewApprovalWindowSeconds);
  const [statusText, setStatusText] = useState("EM_ANALISE");
  const [error, setError] = useState("");
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const minutesLeft = Math.ceil(secondsLeft / 60);
  const timeLeft = formatReviewTime(secondsLeft);
  const progress = Math.max(0, Math.min(1, secondsLeft / reviewApprovalWindowSeconds));

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function syncReviewStatus() {
      try {
        const status = await getDriverReviewStatus(token as string);
        if (cancelled) {
          return;
        }
        setStatusText(status.status);
        setSecondsLeft(status.seconds_remaining);
        setMissingFields(status.missing);
        if (status.approved) {
          go("dashboard");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não foi possível consultar o status.");
        }
      }
    }

    syncReviewStatus();
    const interval = window.setInterval(syncReviewStatus, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [go, token]);

  useEffect(() => {
    if (secondsLeft <= 0 && statusText === "APROVADO") {
      go("dashboard");
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [go, secondsLeft, statusText]);

  return (
    <section className="scroll-screen center-screen">
      <BrandLockup />
      <div
        className="review-ring"
        style={{ "--review-progress": `${progress * 360}deg` } as React.CSSProperties}
      >
        <strong>{minutesLeft}</strong>
        <span>min</span>
      </div>
      <h1>Cadastro em análise</h1>
      <p className="review-time">
        Faltam <strong>{timeLeft}</strong> para liberar
      </p>
      <p className="subtitle">Estamos verificando seus dados. A liberação automática segue a regra de 10 minutos.</p>
      <FormToast
        message={
          error ||
          (missingFields.length
            ? `Pendências: ${missingFields.map((field) => reviewMissingLabels[field] ?? field).join(", ")}.`
            : "")
        }
      />
      <div className="checklist">
        <span>✓ Telefone confirmado</span>
        <span>✓ Foto recebida</span>
        <span>✓ CNH enviada</span>
        <span>○ Veículo pode ser completado depois</span>
      </div>
      <ActionButton onClick={() => go("dashboard")}>Aguardo aprovação</ActionButton>
      <ActionButton onClick={() => go("submitted")} secondary>
        Ver meus dados
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function getCurrentPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Seu navegador não liberou localização."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 15000,
      timeout: 12000,
    });
  });
}

async function sendCurrentDriverLocation(token: string) {
  const position = await getCurrentPosition();
  await pingDriverLocation(token, {
    accuracy_meters: position.coords.accuracy,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  });
  return {
    accuracy_meters: position.coords.accuracy,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

function getMapTileUrl(x: number, y: number, z: number) {
  return mapTileUrlTemplate.replace("{x}", String(x)).replace("{y}", String(y)).replace("{z}", String(z));
}

function locationToTilePoint(location: DriverMapLocation, zoom: number) {
  const scale = 2 ** zoom;
  const latRad = (location.latitude * Math.PI) / 180;
  return {
    x: ((location.longitude + 180) / 360) * scale,
    y: ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale,
  };
}

function getMapTiles(location: DriverMapLocation, zoom: number) {
  const center = locationToTilePoint(location, zoom);
  const centerX = Math.floor(center.x);
  const centerY = Math.floor(center.y);
  const scale = 2 ** zoom;
  const tiles = [];

  for (let yOffset = -2; yOffset <= 2; yOffset += 1) {
    for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
      const x = centerX + xOffset;
      const y = Math.min(Math.max(centerY + yOffset, 0), scale - 1);
      const wrappedX = ((x % scale) + scale) % scale;

      tiles.push({
        key: `${zoom}-${wrappedX}-${y}`,
        left: `calc(50% + ${(x - center.x) * 256}px)`,
        top: `calc(var(--map-focus-y) + ${(y - center.y) * 256}px)`,
        url: getMapTileUrl(wrappedX, y, zoom),
      });
    }
  }

  return tiles;
}

function positionToDriverMapLocation(position: GeolocationPosition) {
  return {
    accuracy_meters: position.coords.accuracy,
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
  };
}

async function fetchDriverMapPlace(location: DriverMapLocation) {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lng: String(location.longitude),
  });
  const response = await fetch(`/api/maps/reverse?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Não foi possível consultar o mapa agora.");
  }

  return (await response.json()) as DriverMapPlace;
}

async function searchDriverRoutePlaces(query: string) {
  const response = await fetch(`/api/maps/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error("Não foi possível buscar destinos agora.");
  }

  const body = (await response.json()) as { places?: DriverRoutePlace[] };
  return body.places ?? [];
}

async function fetchDriverRoute(origin: DriverRouteCoordinate, destination: DriverRouteCoordinate) {
  const response = await fetch("/api/maps/route", {
    body: JSON.stringify({ destination, origin }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Não foi possível calcular a rota agora.");
  }

  return (await response.json()) as DriverRouteSummary;
}

function formatDriverMapPlace(place: DriverMapPlace | null) {
  if (!place) {
    return "Brasil";
  }

  if (place.locality && place.region) {
    return `${place.locality}, ${place.region}`;
  }

  return place.label ?? place.locality ?? place.region ?? "Brasil";
}

function formatDriverRoutePlace(place: DriverRoutePlace) {
  if (place.locality && place.region) {
    return `${place.locality}, ${place.region}`;
  }

  return place.label;
}

function dateToLocalInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToInputDate(value: string, days: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  date.setDate(date.getDate() + days);
  return dateToLocalInputValue(date);
}

function formatTripDistanceKm(distanceKm?: number | null) {
  if (!distanceKm || distanceKm <= 0) {
    return "-- km";
  }

  return `${distanceKm.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
}

function formatTripDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) {
    return "--";
  }

  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

function getLoadedGoogleMaps() {
  if (typeof window === "undefined") {
    return null;
  }

  return (window as Window & { google?: { maps?: GoogleMapsNamespace } }).google?.maps ?? null;
}

function loadGoogleMaps() {
  const loadedMaps = getLoadedGoogleMaps();

  if (loadedMaps) {
    return Promise.resolve(loadedMaps);
  }

  if (!googleMapsApiKey) {
    return Promise.reject(new Error("Google Maps API key não configurada."));
  }

  if (googleMapsScriptPromise) {
    return googleMapsScriptPromise;
  }

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("google-maps-sdk");

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        const maps = getLoadedGoogleMaps();
        if (maps) {
          resolve(maps);
          return;
        }
        reject(new Error("Google Maps não carregou."));
      });
      existingScript.addEventListener("error", () => reject(new Error("Google Maps não carregou.")));
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.defer = true;
    script.id = "google-maps-sdk";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsApiKey)}&v=weekly&language=pt-BR&region=BR`;
    script.addEventListener("load", () => {
      const maps = getLoadedGoogleMaps();
      if (maps) {
        resolve(maps);
        return;
      }
      reject(new Error("Google Maps não carregou."));
    });
    script.addEventListener("error", () => reject(new Error("Google Maps não carregou.")));

    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function OpenStreetMapLayer({
  location,
  zoom,
}: {
  location: DriverMapLocation;
  zoom: number;
}) {
  const mapTiles = getMapTiles(location, zoom);

  return (
    <>
      <div className="map-tile-layer" aria-hidden="true">
        {mapTiles.map((tile) => (
          <span
            className="map-tile"
            key={tile.key}
            style={{
              backgroundImage: `url(${tile.url})`,
              left: tile.left,
              top: tile.top,
            }}
          />
        ))}
      </div>
      <span
        className="location-accuracy"
        style={
          {
            "--accuracy-size": `${Math.min(Math.max(location.accuracy_meters ?? 80, 55), 132)}px`,
          } as React.CSSProperties
        }
      />
      <span className="pin">
        <span />
      </span>
      <span className="car-dot one" />
      <span className="car-dot two" />
      <span className="car-dot three" />
    </>
  );
}

function GoogleDriverMap({
  layer,
  location,
  onFallback,
  onZoomChange,
  zoom,
}: {
  layer: DriverMapLayer;
  location: DriverMapLocation;
  onFallback: () => void;
  onZoomChange: (zoom: number) => void;
  zoom: number;
}) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markerRef = useRef<GoogleMarker | null>(null);
  const accuracyRef = useRef<GoogleCircle | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        const maps = await loadGoogleMaps();
        const element = mapElementRef.current;

        if (cancelled || !element || mapRef.current) {
          return;
        }

        const center = { lat: location.latitude, lng: location.longitude };
        const map = new maps.Map(element, {
          center,
          clickableIcons: false,
          disableDefaultUI: true,
          fullscreenControl: false,
          gestureHandling: "greedy",
          mapTypeId: layer,
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          zoom,
          zoomControl: false,
        });

        map.addListener("zoom_changed", () => {
          const nextZoom = map.getZoom();
          if (typeof nextZoom === "number") {
            onZoomChange(Math.min(Math.max(nextZoom, minDriverMapZoom), maxDriverMapZoom));
          }
        });

        mapRef.current = map;
        markerRef.current = new maps.Marker({
          map,
          optimized: true,
          position: center,
          title: "Sua localização",
        });
        accuracyRef.current = new maps.Circle({
          center,
          fillColor: "#1a8dff",
          fillOpacity: 0.12,
          map,
          radius: Math.max(location.accuracy_meters ?? 80, 35),
          strokeColor: "#1a8dff",
          strokeOpacity: 0.58,
          strokeWeight: 2,
        });
      } catch {
        if (!cancelled) {
          onFallback();
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, [layer, location.accuracy_meters, location.latitude, location.longitude, onFallback, onZoomChange, zoom]);

  useEffect(() => {
    const center = { lat: location.latitude, lng: location.longitude };
    mapRef.current?.setCenter(center);
    markerRef.current?.setPosition(center);
    accuracyRef.current?.setCenter(center);
    accuracyRef.current?.setRadius(Math.max(location.accuracy_meters ?? 80, 35));
  }, [location]);

  useEffect(() => {
    mapRef.current?.setZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    mapRef.current?.setMapTypeId(layer);
  }, [layer]);

  return <div className="google-map-host" ref={mapElementRef} />;
}

function formatRideDistance(distance?: number | null) {
  if (distance == null) {
    return "Distância não calculada";
  }
  if (distance < 1000) {
    return `${distance} m`;
  }
  return `${(distance / 1000).toFixed(1).replace(".", ",")} km`;
}

function formatRideTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Agora";
  }
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDriverPhone(value?: string | null) {
  const digits = onlyDigits(value ?? "");

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return value || "Não informado";
}

function getVehicleImageUrl(vehicle?: DriverProfile["vehicles"][number]) {
  return vehicle?.front_photo_url || vehicle?.side_photo_url || vehicle?.rear_photo_url || vehicle?.interior_photo_url || "";
}

function getDriverFacePhotoUrl(profile?: DriverProfile | null) {
  return profile?.documents?.face_photo_url || profile?.face_photo_url || "";
}

function getVehicleStatusLabel(status?: string | null) {
  if (!status) {
    return "Em análise";
  }

  switch (status.toUpperCase()) {
    case "APROVADO":
      return "Ativo";
    case "REJEITADO":
      return "Reprovado";
    case "PENDENTE":
      return "Em análise";
    default:
      return status;
  }
}

function formatVehicleYear(value?: string | number | null) {
  if (value == null || value === "") {
    return "Não informado";
  }

  return String(value);
}

function ProfileRow({ detail, icon, label }: { detail: string; icon: string; label: string }) {
  return (
    <button className="profile-row" type="button">
      <span className={`profile-row-icon ${icon}`}>
        <Icon name={icon} />
      </span>
      <span>
        <strong>{label}</strong>
        <small>{detail}</small>
      </span>
      <FiChevronRight aria-hidden="true" className="profile-chevron" />
    </button>
  );
}

function DriverProfileScreen({
  go,
  onLogout,
  token,
}: {
  go: (screen: Screen) => void;
  onLogout: () => void;
  token?: string;
}) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [error, setError] = useState("");
  const vehicle = profile?.vehicles[0];
  const vehicleImageUrl = getVehicleImageUrl(vehicle);
  const facePhotoUrl = getDriverFacePhotoUrl(profile);

  function handleRefreshProfile() {
    if (!token) {
      return;
    }

    void getDriverProfile(token)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Não foi possível atualizar seus dados."));
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const nextProfile = await getDriverProfile(token as string);
        if (!cancelled) {
          setProfile(nextProfile);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não foi possível carregar seu perfil.");
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="scroll-screen driver-profile-screen">
      <header className="profile-header">
        <button aria-label="Voltar" onClick={() => go("dashboard")} type="button">
          <FiArrowLeft aria-hidden="true" />
        </button>
        <h1>Perfil do motorista</h1>
        <button aria-label="Editar perfil" type="button">
          <FiEdit3 aria-hidden="true" />
        </button>
      </header>

      <div className="profile-avatar-wrap">
        <div className="profile-avatar">
          {facePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={facePhotoUrl} />
          ) : (
            <Icon name="user" />
          )}
        </div>
        <span className="profile-camera" aria-hidden="true">
          <FiCamera />
        </span>
      </div>

      <div className="profile-name">
        <h2>{profile?.full_name || "Motorista SUWAVE"} <FiCheckCircle aria-hidden="true" /></h2>
        <p>Motorista parceiro</p>
      </div>

      <button className="profile-alert" type="button">
        <span aria-hidden="true">i</span>
        <strong>Mantenha seus dados atualizados</strong>
        <small>Informações atualizadas garantem mais segurança e melhor experiência.</small>
        <FiChevronRight aria-hidden="true" className="profile-chevron" />
      </button>

      <div className="profile-section-title">
        <span><Icon name="car" /></span>
        <strong>Meus veículos</strong>
        {profile?.vehicles.length ? <button type="button">Ver todos <FiChevronRight aria-hidden="true" /></button> : null}
      </div>

      {vehicle ? (
        <button className="profile-vehicle-card" type="button">
          <span className="profile-vehicle-image">
            {vehicleImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="" src={vehicleImageUrl} />
            ) : (
              <Image alt="" height={425} src="/motorista/inicio-carro-cidade.png" width={638} />
            )}
          </span>
          <span>
            <strong>{[vehicle.model, vehicle.year].filter(Boolean).join(" ") || `${vehicle.brand} ${vehicle.model}`}</strong>
            <small>{vehicle.color || vehicle.brand}</small>
            <em>{vehicle.plate || "Placa pendente"} 🇧🇷</em>
          </span>
          <FiChevronRight aria-hidden="true" className="profile-chevron vehicle" />
        </button>
      ) : (
        <button className="profile-add-vehicle-card" onClick={() => go("vehicle-mode")} type="button">
          <span className="profile-add-vehicle-image">
            <Image alt="" height={425} src="/motorista/inicio-carro-cidade.png" width={638} />
          </span>
          <span>
            <strong>Adicionar veículo</strong>
            <small>Cadastre seu veículo para receber corridas.</small>
          </span>
          <FiChevronRight aria-hidden="true" className="profile-chevron vehicle" />
        </button>
      )}

      <div className="profile-list">
        <ProfileRow detail={profile?.full_name || "Não informado"} icon="user" label="Nome completo" />
        <ProfileRow detail={formatDriverPhone(profile?.phone)} icon="phone" label="Telefone" />
        <ProfileRow detail={profile?.pix_account || "Não informado"} icon="pix" label="Chave PIX" />
        <ProfileRow detail="Gerencie seus avisos e notificações" icon="help" label="Avisos" />
        <ProfileRow detail="Login, senha e verificação" icon="shield" label="Segurança" />
        <ProfileRow detail="Preferências do app" icon="settings" label="Configurações" />
      </div>

      <FormToast message={error} />
      <button className="profile-primary-action" onClick={handleRefreshProfile} type="button">
        <FiRefreshCw aria-hidden="true" />
        Atualizar dados
      </button>
      <button className="profile-logout-action" onClick={onLogout} type="button">
        <FiLogOut aria-hidden="true" />
        Sair da conta
      </button>
    </section>
  );
}

function VehicleListScreen({
  go,
  token,
}: {
  go: (screen: Screen) => void;
  token?: string;
}) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [error, setError] = useState("");
  const setEditingVehicleId = useDriverFlowStore((state) => state.setEditingVehicleId);
  const setSelectedBrand = useDriverFlowStore((state) => state.setSelectedBrand);
  const setVehicleForm = useDriverFlowStore((state) => state.setVehicleForm);
  const setVehicleUploads = useDriverFlowStore((state) => state.setVehicleUploads);

  function handleEditVehicle(vehicle: DriverProfile["vehicles"][number]) {
    setEditingVehicleId(vehicle.id);
    setSelectedBrand({ codigo: normalizeBrandName(vehicle.brand), nome: vehicle.brand });
    setVehicleForm({
      model: vehicle.model,
      plate: vehicle.plate,
      year: vehicle.year == null ? "" : String(vehicle.year),
    });
    setVehicleUploads({
      front: vehicle.front_photo_url ? { url: vehicle.front_photo_url } : undefined,
      interior: vehicle.interior_photo_url ? { url: vehicle.interior_photo_url } : undefined,
      rear: vehicle.rear_photo_url ? { url: vehicle.rear_photo_url } : undefined,
      side: vehicle.side_photo_url ? { url: vehicle.side_photo_url } : undefined,
    });
    go("vehicle-photos");
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    const activeToken = token;
    let cancelled = false;

    async function loadProfile() {
      try {
        const nextProfile = await getDriverProfile(activeToken);
        if (!cancelled) {
          setProfile(nextProfile);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não foi possível carregar seus veículos.");
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <section className="scroll-screen vehicle-list-screen">
      <AppHeader onBack={() => go("dashboard")} />
      <div className="vehicle-list-title-row">
        <div>
          <h1>Meus veículos</h1>
          <p>Gerencie os veículos cadastrados.</p>
        </div>
        <button aria-label="Adicionar veículo" className="vehicle-list-add-button" onClick={() => go("vehicle-mode")} type="button">
          +
        </button>
      </div>

      <div className="vehicle-list-stack">
        {profile?.vehicles.length ? (
          profile.vehicles.map((vehicle) => {
            const vehicleImageUrl = getVehicleImageUrl(vehicle);

            return (
              <button className="vehicle-list-card" key={vehicle.id} onClick={() => handleEditVehicle(vehicle)} type="button">
                <span className="vehicle-list-card-image">
                  {vehicleImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="" src={vehicleImageUrl} />
                  ) : (
                    <Image alt="" height={425} src="/motorista/inicio-carro-cidade.png" width={638} />
                  )}
                </span>
                <div className="vehicle-list-card-copy">
                  <div className="vehicle-list-card-topline">
                    <strong>{[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}</strong>
                    <span className={vehicle.status?.toUpperCase() === "APROVADO" ? "is-active" : ""}>
                      {getVehicleStatusLabel(vehicle.status)}
                    </span>
                  </div>
                  <small>Placa: {vehicle.plate || "Não informada"}</small>
                  <small>Ano: {formatVehicleYear(vehicle.year)}</small>
                  <small>Cor: {vehicle.color || "Não informada"}</small>
                </div>
              </button>
            );
          })
        ) : (
          <button className="profile-add-vehicle-card" onClick={() => go("vehicle-mode")} type="button">
            <span className="profile-add-vehicle-image">
              <Image alt="" height={425} src="/motorista/inicio-carro-cidade.png" width={638} />
            </span>
            <span>
              <strong>Adicionar veículo</strong>
              <small>Cadastre seu veículo para receber corridas.</small>
            </span>
            <FiChevronRight aria-hidden="true" className="profile-chevron vehicle" />
          </button>
        )}
      </div>

      <FormToast message={error} />
    </section>
  );
}

function getRegisterTripRoutePoints(
  origin: DriverMapLocation | null,
  destination: DriverRoutePlace | null,
  geometry: DriverRouteCoordinate[],
) {
  if (!origin || !destination) {
    return [];
  }

  if (geometry.length >= 2) {
    return geometry;
  }

  return [
    { lat: origin.latitude, lng: origin.longitude },
    { lat: destination.lat, lng: destination.lng },
  ];
}

function getRegisterTripSvgPoints(points: DriverRouteCoordinate[]) {
  if (points.length < 2) {
    return "";
  }

  const latitudes = points.map((point) => point.lat);
  const longitudes = points.map((point) => point.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const latSpan = maxLat - minLat || 1;
  const lngSpan = maxLng - minLng || 1;
  const padding = 10;
  const size = 100 - padding * 2;

  return points
    .map((point) => {
      const x = padding + ((point.lng - minLng) / lngSpan) * size;
      const y = padding + ((maxLat - point.lat) / latSpan) * size;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}

function GoogleRegisterTripMap({
  destination,
  onFallback,
  origin,
  routePoints,
}: {
  destination: DriverRoutePlace;
  onFallback: () => void;
  origin: DriverMapLocation;
  routePoints: DriverRouteCoordinate[];
}) {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<GoogleMap | null>(null);
  const markersRef = useRef<GoogleMarker[]>([]);
  const polylineRef = useRef<GooglePolyline | null>(null);

  const fitRoute = useCallback((maps: GoogleMapsNamespace, map: GoogleMap) => {
    const bounds = new maps.LatLngBounds();
    routePoints.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
    map.fitBounds(bounds, 34);
  }, [routePoints]);

  useEffect(() => {
    let cancelled = false;

    async function initializeMap() {
      try {
        const maps = await loadGoogleMaps();
        const element = mapElementRef.current;

        if (cancelled || !element || mapRef.current) {
          return;
        }

        const map = new maps.Map(element, {
          center: { lat: origin.latitude, lng: origin.longitude },
          clickableIcons: false,
          disableDefaultUI: true,
          fullscreenControl: false,
          gestureHandling: "greedy",
          mapTypeControl: false,
          mapTypeId: "roadmap",
          scaleControl: false,
          streetViewControl: false,
          zoom: 8,
          zoomControl: false,
        });

        mapRef.current = map;
        polylineRef.current = new maps.Polyline({
          geodesic: true,
          map,
          path: routePoints,
          strokeColor: "#073449",
          strokeOpacity: 1,
          strokeWeight: 6,
        });
        markersRef.current = [
          new maps.Marker({
            map,
            position: { lat: origin.latitude, lng: origin.longitude },
            title: "Origem",
          }),
          new maps.Marker({
            map,
            position: { lat: destination.lat, lng: destination.lng },
            title: "Destino",
          }),
        ];
        fitRoute(maps, map);
      } catch {
        if (!cancelled) {
          onFallback();
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      polylineRef.current?.setMap(null);
      markersRef.current = [];
      polylineRef.current = null;
      mapRef.current = null;
    };
  }, [destination.lat, destination.lng, fitRoute, onFallback, origin.latitude, origin.longitude, routePoints]);

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    polylineRef.current?.setPath(routePoints);
  }, [routePoints]);

  return <div className="register-trip-google-map" ref={mapElementRef} />;
}

function RegisterTripMap({
  destination,
  geometry,
  isRouting,
  origin,
}: {
  destination: DriverRoutePlace | null;
  geometry: DriverRouteCoordinate[];
  isRouting: boolean;
  origin: DriverMapLocation | null;
}) {
  const [shouldUseGoogleMaps, setShouldUseGoogleMaps] = useState(Boolean(googleMapsApiKey));
  const routePoints = useMemo(
    () => getRegisterTripRoutePoints(origin, destination, geometry),
    [destination, geometry, origin],
  );
  const svgPoints = useMemo(() => getRegisterTripSvgPoints(routePoints), [routePoints]);

  return (
    <div className="register-trip-map-placeholder" aria-label="Mapa da viagem">
      {shouldUseGoogleMaps && origin && destination && routePoints.length >= 2 ? (
        <GoogleRegisterTripMap
          destination={destination}
          onFallback={() => setShouldUseGoogleMaps(false)}
          origin={origin}
          routePoints={routePoints}
        />
      ) : origin ? (
        <>
          <OpenStreetMapLayer location={origin} zoom={12} />
          {svgPoints ? (
            <svg className="register-trip-route-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <polyline points={svgPoints} />
            </svg>
          ) : (
            <span className="register-trip-map-route" />
          )}
          <span className="register-trip-map-pin origin">
            <Icon name="car" />
          </span>
          {destination ? (
            <span className="register-trip-map-pin destination">
              <Icon name="locate" />
            </span>
          ) : null}
        </>
      ) : (
        <>
          <span className="register-trip-map-route" />
          <span className="register-trip-map-pin origin">
            <Icon name="car" />
          </span>
          <span className="register-trip-map-pin destination">
            <Icon name="locate" />
          </span>
        </>
      )}
      {isRouting ? <span className="register-trip-map-loading">Calculando rota...</span> : null}
    </div>
  );
}

function RegisterTrip({ go, token }: { go: (screen: Screen) => void; token?: string }) {
  const todayInputValue = useMemo(() => dateToLocalInputValue(new Date()), []);
  const [originLocation, setOriginLocation] = useState<DriverMapLocation | null>(null);
  const [originPlace, setOriginPlace] = useState<DriverMapPlace | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState<DriverRoutePlace[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<DriverRoutePlace | null>(null);
  const [departureDate, setDepartureDate] = useState(todayInputValue);
  const [returnDate, setReturnDate] = useState(addDaysToInputDate(todayInputValue, 1));
  const [routeSummary, setRouteSummary] = useState<DriverRouteSummary | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<DriverRouteCoordinate[]>([]);
  const [isLocating, setIsLocating] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isRouting, setIsRouting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const originLabel = originPlace ? formatDriverMapPlace(originPlace) : originLocation ? "Localização atual" : "Buscando sua localização...";
  const originDetail = originPlace?.label && originPlace.label !== originLabel ? originPlace.label : "Origem obtida pelo GPS";
  const dateError = departureDate < todayInputValue
    ? "A data de ida não pode ser menor que hoje."
    : returnDate < departureDate
      ? "A data de retorno não pode ser menor que a data de ida."
      : "";
  const outboundDistanceKm = routeSummary?.distanceKm ?? null;
  const returnDistanceKm = routeSummary?.distanceKm ?? null;
  const totalDistanceKm = routeSummary ? routeSummary.distanceKm * 2 : null;
  const totalDurationSeconds = routeSummary ? routeSummary.durationSeconds * 2 : null;
  const summaryCards = [
    ["Distância total", formatTripDistanceKm(totalDistanceKm), "Ida e volta"],
    ["Distância de ida", formatTripDistanceKm(outboundDistanceKm), ""],
    ["Distância de retorno", formatTripDistanceKm(returnDistanceKm), ""],
    ["Duração estimada", formatTripDuration(totalDurationSeconds), "Ida e volta"],
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadOrigin() {
      setIsLocating(true);
      setError("");

      try {
        const position = await getCurrentPosition();
        const location = positionToDriverMapLocation(position);

        if (!cancelled) {
          setOriginLocation(location);
        }
      } catch {
        if (!cancelled) {
          setError("Permita a localização para registrar sua viagem.");
        }
      } finally {
        if (!cancelled) {
          setIsLocating(false);
        }
      }
    }

    loadOrigin();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!originLocation) {
      return;
    }

    const activeOriginLocation = originLocation;
    let cancelled = false;

    async function loadOriginPlace() {
      try {
        const place = await fetchDriverMapPlace(activeOriginLocation);
        if (!cancelled) {
          setOriginPlace(place);
        }
      } catch {
        if (!cancelled) {
          setOriginPlace(null);
        }
      }
    }

    loadOriginPlace();

    return () => {
      cancelled = true;
    };
  }, [originLocation]);

  useEffect(() => {
    const query = destinationQuery.trim();

    if (selectedDestination && destinationQuery === selectedDestination.label) {
      return;
    }

    if (query.length < 3) {
      return;
    }

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      try {
        const places = await searchDriverRoutePlaces(query);
        if (!cancelled) {
          setDestinationSuggestions(places);
        }
      } catch (err) {
        if (!cancelled) {
          setDestinationSuggestions([]);
          setError(err instanceof Error ? err.message : "Não foi possível buscar destinos agora.");
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [destinationQuery, selectedDestination]);

  useEffect(() => {
    if (!originLocation || !selectedDestination) {
      return;
    }

    const activeOriginLocation = originLocation;
    const activeDestination = selectedDestination;
    let cancelled = false;

    async function loadRoute() {
      setIsRouting(true);
      setError("");

      try {
        const summary = await fetchDriverRoute(
          { lat: activeOriginLocation.latitude, lng: activeOriginLocation.longitude },
          { lat: activeDestination.lat, lng: activeDestination.lng },
        );

        if (!cancelled) {
          setRouteSummary(summary);
          setRouteGeometry(summary.geometry);
        }
      } catch (err) {
        if (!cancelled) {
          setRouteSummary(null);
          setRouteGeometry([]);
          setError(err instanceof Error ? err.message : "Não foi possível calcular a rota agora.");
        }
      } finally {
        if (!cancelled) {
          setIsRouting(false);
        }
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [originLocation, selectedDestination]);

  function handleSelectDestination(place: DriverRoutePlace) {
    setSelectedDestination(place);
    setDestinationQuery(place.label);
    setDestinationSuggestions([]);
    setRouteSummary(null);
    setRouteGeometry([]);
    setError("");
    setSuccessMessage("");
  }

  function handleDepartureDateChange(value: string) {
    const nextDepartureDate = value < todayInputValue ? todayInputValue : value;
    setDepartureDate(nextDepartureDate);
    setReturnDate((currentReturnDate) => (
      currentReturnDate < nextDepartureDate ? nextDepartureDate : currentReturnDate
    ));
  }

  function handleReturnDateChange(value: string) {
    setReturnDate(value < departureDate ? departureDate : value);
  }

  async function handleSubmitTrip() {
    setSuccessMessage("");

    if (!token) {
      setError("Entre novamente para registrar sua viagem.");
      return;
    }

    if (!originLocation) {
      setError("Permita a localização para registrar sua viagem.");
      return;
    }

    if (!selectedDestination) {
      setError("Selecione o destino da viagem.");
      return;
    }

    if (dateError) {
      setError(dateError);
      return;
    }

    if (!routeSummary || routeSummary.distanceKm <= 0) {
      setError("Aguarde o cálculo da rota para registrar sua viagem.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await createDriverTrip(token, {
        departure_date: departureDate,
        destination_label: selectedDestination.label,
        destination_latitude: selectedDestination.lat,
        destination_longitude: selectedDestination.lng,
        duration_seconds: routeSummary.durationSeconds * 2,
        origin_label: originLabel,
        origin_latitude: originLocation.latitude,
        origin_longitude: originLocation.longitude,
        outbound_distance_km: routeSummary.distanceKm,
        return_date: returnDate,
        return_distance_km: routeSummary.distanceKm,
        route_geometry: routeGeometry,
        total_distance_km: routeSummary.distanceKm * 2,
      });
      setSuccessMessage("Viagem registrada com sucesso.");
      window.setTimeout(() => go("dashboard"), 850);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível registrar a viagem.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="scroll-screen register-trip-screen">
      <header className="register-trip-header">
        <button aria-label="Voltar para o painel" onClick={() => go("dashboard")} type="button">
          <Icon name="arrow-left" />
        </button>
        <h1>Registrar nova viagem</h1>
        <button aria-label="Fechar registro de viagem" onClick={() => go("dashboard")} type="button">
          <Icon name="close" />
        </button>
      </header>

      <div className="register-trip-field register-trip-origin">
        <span className="register-trip-field-icon">
          <Icon name="locate" />
        </span>
        <span>
          <small>Local atual</small>
          <strong>{isLocating ? "Buscando sua localização..." : originLabel}</strong>
          <em>{originDetail}</em>
        </span>
      </div>

      <div className="register-trip-search">
        <label className="register-trip-field register-trip-destination">
          <span className="register-trip-field-icon">
            <Icon name="locate" />
          </span>
          <span>
            <small>Destino da viagem</small>
            <input
              autoComplete="off"
              onChange={(event) => {
                const nextQuery = event.target.value;
                setDestinationQuery(nextQuery);
                setSelectedDestination(null);
                setRouteSummary(null);
                setRouteGeometry([]);
                if (nextQuery.trim().length < 3) {
                  setDestinationSuggestions([]);
                  setIsSearching(false);
                } else {
                  setIsSearching(true);
                }
              }}
              placeholder="Digite o destino da viagem"
              type="search"
              value={destinationQuery}
            />
          </span>
        </label>
        {isSearching ? <p className="register-trip-search-status">Buscando destinos...</p> : null}
        {destinationSuggestions.length > 0 ? (
          <div className="register-trip-suggestions">
            {destinationSuggestions.map((place) => (
              <button key={place.id} onClick={() => handleSelectDestination(place)} type="button">
                <Icon name="locate" />
                <span>
                  <strong>{formatDriverRoutePlace(place)}</strong>
                  <small>{place.label}</small>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="register-trip-date-grid" aria-label="Datas da viagem">
        <label className="register-trip-date-card">
          <Icon name="calendar" />
          <span>
            <small>Data de ida</small>
            <input
              min={todayInputValue}
              onChange={(event) => handleDepartureDateChange(event.target.value)}
              type="date"
              value={departureDate}
            />
          </span>
        </label>
        <label className="register-trip-date-card">
          <Icon name="calendar" />
          <span>
            <small>Data de retorno</small>
            <input
              min={departureDate}
              onChange={(event) => handleReturnDateChange(event.target.value)}
              type="date"
              value={returnDate}
            />
          </span>
        </label>
      </div>

      <RegisterTripMap
        destination={selectedDestination}
        geometry={routeGeometry}
        isRouting={isRouting}
        origin={originLocation}
      />

      <h2 className="register-trip-section-title">Resumo da viagem</h2>
      <div className="register-trip-summary-grid">
        {summaryCards.map(([label, value, hint]) => (
          <article className="register-trip-summary-card" key={label}>
            <Icon name={label.includes("Duração") ? "calendar" : "locate"} />
            <span>
              <small>{label}</small>
              <strong>{isRouting ? "..." : value}</strong>
              {hint ? <em>{hint}</em> : null}
            </span>
          </article>
        ))}
      </div>

      <p className="register-trip-info">
        <Icon name="help" />
        {error || dateError || successMessage || (isRouting ? "Calculando rota da viagem..." : selectedDestination ? "Confira os dados e confirme para registrar sua viagem." : "Informe o destino para calcular a rota da viagem.")}
      </p>

      <button
        className="register-trip-submit"
        disabled={isSubmitting || isRouting}
        onClick={handleSubmitTrip}
        type="button"
      >
        <Icon name="car" />
        {isSubmitting ? "Registrando..." : "Registrar viagem"}
      </button>
    </section>
  );
}

function TripHistory({ go, token }: { go: (screen: Screen) => void; token?: string }) {
  const [items, setItems] = useState<DriverHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedItem, setSelectedItem] = useState<DriverHistoryItem | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const authError = token ? "" : "Entre novamente para ver seu histórico de viagens.";

  const loadHistory = useCallback(async () => {
    if (!token) {
      return;
    }

    const activeToken = token;
    setIsLoading(true);
    setError("");

    try {
      const data = await listDriverHistory(activeToken);
      setItems(data);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : "Não foi possível carregar seu histórico de viagens agora.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  async function handleHistoryAction(item: DriverHistoryItem, action: "complete" | "cancel" | "pickup") {
    if (!token) {
      setError("Entre novamente para atualizar o histórico.");
      return;
    }

    setBusyItemId(item.id);
    setError("");
    try {
      if (item.type === "ride") {
        await completeDriverRideRequest(token, item.id);
      } else if (item.type === "delivery" && action === "pickup") {
        await pickupDriverDelivery(token, item.id);
      } else if (item.type === "delivery") {
        await completeDriverDelivery(token, item.id);
      } else if (action === "complete") {
        await completeDriverTrip(token, item.id);
      } else {
        await cancelDriverTrip(token, item.id);
      }
      await loadHistory();
      setSelectedItem(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível atualizar este item.");
    } finally {
      setBusyItemId(null);
    }
  }

  const sortedItems = useMemo(() => [...items].sort((left, right) => right.sort_at.localeCompare(left.sort_at)), [items]);

  return (
    <section className="scroll-screen trip-history-screen">
      <header className="trip-history-header">
        <button aria-label="Voltar para o painel" onClick={() => go("dashboard")} type="button">
          <Icon name="arrow-left" />
        </button>
        <h1>Histórico de viagens</h1>
        <button aria-label="Registrar nova viagem" onClick={() => go("register-trip")} type="button">
          <span aria-hidden="true">+</span>
        </button>
      </header>

      <div className="trip-history-tabs" aria-label="Filtros do histórico">
        <button className="active" type="button">
          Todas
        </button>
        <button aria-disabled="true" className="inactive" type="button">
          <Icon name="check" />
          Concluídas
        </button>
        <button aria-disabled="true" className="inactive" type="button">
          <Icon name="calendar" />
          Agendadas
        </button>
      </div>

      <section className="trip-history-section" aria-label="Todas as viagens">
        <h2>
          <Icon name="calendar" />
          Todas as viagens
        </h2>

        {isLoading ? <p className="trip-history-state">Carregando viagens...</p> : null}
        {!isLoading && (error || authError) ? <p className="trip-history-state error">{error || authError}</p> : null}
        {!isLoading && !error && !authError && sortedItems.length === 0 ? (
          <p className="trip-history-state">Nenhuma viagem registrada ainda.</p>
        ) : null}

        {!isLoading && !error && !authError && sortedItems.length > 0 ? (
          <div className="trip-history-list">
            {sortedItems.map((item) => (
              <TripHistoryCard key={`${item.type}-${item.id}`} item={item} onSelect={setSelectedItem} />
            ))}
          </div>
        ) : null}
      </section>

      <p className="trip-history-tip">
        <Icon name="help" />
        <span><strong>Dica:</strong> Toque em uma corrida ou rota para ver os detalhes completos.</span>
      </p>

      {selectedItem ? (
        <div className="trip-detail-overlay" role="presentation" onClick={() => setSelectedItem(null)}>
          <aside
            aria-label="Detalhes da viagem"
            className="trip-detail-sheet"
            onClick={(event) => event.stopPropagation()}
          >
            <button aria-label="Fechar detalhes" className="trip-detail-close" onClick={() => setSelectedItem(null)} type="button">
              <Icon name="close" />
            </button>
            <h2>{selectedItem.title}</h2>
            <div className="trip-detail-grid">
              {selectedItem.metrics.map((metric) => (
                <TripDetailItem key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </div>
            {selectedItem.status_tone === "scheduled" ? (
              <div className="trip-detail-actions">
                <button
                  disabled={busyItemId === selectedItem.id}
                  onClick={() =>
                    handleHistoryAction(
                      selectedItem,
                      selectedItem.type === "delivery" && selectedItem.status === "preparing" ? "pickup" : "complete",
                    )
                  }
                  type="button"
                >
                  {busyItemId === selectedItem.id
                    ? "Atualizando..."
                    : selectedItem.type === "delivery" && selectedItem.status === "preparing"
                      ? "Retirar pedido"
                      : "Concluir"}
                </button>
                {selectedItem.type === "planned_trip" ? (
                  <button
                    disabled={busyItemId === selectedItem.id}
                    onClick={() => handleHistoryAction(selectedItem, "cancel")}
                    type="button"
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function TripHistoryCard({
  item,
  onSelect,
}: {
  item: DriverHistoryItem;
  onSelect: (item: DriverHistoryItem) => void;
}) {
  const tone = item.status_tone;

  return (
    <button className="trip-history-card" onClick={() => onSelect(item)} type="button">
      <span className={`trip-history-icon ${tone}`}>
        <Icon name={tone === "completed" ? "check" : item.type === "ride" || item.type === "delivery" ? "car" : "calendar"} />
      </span>
      <span className="trip-history-main">
        <strong>{item.title}</strong>
        <small>{item.subtitle}</small>
        <small>{item.date_label}</small>
      </span>
      <span className="trip-history-metrics">
        <em className={`trip-history-badge ${tone}`}>{item.status_label}</em>
        <span>
          <Icon name="road" />
          <b>{item.distance_label}</b>
          <small>{item.type === "ride" ? "corrida" : item.type === "delivery" ? "entrega" : "rota"}</small>
        </span>
      </span>
      <FiChevronRight aria-hidden="true" className="trip-history-chevron" />
    </button>
  );
}

function TripDetailItem({ label, value }: { label: string; value: string }) {
  const iconName =
    label === "Origem"
      ? "locate"
      : label === "Destino"
        ? "map"
        : label === "Ida" || label === "Retorno"
          ? "calendar"
          : label.includes("Distância")
            ? "road"
            : label === "Duração estimada"
              ? "clock"
              : label === "Status"
                ? "check"
                : "help";

  return (
    <span className="trip-detail-item">
      <i aria-hidden="true" className="trip-detail-item-icon">
        <Icon name={iconName} />
      </i>
      <span className="trip-detail-item-copy">
        <small>{label}</small>
        <strong>{value}</strong>
      </span>
    </span>
  );
}

function Dashboard({
  go,
  onLogout,
  token,
}: {
  go: (screen: Screen) => void;
  onLogout: () => void;
  token?: string;
}) {
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rideRequests, setRideRequests] = useState<DriverRideRequest[]>([]);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [deliveryOffers, setDeliveryOffers] = useState<DriverDelivery[]>([]);
  const [busyDeliveryId, setBusyDeliveryId] = useState<string | null>(null);
  const [rideFeedback, setRideFeedback] = useState("");
  const [earnings, setEarnings] = useState<DriverEarnings | null>(null);
  const [earningsError, setEarningsError] = useState("");
  const [isDriverMenuOpen, setIsDriverMenuOpen] = useState(false);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [mapLocation, setMapLocation] = useState<DriverMapLocation>(defaultDriverMapLocation);
  const [mapPlace, setMapPlace] = useState<DriverMapPlace | null>(null);
  const [mapLayer, setMapLayer] = useState<DriverMapLayer>("roadmap");
  const [mapZoom, setMapZoom] = useState(defaultDriverMapZoom);
  const [shouldUseGoogleMaps, setShouldUseGoogleMaps] = useState(Boolean(googleMapsApiKey));
  const [isLocating, setIsLocating] = useState(false);
  const shouldShowAddVehicle = driverProfile ? driverProfile.vehicles.length === 0 : false;
  const mapPlaceLabel = formatDriverMapPlace(mapPlace);

  useEffect(() => {
    if (!isOnline || !token) {
      return;
    }

    const activeToken = token;
    let cancelled = false;

    async function syncLocation() {
      try {
        const location = await sendCurrentDriverLocation(activeToken);
        if (!cancelled) {
          setMapLocation(location);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não foi possível atualizar sua localização.");
        }
      }
    }

    const interval = window.setInterval(syncLocation, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isOnline, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const activeToken = token;
    let cancelled = false;

    async function loadDriverProfile() {
      try {
        const profile = await getDriverProfile(activeToken);
        if (!cancelled) {
          setDriverProfile(profile);
          setIsOnline(profile.is_online);
          if (profile.last_latitude != null && profile.last_longitude != null) {
            setMapLocation({
              accuracy_meters: profile.last_accuracy_meters,
              latitude: profile.last_latitude,
              longitude: profile.last_longitude,
            });
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Não foi possível carregar seus veículos.");
        }
      }
    }

    loadDriverProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadMapPlace() {
      try {
        const place = await fetchDriverMapPlace(mapLocation);
        if (!cancelled) {
          setMapPlace(place);
        }
      } catch {
        if (!cancelled) {
          setMapPlace(null);
        }
      }
    }

    loadMapPlace();

    return () => {
      cancelled = true;
    };
  }, [mapLocation]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const activeToken = token;
    let cancelled = false;

    async function loadEarnings() {
      try {
        const data = await getDriverEarnings(activeToken);
        if (!cancelled) {
          setEarnings(data);
          setEarningsError("");
        }
      } catch (err) {
        if (!cancelled) {
          setEarnings(null);
          setEarningsError(err instanceof Error ? err.message : "Não foi possível carregar seus ganhos.");
        }
      }
    }

    loadEarnings();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    async function loadBrowserLocation() {
      try {
        const position = await getCurrentPosition();
        if (!cancelled) {
          setMapLocation(positionToDriverMapLocation(position));
        }
      } catch {
        // Fallback keeps the dashboard usable when location permission is still pending.
      }
    }

    loadBrowserLocation();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isOnline || !token) {
      return;
    }

    const activeToken = token;
    let cancelled = false;

    async function syncRideRequests() {
      try {
        const [requests, deliveries] = await Promise.all([
          listDriverRideRequests(activeToken),
          listAvailableDriverDeliveries(activeToken),
        ]);
        if (!cancelled) {
          setRideRequests(requests);
          setDeliveryOffers(deliveries);
        }
      } catch (err) {
        if (!cancelled) {
          setRideFeedback(err instanceof Error ? err.message : "Não foi possível buscar corridas e entregas.");
        }
      }
    }

    syncRideRequests();
    const interval = window.setInterval(syncRideRequests, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isOnline, token]);

  async function handleToggleOnline() {
    if (!token) {
      setError("Entre novamente para ficar online.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      if (isOnline) {
        const availability = await setDriverOffline(token);
        setIsOnline(availability.is_online);
        setDriverProfile(availability.driver);
        setRideRequests([]);
        setDeliveryOffers([]);
        return;
      }

      const location = await sendCurrentDriverLocation(token);
      setMapLocation(location);
      const availability = await setDriverOnline(token);
      setIsOnline(availability.is_online);
      setDriverProfile(availability.driver);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar sua disponibilidade.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleLocateDriver() {
    setIsLocating(true);
    setError("");
    try {
      if (token) {
        const location = await sendCurrentDriverLocation(token);
        setMapLocation(location);
        return;
      }

      const position = await getCurrentPosition();
      setMapLocation(positionToDriverMapLocation(position));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível acessar sua localização.");
    } finally {
      setIsLocating(false);
    }
  }

  async function handleRideAction(rideRequestId: string, action: "accept" | "decline") {
    if (!token) {
      setRideFeedback("Entre novamente para responder a corrida.");
      return;
    }

    setBusyRideId(rideRequestId);
    setRideFeedback("");
    try {
      const updated =
        action === "accept"
          ? await acceptDriverRideRequest(token, rideRequestId)
          : await declineDriverRideRequest(token, rideRequestId);
      setRideRequests((requests) => requests.filter((request) => request.id !== rideRequestId));
      setRideFeedback(updated.status === "ACEITA" ? "Corrida aceita." : "Corrida recusada.");
      if (updated.status === "ACEITA") {
        const data = await getDriverEarnings(token);
        setEarnings(data);
        setEarningsError("");
      }
    } catch (err) {
      setRideFeedback(err instanceof Error ? err.message : "Não foi possível responder a corrida.");
    } finally {
      setBusyRideId(null);
    }
  }

  async function handleAcceptDelivery(orderId: string) {
    if (!token) {
      setRideFeedback("Entre novamente para aceitar a entrega.");
      return;
    }

    setBusyDeliveryId(orderId);
    setRideFeedback("");
    try {
      await acceptDriverDelivery(token, orderId);
      setDeliveryOffers((offers) => offers.filter((offer) => offer.id !== orderId));
      setRideFeedback("Entrega aceita. Veja os detalhes no histórico.");
      const data = await getDriverEarnings(token);
      setEarnings(data);
      setEarningsError("");
    } catch (err) {
      setRideFeedback(err instanceof Error ? err.message : "Não foi possível aceitar a entrega.");
    } finally {
      setBusyDeliveryId(null);
    }
  }

  return (
    <section className="map-screen">
      <div className="map-art" aria-label="Mapa da localização atual do motorista">
        {shouldUseGoogleMaps ? (
          <GoogleDriverMap
            layer={mapLayer}
            location={mapLocation}
            onFallback={() => setShouldUseGoogleMaps(false)}
            onZoomChange={setMapZoom}
            zoom={mapZoom}
          />
        ) : (
          <OpenStreetMapLayer location={mapLocation} zoom={mapZoom} />
        )}
      </div>
      <div className="map-controls" aria-label="Controles do mapa">
        <button
          aria-label="Aproximar mapa"
          disabled={mapZoom >= maxDriverMapZoom}
          onClick={() => setMapZoom((zoom) => Math.min(zoom + 1, maxDriverMapZoom))}
          type="button"
        >
          <Icon name="plus" />
        </button>
        <button
          aria-label="Afastar mapa"
          disabled={mapZoom <= minDriverMapZoom}
          onClick={() => setMapZoom((zoom) => Math.max(zoom - 1, minDriverMapZoom))}
          type="button"
        >
          <Icon name="minus" />
        </button>
        <button
          aria-label="Usar minha localização atual"
          className={isLocating ? "is-loading" : ""}
          disabled={isLocating}
          onClick={handleLocateDriver}
          type="button"
        >
          <Icon name="locate" />
        </button>
      </div>
      {shouldUseGoogleMaps ? (
        <div className="map-layer-control" aria-label="Selecionar camada do mapa">
          <button
            aria-pressed={mapLayer === "roadmap"}
            className={mapLayer === "roadmap" ? "active" : ""}
            onClick={() => setMapLayer("roadmap")}
            type="button"
          >
            Mapa
          </button>
          <button
            aria-pressed={mapLayer === "satellite"}
            className={mapLayer === "satellite" ? "active" : ""}
            onClick={() => setMapLayer("satellite")}
            type="button"
          >
            Real
          </button>
        </div>
      ) : null}
      <button
        aria-expanded={isDriverMenuOpen}
        aria-label="Abrir menu do motorista"
        className="driver-menu-button"
        onClick={() => setIsDriverMenuOpen(true)}
        type="button"
      >
        <Icon name="menu" />
      </button>
      <div className="bottom-sheet">
        <div className="sheet-handle-row">
          <i />
        </div>
        <div className="sheet-title">
          <div className="map-location-copy">
            <span>{isOnline ? "Disponível em" : "Localização atual"}</span>
            <strong>{mapPlaceLabel}</strong>
          </div>
        </div>
        <FormToast message={error} />
        <section className="driver-earnings-card" aria-label="Resumo de ganhos">
          <div className="driver-earnings-balance">
            <span>Saldo disponível</span>
            <strong>{earnings?.available_balance ?? "R$ 0,00"}</strong>
          </div>
          <div className="driver-earnings-grid">
            <span>
              <small>Hoje</small>
              <b>{earnings?.today_total ?? "R$ 0,00"}</b>
            </span>
            <span>
              <small>Mês</small>
              <b>{earnings?.month_total ?? "R$ 0,00"}</b>
            </span>
            <span>
              <small>Rotas</small>
              <b>{earnings?.estimated_trip_total ?? "R$ 0,00"}</b>
            </span>
          </div>
          {earningsError ? <p>{earningsError}</p> : null}
        </section>
        {rideRequests.length ? (
          <div className="ride-request-stack">
            {rideRequests.slice(0, 2).map((rideRequest) => (
              <article className="ride-request-card" key={rideRequest.id}>
                <div>
                  <span>Nova corrida</span>
                  <strong>{rideRequest.passenger_name ?? "Passageiro SUWAVE"}</strong>
                  <p>
                    {rideRequest.origin_label ?? "Origem enviada pelo passageiro"}
                    {rideRequest.destination_label ? ` → ${rideRequest.destination_label}` : ""}
                  </p>
                </div>
                <dl>
                  <div>
                    <dt>Distância</dt>
                    <dd>{formatRideDistance(rideRequest.distance_meters)}</dd>
                  </div>
                  <div>
                    <dt>Pedido</dt>
                    <dd>{formatRideTime(rideRequest.requested_at)}</dd>
                  </div>
                  <div>
                    <dt>Lugares</dt>
                    <dd>{rideRequest.requested_seats}</dd>
                  </div>
                </dl>
                <div className="ride-actions">
                  <button
                    disabled={busyRideId === rideRequest.id}
                    onClick={() => handleRideAction(rideRequest.id, "decline")}
                    type="button"
                  >
                    Recusar
                  </button>
                  <button
                    disabled={busyRideId === rideRequest.id}
                    onClick={() => handleRideAction(rideRequest.id, "accept")}
                    type="button"
                  >
                    {busyRideId === rideRequest.id ? "Enviando..." : "Aceitar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {deliveryOffers.length ? (
          <div className="ride-request-stack">
            {deliveryOffers.slice(0, 2).map((delivery) => (
              <article className="ride-request-card delivery-offer-card" key={delivery.id}>
                <div>
                  <span>Nova entrega</span>
                  <strong>{delivery.seller}</strong>
                  <p>{delivery.address}</p>
                </div>
                <dl>
                  <div>
                    <dt>Pedido</dt>
                    <dd>{delivery.short_id}</dd>
                  </div>
                  <div>
                    <dt>Itens</dt>
                    <dd>{delivery.items_count}</dd>
                  </div>
                  <div>
                    <dt>Taxa</dt>
                    <dd>{delivery.delivery_fee}</dd>
                  </div>
                </dl>
                <div className="ride-actions single">
                  <button
                    disabled={busyDeliveryId === delivery.id}
                    onClick={() => handleAcceptDelivery(delivery.id)}
                    type="button"
                  >
                    {busyDeliveryId === delivery.id ? "Aceitando..." : "Aceitar entrega"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        {rideFeedback ? <p className="ride-feedback">{rideFeedback}</p> : null}
        <ActionButton onClick={handleToggleOnline}>
          {isSubmitting ? "Atualizando..." : isOnline ? "Ficar offline" : "Online"}
        </ActionButton>
        {shouldShowAddVehicle ? (
          <ActionButton onClick={() => go("vehicle-mode")} secondary>
            Adicionar veículo
          </ActionButton>
        ) : null}
        <div className="benefits">
          <span>▣ Ganhe dirigindo com segurança</span>
          <span>☆ Você define seus horários</span>
          <span>▤ Mais corridas, mais ganhos</span>
        </div>
      </div>
      {isDriverMenuOpen ? (
        <div className="driver-drawer-overlay" role="presentation" onClick={() => setIsDriverMenuOpen(false)}>
          <aside className="driver-drawer" aria-label="Menu do motorista" onClick={(event) => event.stopPropagation()}>
            <button
              aria-label="Fechar menu"
              className="driver-drawer-close"
              onClick={() => setIsDriverMenuOpen(false)}
              type="button"
            >
              <Icon name="close" />
            </button>
            <div className="driver-drawer-brand" aria-hidden="true">
              <Image
                alt=""
                height={425}
                src="/motorista/inicio-carro-cidade.png"
                width={638}
              />
            </div>
            <button
              onClick={() => {
                setIsDriverMenuOpen(false);
                go("profile");
              }}
              type="button"
            >
              <Icon name="user" />
              <span>Perfil</span>
            </button>
            <button type="button">
              <Icon name="settings" />
              <span>Configurações</span>
            </button>
            <button
              onClick={() => {
                setIsDriverMenuOpen(false);
                go("register-trip");
              }}
              type="button"
            >
              <Icon name="locate" />
              <span>Registrar uma rota</span>
            </button>
            <button
              onClick={() => {
                setIsDriverMenuOpen(false);
                go("trip-history");
              }}
              type="button"
            >
              <Icon name="calendar" />
              <span>Histórico de viagens</span>
            </button>
            <button
              onClick={() => {
                setIsDriverMenuOpen(false);
                go("vehicle-list");
              }}
              type="button"
            >
              <Icon name="car" />
              <span>Veículo</span>
            </button>
            <button type="button">
              <Icon name="help" />
              <span>Ajuda</span>
            </button>
            <button className="driver-drawer-logout" onClick={onLogout} type="button">
              <FiLogOut aria-hidden="true" />
              <span>Sair</span>
            </button>
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function VehicleBrand({
  go,
  selectedBrand,
  setSelectedBrand,
}: {
  go: (screen: Screen) => void;
  selectedBrand: VehicleBrandOption | null;
  setSelectedBrand: (brand: VehicleBrandOption) => void;
}) {
  const [brands, setBrands] = useState<VehicleBrandOption[]>(fallbackBrands);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [brandLoadError, setBrandLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBrands() {
      try {
        const response = await fetch("https://brasilapi.com.br/api/fipe/marcas/v1/carros");

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar marcas");
        }

        const data = (await response.json()) as Array<{ nome?: string; valor?: string }>;
        const nextBrands = data
          .filter((brand) => brand.nome && brand.valor)
          .map((brand) => ({ codigo: String(brand.valor), nome: String(brand.nome) }))
          .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));

        if (isMounted && nextBrands.length > 0) {
          setBrands(nextBrands);
          setBrandLoadError(false);
        }
      } catch {
        if (isMounted) {
          setBrands(fallbackBrands);
          setBrandLoadError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoadingBrands(false);
        }
      }
    }

    loadBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBrands = brands.filter((brand) =>
    normalizeBrandName(brand.nome).includes(normalizeBrandName(query)),
  );

  const visibleBrands = filteredBrands.slice(0, 36);

  return (
    <section className="scroll-screen">
      <AppHeader onBack={() => go("vehicle-mode")} />
      <div className="title-row">
        <h1>Cadastrar veículo</h1>
      </div>
      <Progress current={1} total={vehicleSteps} />
      <h2>Informações do veículo</h2>
      <div className="vehicle-brand-art" aria-hidden="true">
        <div className="vehicle-brand-city" />
        <div className="vehicle-brand-car">
          <span />
        </div>
      </div>
      <p className="subtitle left">Vamos começar! Selecione o fabricante do seu veículo.</p>
      <div className="select-panel">
        <label>Fabricante</label>
        <button
          aria-expanded={isOpen}
          className="brand-select-trigger"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span>{selectedBrand?.nome ?? "Selecione o fabricante"}</span>
          <b aria-hidden="true">⌄</b>
        </button>
        {isOpen ? (
          <div className="brand-dropdown">
            <input
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar fabricante"
              value={query}
            />
            <div className="brand-list">
              {isLoadingBrands ? <p className="brand-message">Carregando marcas da FIPE...</p> : null}
              {!isLoadingBrands && visibleBrands.length === 0 ? (
                <p className="brand-message">Nenhuma marca encontrada.</p>
              ) : null}
              {!isLoadingBrands && brandLoadError ? (
                <p className="brand-message muted">Usando lista local ate a API responder.</p>
              ) : null}
              {visibleBrands.map((brand) => (
                <button
                  className={selectedBrand?.codigo === brand.codigo ? "brand-row active" : "brand-row"}
                  key={brand.codigo}
                  onClick={() => {
                    setSelectedBrand(brand);
                    setQuery("");
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  <BrandLogo name={brand.nome} />
                  <span>{brand.nome}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      <ActionButton onClick={() => go("vehicle-data")}>Continuar</ActionButton>
      <button className="outline-back" onClick={() => go("vehicle-mode")} type="button">
        Voltar
      </button>
      <FooterNote />
    </section>
  );
}

function BrandLogo({ name }: { name: string }) {
  const slug = getBrandLogoSlug(name);

  if (slug) {
    return (
      <span className="brand-logo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img alt="" src={`https://cdn.simpleicons.org/${slug}/06384d`} />
      </span>
    );
  }

  return <span className="brand-logo fallback">{getBrandInitials(name)}</span>;
}

function AppHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="app-header">
      <button aria-label="Voltar" className="app-header-back" onClick={onBack} type="button">
        <FiArrowLeft aria-hidden="true" />
      </button>
      <BrandLockup compact />
      <button aria-label="Perfil do motorista" className="app-header-profile" type="button">♙</button>
    </header>
  );
}

function VehicleMode({
  go,
  selectedWorkMode,
  setSelectedWorkMode,
}: {
  go: (screen: Screen) => void;
  selectedWorkMode: DriverWorkMode | null;
  setSelectedWorkMode: (mode: DriverWorkMode | null) => void;
}) {
  const setEditingVehicleId = useDriverFlowStore((state) => state.setEditingVehicleId);
  const options: Array<{
    description: string;
    imageSrc: string;
    label: string;
    value: DriverWorkMode;
  }> = [
    {
      description: "Viagem e entrega com carro",
      imageSrc: "/motorista/workmode2-car.png",
      label: "Viagem e entrega com carro",
      value: "car_trip_delivery",
    },
    {
      description: "Entrega com carro",
      imageSrc: "/motorista/workmode2-van.png",
      label: "Entrega com carro",
      value: "car_delivery",
    },
    {
      description: "Entrega com moto",
      imageSrc: "/motorista/workmode2-moto.png",
      label: "Entrega com moto",
      value: "moto_delivery",
    },
    {
      description: "Entrega com bicicleta",
      imageSrc: "/motorista/workmode2-bike.png",
      label: "Entrega com bicicleta",
      value: "bike_delivery",
    },
  ];

  return (
    <section className="scroll-screen vehicle-mode-screen">
      <button aria-label="Voltar" className="plain-icon-back" onClick={() => go("dashboard")} type="button">
        <Icon name="arrow-left" />
      </button>
      <div className="vehicle-mode-copy">
        <h1>Escolha sua forma de trabalho</h1>
        <p>Use seu proprio veiculo ou alugue um e comece a viajar e fazer entregas.</p>
        <strong>Necessario: CNH com EAR</strong>
        <small>Selecione uma opcao abaixo.</small>
      </div>
      <div className="vehicle-mode-list">
        {options.map((option) => (
          <button
            aria-pressed={selectedWorkMode === option.value}
            className={selectedWorkMode === option.value ? "vehicle-mode-card active" : "vehicle-mode-card"}
            key={option.value}
            onClick={() => setSelectedWorkMode(option.value)}
            type="button"
          >
            <span aria-hidden="true" className="vehicle-mode-illustration image-based">
              <Image alt="" height={88} src={option.imageSrc} width={100} />
            </span>
            <strong>{option.label}</strong>
          </button>
        ))}
      </div>
      <ActionButton
        disabled={!selectedWorkMode}
        onClick={() => {
          setEditingVehicleId(undefined);
          go("vehicle-data");
        }}
      >
        Continuar
      </ActionButton>
    </section>
  );
}

function getWorkModeUi(mode: DriverWorkMode | null) {
  switch (mode) {
    case "moto_delivery":
      return {
        brandLabel: "Fabricante",
        brandMode: "select" as const,
        dataSubtitle: "Informe os dados da moto que você usará para realizar entregas.",
        dataTitle: "Dados da moto",
        emptyPreviewImageSrc: "/motorista/workmode2-moto.png",
        entityLabel: "moto",
        heroImageClassName: "mode-moto",
        heroImageSrc: "/motorista/workmode2-moto.png",
        needsPlate: true,
        needsYear: true,
        photoInfo: "ⓘ Envie fotos nítidas da frente, traseira, lateral e do painel ou baú da moto.",
        photoSubtitle: "Envie fotos nítidas da moto para análise.",
        photoTitle: "Fotos da moto",
        reviewPhotoAlt: "Foto da moto cadastrada",
        slots: [
          { key: "front" as const, label: "Frente" },
          { key: "rear" as const, label: "Traseira" },
          { key: "side" as const, label: "Lateral" },
          { key: "interior" as const, label: "Painel ou baú" },
        ],
      };
    case "bike_delivery":
      return {
        brandLabel: "Marca",
        brandMode: "input" as const,
        dataSubtitle: "Informe os dados da bicicleta que você usará para realizar entregas.",
        dataTitle: "Dados da bicicleta",
        emptyPreviewImageSrc: "/motorista/workmode2-bike.png",
        entityLabel: "bicicleta",
        heroImageClassName: "mode-bike",
        heroImageSrc: "/motorista/workmode2-bike.png",
        needsPlate: false,
        needsYear: false,
        photoInfo: "ⓘ Envie fotos nítidas da frente, traseira e lateral da bicicleta.",
        photoSubtitle: "Envie fotos nítidas da bicicleta para análise.",
        photoTitle: "Fotos da bicicleta",
        reviewPhotoAlt: "Foto da bicicleta cadastrada",
        slots: [
          { key: "front" as const, label: "Frente" },
          { key: "rear" as const, label: "Traseira" },
          { key: "side" as const, label: "Lateral" },
        ],
      };
    case "car_trip_delivery":
    case "car_delivery":
    default:
      return {
        brandLabel: "Fabricante",
        brandMode: "select" as const,
        dataSubtitle: "Informe os dados do veículo que você usará para realizar corridas.",
        dataTitle: "Dados do veículo",
        emptyPreviewImageSrc: "/motorista/inicio-carro-cidade.png",
        entityLabel: "veículo",
        heroImageClassName: "mode-car",
        heroImageSrc: "/motorista/inicio-carro-cidade.png",
        needsPlate: true,
        needsYear: true,
        photoInfo: "ⓘ Certifique-se de que o veículo esteja bem iluminado e todos os detalhes visíveis.",
        photoSubtitle: "Envie fotos nítidas do veículo para análise.",
        photoTitle: "Fotos do veículo",
        reviewPhotoAlt: "Foto frontal do veículo cadastrado",
        slots: [
          { key: "front" as const, label: "Frente" },
          { key: "rear" as const, label: "Traseira" },
          { key: "side" as const, label: "Lateral" },
          { key: "interior" as const, label: "Interior" },
        ],
      };
  }
}

function VehicleData({
  form,
  go,
  selectedBrand,
  selectedWorkMode,
  setForm,
  setSelectedBrand,
}: {
  form: VehicleForm;
  go: (screen: Screen) => void;
  selectedBrand: VehicleBrandOption | null;
  selectedWorkMode: DriverWorkMode | null;
  setForm: (form: VehicleForm) => void;
  setSelectedBrand: (brand: VehicleBrandOption) => void;
}) {
  const [brands, setBrands] = useState<VehicleBrandOption[]>(fallbackBrands);
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadBrands() {
      try {
        const response = await fetch("https://brasilapi.com.br/api/fipe/marcas/v1/carros");

        if (!response.ok) {
          throw new Error("Nao foi possivel carregar marcas");
        }

        const data = (await response.json()) as Array<{ nome?: string; valor?: string }>;
        const nextBrands = data
          .filter((brand) => brand.nome && brand.valor)
          .map((brand) => ({ codigo: String(brand.valor), nome: String(brand.nome) }))
          .sort((left, right) => left.nome.localeCompare(right.nome, "pt-BR"));

        if (isMounted && nextBrands.length > 0) {
          setBrands(nextBrands);
        }
      } catch {
        if (isMounted) {
          setBrands(fallbackBrands);
        }
      }
    }

    void loadBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  const visibleBrands = brands
    .filter((brand) => brand.nome.toLocaleLowerCase("pt-BR").includes(normalizedQuery))
    .slice(0, 30);
  const modeUi = getWorkModeUi(selectedWorkMode);
  const isFormValid =
    Boolean(selectedBrand) &&
    form.model.trim().length > 0 &&
    (!modeUi.needsYear || form.year.trim().length === 4) &&
    (!modeUi.needsPlate || form.plate.trim().length >= 7);

  return (
    <section className="scroll-screen vehicle-data-screen">
      <div className="vehicle-form-topbar">
        <button aria-label="Voltar" onClick={() => go("vehicle-mode")} type="button">
          <FiArrowLeft aria-hidden="true" />
        </button>
      </div>
      <h1>{modeUi.dataTitle}</h1>
      <p className="vehicle-form-subtitle">{modeUi.dataSubtitle}</p>
      {modeUi.heroImageSrc ? (
        <div aria-hidden="true" className={`vehicle-data-hero ${modeUi.heroImageClassName}`}>
          <Image
            alt=""
            className="vehicle-data-hero-image"
            height={425}
            priority
            src={modeUi.heroImageSrc}
            width={638}
          />
        </div>
      ) : null}
      <div className="vehicle-form-panel">
        <label>{modeUi.brandLabel}</label>
        {modeUi.brandMode === "input" ? (
          <input
            className="vehicle-form-input"
            onChange={(event) =>
              setSelectedBrand({
                codigo: normalizeBrandName(event.target.value || "bike"),
                nome: event.target.value,
              })
            }
            placeholder="Ex: Caloi"
            value={selectedBrand?.nome ?? ""}
          />
        ) : (
          <div className={`select-panel vehicle-inline-select ${isOpen ? "is-open" : ""}`}>
            <button
              aria-expanded={isOpen}
              className="brand-select-trigger vehicle-select-trigger"
              onClick={() => setIsOpen((current) => !current)}
              type="button"
            >
              <span>{selectedBrand?.nome ?? "Selecione o fabricante"}</span>
              <b aria-hidden="true">⌄</b>
            </button>
            {isOpen ? (
              <div className="brand-dropdown vehicle-brand-dropdown">
                <input
                  autoFocus
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar fabricante"
                  value={query}
                />
                <div className="brand-options">
                  {visibleBrands.map((brand) => (
                    <button
                      className={selectedBrand?.codigo === brand.codigo ? "selected" : ""}
                      key={brand.codigo}
                      onClick={() => {
                        setSelectedBrand(brand);
                        setIsOpen(false);
                        setQuery("");
                      }}
                      type="button"
                    >
                      <span>{brand.nome}</span>
                      {selectedBrand?.codigo === brand.codigo ? <b>✓</b> : null}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
        <label>Modelo</label>
        <input
          className="vehicle-form-input"
          onChange={(event) => setForm({ ...form, model: event.target.value })}
          placeholder={modeUi.entityLabel === "bicicleta" ? "Ex: Aro 29 / MTB" : "Onix"}
          value={form.model}
        />
        {modeUi.needsYear ? (
          <>
            <label>Ano</label>
            <input
              className="vehicle-form-input"
              inputMode="numeric"
              maxLength={4}
              onChange={(event) =>
                setForm({ ...form, year: event.target.value.replace(/\D/g, "").slice(0, 4) })
              }
              placeholder="2022"
              value={form.year}
            />
          </>
        ) : null}
        {modeUi.needsPlate ? (
          <>
            <label>Placa</label>
            <input
              className="vehicle-form-input"
              maxLength={7}
              onChange={(event) =>
                setForm({
                  ...form,
                  plate: event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7),
                })
              }
              placeholder="ABC1D23"
              value={form.plate}
            />
            <small className="vehicle-form-note">ⓘ Use letras maiúsculas.</small>
          </>
        ) : null}
      </div>
      <ActionButton disabled={!isFormValid} onClick={() => go("vehicle-photos")}>Continuar</ActionButton>
      <p className="vehicle-data-security">
        <span aria-hidden="true">🛡</span>
        <span>Suas informações estão protegidas e nunca serão compartilhadas.</span>
      </p>
    </section>
  );
}

function VehiclePhotos({
  go,
  selectedWorkMode,
  setVehicleUploads,
  token,
  vehicleUploads,
}: {
  go: (screen: Screen) => void;
  selectedWorkMode: DriverWorkMode | null;
  setVehicleUploads: (uploads: VehicleUploads) => void;
  token?: string;
  vehicleUploads: VehicleUploads;
}) {
  const editingVehicleId = useDriverFlowStore((state) => state.editingVehicleId);
  const inputRefs = {
    front: useRef<HTMLInputElement>(null),
    interior: useRef<HTMLInputElement>(null),
    rear: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
  };
  const [error, setError] = useState("");
  const [previewUrls, setPreviewUrls] = useState<Partial<Record<keyof VehicleUploads, string>>>({});
  const previewUrlsRef = useRef<Partial<Record<keyof VehicleUploads, string>>>({});
  const [uploadingSlot, setUploadingSlot] = useState<keyof VehicleUploads | null>(null);
  const modeUi = getWorkModeUi(selectedWorkMode);
  const slots = modeUi.slots;

  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      Object.values(previewUrlsRef.current).forEach((previewUrl) => {
        if (previewUrl?.startsWith("blob:")) {
          URL.revokeObjectURL(previewUrl);
        }
      });
    };
  }, []);

  async function handleVehiclePhoto(file: File | undefined, key: keyof VehicleUploads) {
    if (!file || !token) {
      setError("Entre ou cadastre-se antes de enviar fotos do veículo.");
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrls((current) => {
      const previousUrl = current[key];
      if (previousUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previousUrl);
      }
      return { ...current, [key]: nextPreviewUrl };
    });
    setUploadingSlot(key);
    setError("");
    try {
      const upload = await uploadDriverImage(token, file, "driver_vehicle");
      setVehicleUploads({ ...vehicleUploads, [key]: upload });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto do veículo.");
    } finally {
      setUploadingSlot(null);
    }
  }

  function handleReplaceAllPhotos() {
    Object.values(previewUrlsRef.current).forEach((previewUrl) => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    });
    setPreviewUrls({});
    setVehicleUploads({});
    setError("");
  }

  return (
    <section className="scroll-screen">
      <AppHeader onBack={() => go(editingVehicleId ? "vehicle-list" : "vehicle-data")} />
      <Progress current={3} total={vehicleSteps} />
      <p className="step-label">3 de 4</p>
      <h1>{editingVehicleId ? `Editar fotos da ${modeUi.entityLabel}` : modeUi.photoTitle}</h1>
      <p className="subtitle">
        {editingVehicleId
          ? `Toque em uma foto para trocar só ela ou substitua todas de uma vez.`
          : modeUi.photoSubtitle}
      </p>
      <p className="info-line">{modeUi.photoInfo}</p>
      {editingVehicleId ? (
        <div className="vehicle-photo-toolbar">
          <button className="vehicle-photo-toolbar-button" onClick={handleReplaceAllPhotos} type="button">
            Trocar todas as fotos
          </button>
        </div>
      ) : null}
      <div className="photo-grid">
        {slots.map((slot) => {
          const previewUrl = previewUrls[slot.key] ?? vehicleUploads[slot.key]?.url;
          const hasPhoto = Boolean(previewUrl);
          const isUploading = uploadingSlot === slot.key;

          return (
            <div className="vehicle-photo" key={slot.key}>
              <div className="vehicle-photo-header">
                <strong>{slot.label}</strong>
                {hasPhoto ? (
                  <span aria-hidden="true" className="vehicle-photo-badge">
                    <Icon name="check" />
                  </span>
                ) : null}
              </div>
              <button
                className={hasPhoto ? "photo-filled" : "photo-empty"}
                onClick={() => inputRefs[slot.key].current?.click()}
                type="button"
              >
                {hasPhoto ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img alt={`${slot.label} do veículo`} className="vehicle-photo-preview" src={previewUrl} />
                    {isUploading ? <span className="vehicle-photo-uploading">Enviando...</span> : null}
                  </>
                ) : (
                  <span className="vehicle-photo-empty-content">
                    <span aria-hidden="true" className="vehicle-photo-empty-icon">
                      <Icon name="camera" />
                    </span>
                    <span>Adicionar foto</span>
                  </span>
                )}
              </button>
              <input
                accept="image/*"
                hidden
                onChange={(event) => handleVehiclePhoto(event.target.files?.[0], slot.key)}
                ref={inputRefs[slot.key]}
                type="file"
              />
              {hasPhoto ? (
                <span className={`vehicle-photo-status ${isUploading ? "is-uploading" : "is-success"}`}>
                  <span aria-hidden="true" className="vehicle-photo-status-icon">
                    {isUploading ? <Icon name="spark" /> : <Icon name="check" />}
                  </span>
                  {isUploading ? "Enviando..." : "Foto enviada"}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <FormToast message={error} />
      <ActionButton onClick={() => go("vehicle-review")}>{editingVehicleId ? "Revisar alterações" : "Enviar fotos"}</ActionButton>
      <button className="outline-back" onClick={() => go(editingVehicleId ? "vehicle-list" : "vehicle-data")} type="button">
        Voltar
      </button>
      <p className="security">▣ Seus dados estão protegidos e usados apenas para verificação.</p>
      <FooterNote />
    </section>
  );
}

function VehicleReview({
  go,
  selectedBrand,
  selectedWorkMode,
  token,
  vehicleForm,
  vehicleUploads,
}: {
  go: (screen: Screen) => void;
  selectedBrand: VehicleBrandOption | null;
  selectedWorkMode: DriverWorkMode | null;
  token?: string;
  vehicleForm: VehicleForm;
  vehicleUploads: VehicleUploads;
}) {
  const editingVehicleId = useDriverFlowStore((state) => state.editingVehicleId);
  const setEditingVehicleId = useDriverFlowStore((state) => state.setEditingVehicleId);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modeUi = getWorkModeUi(selectedWorkMode);

  async function handleTrackStatus() {
    const hasRequiredPlate = !modeUi.needsPlate || Boolean(vehicleForm.plate.trim());

    if (!token || !selectedBrand || !selectedBrand.nome.trim() || !vehicleForm.model.trim() || !hasRequiredPlate) {
      setError(
        modeUi.needsPlate
          ? "Informe marca, modelo e placa antes de enviar."
          : "Informe marca e modelo antes de enviar.",
      );
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      const payload = {
        brand: selectedBrand.nome,
        front_photo_file_id: vehicleUploads.front?.storage_file_id,
        front_photo_url: vehicleUploads.front?.url,
        interior_photo_file_id: vehicleUploads.interior?.storage_file_id,
        interior_photo_url: vehicleUploads.interior?.url,
        model: vehicleForm.model,
        plate: modeUi.needsPlate ? vehicleForm.plate : "BIKE",
        rear_photo_file_id: vehicleUploads.rear?.storage_file_id,
        rear_photo_url: vehicleUploads.rear?.url,
        side_photo_file_id: vehicleUploads.side?.storage_file_id,
        side_photo_url: vehicleUploads.side?.url,
      };

      if (editingVehicleId) {
        await updateDriverVehicle(token, editingVehicleId, payload);
        setEditingVehicleId(undefined);
        go("vehicle-list");
        return;
      }

      await saveDriverVehicle(token, payload);
      go("dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o veículo.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="scroll-screen">
      <AppHeader onBack={() => go("vehicle-photos")} />
      <Progress
        current={4}
        labels={["Dados do veículo", "Documentos e informações", "Fotos do veículo", "4 de 4"]}
        total={vehicleSteps}
      />
      <div className="vehicle-hero vehicle-hero-stacked">
        <div className="vehicle-hero-copy vehicle-hero-copy-wide">
          <h1>{editingVehicleId ? "Alterações prontas para salvar" : "Cadastro enviado para análise"}</h1>
          <p>{editingVehicleId ? "Revise as fotos atualizadas antes de salvar." : "Todos os dados foram recebidos com sucesso."}</p>
        </div>
        <div className="vehicle-review-hero-art" aria-hidden="true">
          <span className="vehicle-review-badge">
            <Icon name="check" />
          </span>
          <span className="vehicle-review-spark one">+</span>
          <span className="vehicle-review-spark two">+</span>
          <span className="vehicle-review-spark three">+</span>
          {vehicleUploads.front?.url ? (
            <div className="vehicle-review-car-photo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={modeUi.reviewPhotoAlt} src={vehicleUploads.front.url} />
            </div>
          ) : (
            <div className="vehicle-review-fallback-image">
              <Image alt="" height={425} src={modeUi.emptyPreviewImageSrc} width={638} />
            </div>
          )}
        </div>
      </div>
      <div className="checklist">
        <span><Icon name="check" /> Cadastro do motorista concluído</span>
        <span><Icon name="check" /> Escolha da modalidade concluída</span>
        <span><Icon name="check" /> CNH enviada</span>
        <span><Icon name="check" /> Dados do veículo cadastrados</span>
        <span><Icon name="check" /> Fotos do veículo enviadas</span>
        <span><Icon name="check" /> Termos e Política aceitos</span>
      </div>
      <div className="success-box review-success-box">
        <span className="review-success-icon" aria-hidden="true">
          <Icon name="shield" />
        </span>
        <div>
          <strong>{editingVehicleId ? "As fotos do veículo serão atualizadas." : "Seu cadastro está em análise."}</strong>
          <p>{editingVehicleId ? "Você pode substituir uma foto específica ou confirmar a troca de todas." : "Nossa equipe fará a avaliação e em breve entrará em contato."}</p>
        </div>
      </div>
      <FormToast message={error} />
      <ActionButton onClick={handleTrackStatus}>{isSubmitting ? "Salvando..." : editingVehicleId ? "Salvar alterações" : "Voltar ao início"}</ActionButton>
      <ActionButton iconDirection="left" onClick={() => go("vehicle-photos")} secondary>
        Voltar
      </ActionButton>
      <div className="benefits inline">
        <span>▣ Cadastro seguro</span>
        <span>☆ Processo rápido</span>
        <span>▤ Mais corridas, mais ganhos</span>
      </div>
      <FooterNote />
    </section>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login");
  const [resetContact, setResetContact] = useState<PasswordResetContact>({});
  const [sessionError, setSessionError] = useState("");
  const [signupStep, setSignupStep] = useState(1);
  const [showSplash, setShowSplash] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [showInstallSheet, setShowInstallSheet] = useState(false);
  const [isIOS] = useState(isIOSDevice);
  const [driverToken, setDriverToken] = useState<string | undefined>();
  const signupForm = useDriverFlowStore((state) => state.signupForm);
  const setSignupForm = useDriverFlowStore((state) => state.setSignupForm);
  const cnhFront = useDriverFlowStore((state) => state.cnhFront);
  const setCnhFront = useDriverFlowStore((state) => state.setCnhFront);
  const cnhBack = useDriverFlowStore((state) => state.cnhBack);
  const setCnhBack = useDriverFlowStore((state) => state.setCnhBack);
  const faceFile = useDriverFlowStore((state) => state.faceFile);
  const setFaceFile = useDriverFlowStore((state) => state.setFaceFile);
  const selectedBrand = useDriverFlowStore((state) => state.selectedBrand);
  const setSelectedBrand = useDriverFlowStore((state) => state.setSelectedBrand);
  const selectedWorkMode = useDriverFlowStore((state) => state.selectedWorkMode);
  const setSelectedWorkMode = useDriverFlowStore((state) => state.setSelectedWorkMode);
  const vehicleForm = useDriverFlowStore((state) => state.vehicleForm);
  const setVehicleForm = useDriverFlowStore((state) => state.setVehicleForm);
  const vehicleUploads = useDriverFlowStore((state) => state.vehicleUploads);
  const setVehicleUploads = useDriverFlowStore((state) => state.setVehicleUploads);
  const resetFlow = useDriverFlowStore((state) => state.resetFlow);
  const handleAuthenticated = useCallback((nextToken: string) => {
    setSessionError("");
    setDriverToken(nextToken);
  }, []);

  const handleExpiredSession = useCallback(() => {
    localStorage.removeItem("suwave-driver-token");
    setDriverToken(undefined);
    setScreen("login");
    setSessionError("Sua sessão expirou. Entre novamente para continuar.");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedToken = getStoredDriverToken();

      if (storedToken) {
        setDriverToken(storedToken);
        setScreen("dashboard");
      }
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    function handleAuthExpired() {
      handleExpiredSession();
    }

    window.addEventListener(DRIVER_AUTH_EXPIRED_EVENT, handleAuthExpired);

    return () => {
      window.removeEventListener(DRIVER_AUTH_EXPIRED_EVENT, handleAuthExpired);
    };
  }, [handleExpiredSession]);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
    const isMobileViewport = window.matchMedia("(max-width: 560px)").matches;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (isStandalone || !isMobileViewport || !isTouchDevice) {
      return;
    }

    const sheetTimer = window.setTimeout(() => setShowInstallSheet(true), 700);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setShowInstallSheet(true);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowInstallSheet(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.clearTimeout(sheetTimer);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstallApp() {
    if (isIOS || !installPrompt) {
      setShowInstallSheet(false);
      return;
    }

    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    setShowInstallSheet(false);
  }

  const handleLogout = useCallback(() => {
    localStorage.removeItem("suwave-driver-token");
    setDriverToken(undefined);
    setScreen("login");
    setSessionError("");
  }, []);

  useEffect(() => {
    localStorage.removeItem("suwave-driver-flow");
    localStorage.removeItem("suwave-driver-flow-v2");
    localStorage.removeItem("suwave-driver-finance-draft");
    resetFlow();
  }, [resetFlow]);

  const content = useMemo(() => {
    const go = setScreen;
    switch (screen) {
      case "forgot-password":
        return <ForgotPassword go={go} setResetContact={setResetContact} />;
      case "forgot-success":
        return <ForgotPasswordSuccess contact={resetContact} go={go} />;
      case "signup":
        return (
          <Signup
            form={signupForm}
            go={go}
            setForm={setSignupForm}
            setSignupStep={setSignupStep}
            signupStep={signupStep}
          />
        );
      case "terms":
        return <TermsScreen form={signupForm} go={go} setForm={setSignupForm} />;
      case "face":
        return (
          <FacePhoto
            faceFile={faceFile}
            go={go}
            onBack={() => {
              setSignupStep(2);
              go("terms");
            }}
            setFaceFile={setFaceFile}
          />
        );
      case "cnh":
        return (
          <Cnh
            cnhBack={cnhBack}
            cnhFront={cnhFront}
            faceFile={faceFile}
            go={go}
            onAuthenticated={handleAuthenticated}
            resetFlow={resetFlow}
            setCnhBack={setCnhBack}
            setCnhFront={setCnhFront}
            signupForm={signupForm}
          />
        );
      case "submitted":
        return <Submitted go={go} />;
      case "status":
        return <Status go={go} token={driverToken} />;
      case "dashboard":
        return <Dashboard go={go} onLogout={handleLogout} token={driverToken} />;
      case "profile":
        return <DriverProfileScreen go={go} onLogout={handleLogout} token={driverToken} />;
      case "register-trip":
        return <RegisterTrip go={go} token={driverToken} />;
      case "trip-history":
        return <TripHistory go={go} token={driverToken} />;
      case "vehicle-list":
        return <VehicleListScreen go={go} token={driverToken} />;
      case "vehicle-mode":
        return <VehicleMode go={go} selectedWorkMode={selectedWorkMode} setSelectedWorkMode={setSelectedWorkMode} />;
      case "vehicle-brand":
        return (
          <VehicleData
            form={vehicleForm}
            go={go}
            selectedBrand={selectedBrand}
            selectedWorkMode={selectedWorkMode}
            setForm={setVehicleForm}
            setSelectedBrand={setSelectedBrand}
          />
        );
      case "vehicle-data":
        return (
          <VehicleData
            form={vehicleForm}
            go={go}
            selectedBrand={selectedBrand}
            selectedWorkMode={selectedWorkMode}
            setForm={setVehicleForm}
            setSelectedBrand={setSelectedBrand}
          />
        );
      case "vehicle-photos":
        return (
          <VehiclePhotos
            go={go}
            selectedWorkMode={selectedWorkMode}
            setVehicleUploads={setVehicleUploads}
            token={driverToken}
            vehicleUploads={vehicleUploads}
          />
        );
      case "vehicle-review":
        return (
          <VehicleReview
            go={go}
            selectedBrand={selectedBrand}
            selectedWorkMode={selectedWorkMode}
            token={driverToken}
            vehicleForm={vehicleForm}
            vehicleUploads={vehicleUploads}
          />
        );
      default:
        return <Login initialError={sessionError} go={go} onAuthenticated={handleAuthenticated} onClearInitialError={() => setSessionError("")} />;
    }
  }, [
    cnhBack,
    cnhFront,
    driverToken,
    faceFile,
    handleAuthenticated,
    handleLogout,
    resetFlow,
    resetContact,
    screen,
    sessionError,
    selectedBrand,
    selectedWorkMode,
    setCnhBack,
    setCnhFront,
    setFaceFile,
    setSelectedBrand,
    setSelectedWorkMode,
    setSignupForm,
    setSignupStep,
    setVehicleForm,
    setVehicleUploads,
    signupForm,
    signupStep,
    vehicleForm,
    vehicleUploads,
  ]);

  return (
    <main className={`stage ${showSplash ? "splash-active" : ""}`}>
      <section className="phone">
        <div className="screen">
          <StatusBar />
          {content}
          {showSplash ? <Splash /> : null}
        </div>
      </section>
      {showInstallSheet && !showSplash ? (
        <InstallSheet
          canInstall={Boolean(installPrompt)}
          isIOS={isIOS}
          onClose={() => setShowInstallSheet(false)}
          onInstall={handleInstallApp}
        />
      ) : null}
    </main>
  );
}
