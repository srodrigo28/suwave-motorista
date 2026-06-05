"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDriverReviewStatus,
  acceptDriverRideRequest,
  checkDriverAccountAvailability,
  declineDriverRideRequest,
  DriverApiError,
  getDriverTerms,
  loginDriverAccount,
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
  uploadDriverImage,
  type DriverRideRequest,
  type DriverTerms,
} from "@/services/driver-client";
import {
  useDriverFlowStore,
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
  | "vehicle-brand"
  | "vehicle-data"
  | "vehicle-photos"
  | "vehicle-review";

type PasswordResetContact = {
  email?: string;
  whatsapp?: string;
};

const primarySteps = ["1", "2", "3", "4", "5"];
const vehicleSteps = ["1", "2", "3", "4"];

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
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
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
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 20 6v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Z" />
          <path d="m9 12 2 2 4-5" />
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
  inputMode,
  icon,
  label,
  maxLength,
  onChange,
  secure = false,
  type,
  value,
}: {
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
    <label className="field">
      <span className="field-icon">
        <Icon name={icon} />
      </span>
      <input
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
  onClick,
  secondary = false,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button className={secondary ? "action secondary" : "action"} disabled={disabled} onClick={onClick} type="button">
      {children}
      <span aria-hidden="true" className="action-icon">
        <svg fill="none" viewBox="0 0 24 24">
          <path d="M5 12h13" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      </span>
    </button>
  );
}

function FormToast({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <div aria-live="polite" className="form-toast" role="status">
      <span aria-hidden="true">!</span>
      <p>{message}</p>
    </div>
  );
}

function FooterNote() {
  return null;
}

function Login({
  go,
  onAuthenticated,
}: {
  go: (screen: Screen) => void;
  onAuthenticated: (token: string) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin() {
    setIsSubmitting(true);
    setError("");
    try {
      const isEmail = identifier.includes("@");
      const session = await loginDriverAccount({
        ...(isEmail ? { email: identifier } : { whatsapp: identifier }),
        password,
      });
      localStorage.setItem("suwave-driver-token", session.access_token);
      onAuthenticated(session.access_token);
      go("dashboard");
    } catch (err) {
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
      <FormToast message={error} />
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

  async function handleSubmit() {
    setMessage("");
    const cleanEmail = email.trim();
    const cleanWhatsapp = onlyDigits(whatsapp);

    if (!cleanEmail && !cleanWhatsapp) {
      setMessage("Informe seu e-mail ou WhatsApp para redefinir sua senha.");
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
      <Field icon="mail" label="E-mail" onChange={setEmail} type="email" value={email} />
      <Field icon="whatsapp" inputMode="tel" label="WhatsApp" onChange={(value) => setWhatsapp(maskPhone(value))} value={whatsapp} />
      <FormToast message={message} />
      <ActionButton onClick={handleSubmit}>{isSubmitting ? "Enviando..." : "Redefinir senha"}</ActionButton>
      <ActionButton onClick={() => go("login")} secondary>
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
      <ActionButton onClick={() => go("login")}>Voltar para entrar</ActionButton>
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

    return true;
  }

  async function validateAvailability(input: { cpf?: string; email?: string; whatsapp?: string }) {
    const availability = await checkDriverAccountAvailability(input);

    if (availability.conflicts.whatsapp) {
      setError("Este WhatsApp já está cadastrado. Entre na conta existente ou use outro número.");
      return false;
    }

    if (availability.conflicts.cpf) {
      setError("Este CPF já está cadastrado. Entre na conta existente ou use a recuperação de senha.");
      return false;
    }

    return true;
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
      if (await validateAvailability({ cpf, email, whatsapp })) {
        setError("");
        go("terms");
      }
    } catch (err) {
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
  const [error, setError] = useState("");

  function handleFaceFile(file?: File) {
    if (!file) {
      setError("Selecione uma foto do rosto para continuar.");
      return;
    }

    setError("");
    setFaceFile(file);
  }

  function handleNext() {
    if (!faceFile) {
      setError("Selecione uma foto do rosto para continuar.");
      return;
    }

    setError("");
    go("cnh");
  }

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
      <button
        aria-label="Abrir câmera para tirar foto do rosto"
        className="face-card"
        onClick={() => fileInputRef.current?.click()}
        type="button"
      >
        <Image
          alt="Modelo de posicionamento correto do rosto"
          className="face-reference-photo"
          height={1024}
          priority
          src="/face-validation-model.png"
          width={1024}
        />
        <span className="tip left">
          <Icon name="spark" /> Boa iluminação
        </span>
        <span className="tip right">
          <Icon name="user" /> Rosto centralizado
        </span>
        <div className="face-oval" />
        <span className="tip bottom">
          <Icon name="ban" /> Sem acessórios que cubram o rosto
        </span>
      </button>
      <div className="success-line">
        <span>✓</span>
        Foto válida! Sua foto está nítida e bem enquadrada.
      </div>
      <input
        accept="image/*"
        capture="user"
        hidden
        onChange={(event) => handleFaceFile(event.target.files?.[0])}
        ref={fileInputRef}
        type="file"
      />
      <FormToast message={error} />
      <ActionButton onClick={handleNext}>Próximo</ActionButton>
      <ActionButton onClick={() => fileInputRef.current?.click()} secondary>
        Tentar novamente
      </ActionButton>
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
    setError("");
    try {
      const email = signupForm.email.trim().toLowerCase();
      let session;

      try {
        session = await registerDriverAccount({
          birth_date: birthDateIso || undefined,
          cpf,
          email,
          full_name: signupForm.full_name,
          password: signupForm.password,
          whatsapp,
        });
      } catch (err) {
        if (!(err instanceof DriverApiError)) {
          throw err;
        }

        if (err.code === "cpf_already_exists") {
          throw new Error("Este CPF já está cadastrado. Entre na conta existente ou use a recuperação de senha.");
        }

        if (err.code === "whatsapp_already_exists") {
          throw new Error("Este WhatsApp já está cadastrado. Entre na conta existente ou use a recuperação de senha.");
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

      await saveDriverProfile(session.access_token, {
        birth_date: birthDateIso || undefined,
        cnpj,
        cpf,
        email,
        full_name: signupForm.full_name,
        phone: whatsapp,
        pix_account: signupForm.pix_account.trim(),
        pix_key_type: signupForm.pix_key_type,
      });

      const faceUpload = await uploadDriverImage(session.access_token, faceFile, "driver_face");
      await saveDriverFacePhoto(session.access_token, faceUpload);

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
      await submitDriverReview(session.access_token);
      resetFlow();
      go("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível finalizar o cadastro.");
    } finally {
      setIsSubmitting(false);
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
        {isSubmitting ? "Concluindo..." : "Concluir cadastro"}
      </ActionButton>
      <ActionButton onClick={() => go("face")} secondary>
        Voltar
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function Submitted({ go }: { go: (screen: Screen) => void }) {
  return (
    <section className="scroll-screen center-screen">
      <BrandLockup />
      <Progress current={5} total={primarySteps} />
      <div className="hero-car approved" aria-hidden="true">
        <div className="check">✓</div>
        <div className="town" />
        <div className="car">
          <span />
        </div>
      </div>
      <h1>Cadastro enviado</h1>
      <p className="subtitle">Agora é só aguardar a análise.</p>
      <div className="checklist">
        <span>✓ Dados pessoais preenchidos</span>
        <span>✓ Foto do rosto validada</span>
        <span>✓ CNH enviada</span>
        <span>✓ Cadastro concluído</span>
      </div>
      <p className="calendar-line">▣ No MVP, a aprovação é simulada em até 10 minutos.</p>
      <ActionButton onClick={() => go("status")}>Acompanhar aprovação</ActionButton>
      <ActionButton onClick={() => go("login")} secondary>
        Voltar ao login
      </ActionButton>
      <FooterNote />
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

function Dashboard({ go, token }: { go: (screen: Screen) => void; token?: string }) {
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rideRequests, setRideRequests] = useState<DriverRideRequest[]>([]);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);
  const [rideFeedback, setRideFeedback] = useState("");
  const [isDriverMenuOpen, setIsDriverMenuOpen] = useState(false);

  useEffect(() => {
    if (!isOnline || !token) {
      return;
    }

    const activeToken = token;
    let cancelled = false;

    async function syncLocation() {
      try {
        await sendCurrentDriverLocation(activeToken);
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
    if (!isOnline || !token) {
      return;
    }

    const activeToken = token;
    let cancelled = false;

    async function syncRideRequests() {
      try {
        const requests = await listDriverRideRequests(activeToken);
        if (!cancelled) {
          setRideRequests(requests);
        }
      } catch (err) {
        if (!cancelled) {
          setRideFeedback(err instanceof Error ? err.message : "Não foi possível buscar corridas.");
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
        setRideRequests([]);
        return;
      }

      await sendCurrentDriverLocation(token);
      const availability = await setDriverOnline(token);
      setIsOnline(availability.is_online);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível alterar sua disponibilidade.");
    } finally {
      setIsSubmitting(false);
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
    } catch (err) {
      setRideFeedback(err instanceof Error ? err.message : "Não foi possível responder a corrida.");
    } finally {
      setBusyRideId(null);
    }
  }

  return (
    <section className="map-screen">
      <div className="map-art">
        <span className="pin">●</span>
        <span className="car-dot one" />
        <span className="car-dot two" />
        <span className="car-dot three" />
      </div>
      <div className="bottom-sheet">
        <div className="sheet-handle-row">
          <i />
          <button
            aria-expanded={isDriverMenuOpen}
            aria-label="Abrir menu do motorista"
            className="driver-menu-button"
            onClick={() => setIsDriverMenuOpen(true)}
            type="button"
          >
            <Icon name="menu" />
          </button>
        </div>
        <div className="sheet-title">
          <div aria-hidden="true" />
          <div className="mini-car" />
        </div>
        <FormToast message={error} />
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
        {rideFeedback ? <p className="ride-feedback">{rideFeedback}</p> : null}
        <ActionButton onClick={handleToggleOnline}>
          {isSubmitting ? "Atualizando..." : isOnline ? "Ficar offline" : "Online"}
        </ActionButton>
        <ActionButton onClick={() => go("vehicle-brand")} secondary>
          Adicionar veículo
        </ActionButton>
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
            <button type="button">
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
                go("vehicle-brand");
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
      <AppHeader onBack={() => go("dashboard")} />
      <div className="title-row">
        <h1>Cadastrar veículo</h1>
        <span>1/4</span>
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
      <button className="outline-back" onClick={() => go("dashboard")} type="button">
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
      <button onClick={onBack} type="button">
        ←
      </button>
      <BrandLockup compact />
      <button type="button">♙</button>
    </header>
  );
}

function VehicleData({
  form,
  go,
  setForm,
}: {
  form: VehicleForm;
  go: (screen: Screen) => void;
  setForm: (form: VehicleForm) => void;
}) {
  return (
    <section className="scroll-screen">
      <AppHeader onBack={() => go("vehicle-brand")} />
      <Progress current={2} labels={["Conta", "Veículo", "Documentos", "Confirmação"]} total={vehicleSteps} />
      <h1>Dados do veículo</h1>
      <p className="subtitle left">Informe os dados do veículo que você usará para realizar corridas.</p>
      <div className="form-card">
        <label>Modelo</label>
        <input
          onChange={(event) => setForm({ ...form, model: event.target.value })}
          placeholder="Ex: Onix"
          value={form.model}
        />
        <label>Placa</label>
        <input
          onChange={(event) => setForm({ ...form, plate: event.target.value.toUpperCase() })}
          placeholder="ABC1D23"
          value={form.plate}
        />
        <small>ⓘ Use letras maiúsculas.</small>
      </div>
      <ActionButton onClick={() => go("vehicle-photos")}>Continuar</ActionButton>
      <button className="outline-back" onClick={() => go("vehicle-brand")} type="button">
        Voltar
      </button>
      <p className="security">▣ Suas informações estão protegidas e nunca serão compartilhadas.</p>
      <FooterNote />
    </section>
  );
}

function VehiclePhotos({
  go,
  setVehicleUploads,
  token,
  vehicleUploads,
}: {
  go: (screen: Screen) => void;
  setVehicleUploads: (uploads: VehicleUploads) => void;
  token?: string;
  vehicleUploads: VehicleUploads;
}) {
  const inputRefs = {
    front: useRef<HTMLInputElement>(null),
    interior: useRef<HTMLInputElement>(null),
    rear: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
  };
  const [error, setError] = useState("");
  const [uploadingSlot, setUploadingSlot] = useState<keyof VehicleUploads | null>(null);
  const slots: Array<{ key: keyof VehicleUploads; label: string }> = [
    { key: "front", label: "Frente" },
    { key: "rear", label: "Traseira" },
    { key: "side", label: "Lateral" },
    { key: "interior", label: "Interior" },
  ];

  async function handleVehiclePhoto(file: File | undefined, key: keyof VehicleUploads) {
    if (!file || !token) {
      setError("Entre ou cadastre-se antes de enviar fotos do veículo.");
      return;
    }

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

  return (
    <section className="scroll-screen">
      <AppHeader onBack={() => go("vehicle-data")} />
      <Progress current={3} total={vehicleSteps} />
      <p className="step-label">3 de 4</p>
      <h1>Fotos do veículo</h1>
      <p className="subtitle">Envie fotos nitidas para análise.</p>
      <p className="info-line">ⓘ Certifique-se de que o veículo esteja bem iluminado e todos os detalhes visíveis.</p>
      <div className="photo-grid">
        {slots.map((slot) => (
          <div className="vehicle-photo" key={slot.key}>
            <strong>{slot.label}</strong>
            <button
              className={vehicleUploads[slot.key] ? "photo-filled" : "photo-empty"}
              onClick={() => inputRefs[slot.key].current?.click()}
              type="button"
            >
              {vehicleUploads[slot.key] ? "" : <Icon name="camera" />}
            </button>
            <input
              accept="image/*"
              hidden
              onChange={(event) => handleVehiclePhoto(event.target.files?.[0], slot.key)}
              ref={inputRefs[slot.key]}
              type="file"
            />
            <span>
              {uploadingSlot === slot.key
                ? "Enviando..."
                : vehicleUploads[slot.key]
                  ? "✓ Foto enviada"
                  : "Adicionar foto"}
            </span>
          </div>
        ))}
      </div>
      <FormToast message={error} />
      <ActionButton onClick={() => go("vehicle-review")}>Enviar fotos</ActionButton>
      <button className="outline-back" onClick={() => go("vehicle-data")} type="button">
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
  token,
  vehicleForm,
  vehicleUploads,
}: {
  go: (screen: Screen) => void;
  selectedBrand: VehicleBrandOption | null;
  token?: string;
  vehicleForm: VehicleForm;
  vehicleUploads: VehicleUploads;
}) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleTrackStatus() {
    if (!token || !selectedBrand || !vehicleForm.model || !vehicleForm.plate) {
      setError("Informe marca, modelo e placa antes de enviar.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await saveDriverVehicle(token, {
        brand: selectedBrand.nome,
        front_photo_file_id: vehicleUploads.front?.storage_file_id,
        front_photo_url: vehicleUploads.front?.url,
        interior_photo_file_id: vehicleUploads.interior?.storage_file_id,
        interior_photo_url: vehicleUploads.interior?.url,
        model: vehicleForm.model,
        plate: vehicleForm.plate,
        rear_photo_file_id: vehicleUploads.rear?.storage_file_id,
        rear_photo_url: vehicleUploads.rear?.url,
        side_photo_file_id: vehicleUploads.side?.storage_file_id,
        side_photo_url: vehicleUploads.side?.url,
      });
      go("status");
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
      <div className="vehicle-hero">
        <div>
          <h1>Aguardando aprovação</h1>
          <p>Seu cadastro foi enviado com sucesso.</p>
        </div>
        <div className="mini-car large" />
      </div>
      <div className="checklist">
        <span>✓ Fabricante selecionado</span>
        <span>✓ Modelo e placa cadastrados</span>
        <span>✓ Fotos enviadas</span>
      </div>
      <div className="success-box">▣ Seu veículo está em análise. Em breve você receberá a aprovação.</div>
      <FormToast message={error} />
      <ActionButton onClick={handleTrackStatus}>{isSubmitting ? "Salvando..." : "Acompanhar status"}</ActionButton>
      <ActionButton onClick={() => go("vehicle-photos")} secondary>
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
  const [signupStep, setSignupStep] = useState(1);
  const [showSplash, setShowSplash] = useState(true);
  const [driverToken, setDriverToken] = useState<string | undefined>(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return localStorage.getItem("suwave-driver-token") ?? undefined;
  });
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
  const vehicleForm = useDriverFlowStore((state) => state.vehicleForm);
  const setVehicleForm = useDriverFlowStore((state) => state.setVehicleForm);
  const vehicleUploads = useDriverFlowStore((state) => state.vehicleUploads);
  const setVehicleUploads = useDriverFlowStore((state) => state.setVehicleUploads);
  const resetFlow = useDriverFlowStore((state) => state.resetFlow);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 2300);
    return () => window.clearTimeout(timer);
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
            onAuthenticated={setDriverToken}
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
        return <Dashboard go={go} token={driverToken} />;
      case "vehicle-brand":
        return <VehicleBrand go={go} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />;
      case "vehicle-data":
        return <VehicleData form={vehicleForm} go={go} setForm={setVehicleForm} />;
      case "vehicle-photos":
        return (
          <VehiclePhotos
            go={go}
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
            token={driverToken}
            vehicleForm={vehicleForm}
            vehicleUploads={vehicleUploads}
          />
        );
      default:
        return <Login go={go} onAuthenticated={setDriverToken} />;
    }
  }, [
    cnhBack,
    cnhFront,
    driverToken,
    faceFile,
    resetFlow,
    resetContact,
    screen,
    selectedBrand,
    setCnhBack,
    setCnhFront,
    setFaceFile,
    setSelectedBrand,
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
    </main>
  );
}
