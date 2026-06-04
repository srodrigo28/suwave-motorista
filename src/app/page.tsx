"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getDriverReviewStatus,
  loginDriverAccount,
  registerDriverAccount,
  saveDriverCnh,
  saveDriverFacePhoto,
  saveDriverProfile,
  saveDriverVehicle,
  submitDriverReview,
  uploadDriverImage,
  type UploadResult,
} from "@/services/driver-client";

type Screen =
  | "login"
  | "signup"
  | "face"
  | "cnh"
  | "submitted"
  | "status"
  | "dashboard"
  | "vehicle-brand"
  | "vehicle-data"
  | "vehicle-photos"
  | "vehicle-review";

const primarySteps = ["1", "2", "3"];
const vehicleSteps = ["1", "2", "3", "4"];

type VehicleBrandOption = {
  codigo: string;
  nome: string;
};

type DriverSignupForm = {
  birth_date: string;
  confirm_password: string;
  cpf: string;
  email: string;
  full_name: string;
  password: string;
  whatsapp: string;
};

type VehicleForm = {
  model: string;
  plate: string;
};

type VehicleUploads = {
  front?: UploadResult;
  interior?: UploadResult;
  rear?: UploadResult;
  side?: UploadResult;
};

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
      <div>
        <strong>SUWAVE</strong>
        <small>Motorista</small>
      </div>
    </div>
  );
}

function Splash() {
  return (
    <div className="splash" aria-label="Suwave Motorista">
      <div className="splash-mark">
        <strong>suwave</strong>
        <span>motorista</span>
        <i aria-hidden="true" />
      </div>
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
    <div className="progress">
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
  icon,
  label,
  onChange,
  secure = false,
  type,
  value,
}: {
  icon: string;
  label: string;
  onChange?: (value: string) => void;
  secure?: boolean;
  type?: string;
  value?: string;
}) {
  return (
    <label className="field">
      <span className="field-icon">
        <Icon name={icon} />
      </span>
      <input
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={label}
        type={type ?? (secure ? "password" : "text")}
        value={value}
      />
      {secure ? (
        <b className="field-eye">
          <Icon name="eye" />
        </b>
      ) : null}
    </label>
  );
}

function ActionButton({
  children,
  onClick,
  secondary = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  secondary?: boolean;
}) {
  return (
    <button className={secondary ? "action secondary" : "action"} onClick={onClick} type="button">
      {children}
      <span aria-hidden="true">{secondary ? "›" : "→"}</span>
    </button>
  );
}

function FooterNote() {
  return (
    <footer className="footer-note">
      <span aria-hidden="true">
        <Icon name="home" />
      </span>
      <p>Mobilidade pensada para cidades pequenas</p>
    </footer>
  );
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
    <section className="scroll-screen center-screen">
      <BrandLockup />
      <div className="hero-car" aria-hidden="true">
        <div className="town" />
        <div className="car">
          <span />
        </div>
      </div>
      <h1>Dirija na sua cidade</h1>
      <Field icon="mail" label="E-mail ou WhatsApp" onChange={setIdentifier} value={identifier} />
      <Field icon="lock" label="Senha" onChange={setPassword} secure value={password} />
      <button className="link-button" type="button">
        Esqueci minha senha
      </button>
      {error ? <p className="form-error">{error}</p> : null}
      <ActionButton onClick={handleLogin}>{isSubmitting ? "Entrando..." : "Entrar"}</ActionButton>
      <ActionButton onClick={() => go("signup")} secondary>
        Cadastrar
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function Signup({
  form,
  go,
  onAuthenticated,
  setForm,
}: {
  form: DriverSignupForm;
  go: (screen: Screen) => void;
  onAuthenticated: (token: string) => void;
  setForm: (form: DriverSignupForm) => void;
}) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof DriverSignupForm, value: string) {
    setForm({ ...form, [field]: value });
  }

  async function handleContinue() {
    setError("");
    if (form.password !== form.confirm_password) {
      setError("As senhas precisam ser iguais.");
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await registerDriverAccount({
        birth_date: form.birth_date || undefined,
        cpf: form.cpf || undefined,
        email: form.email,
        full_name: form.full_name,
        password: form.password,
        whatsapp: form.whatsapp || undefined,
      });
      localStorage.setItem("suwave-driver-token", session.access_token);
      onAuthenticated(session.access_token);
      await saveDriverProfile(session.access_token, {
        birth_date: form.birth_date || undefined,
        cpf: form.cpf || undefined,
        email: form.email,
        full_name: form.full_name,
        phone: form.whatsapp || undefined,
      });
      go("face");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o cadastro.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="scroll-screen">
      <BrandLockup compact />
      <Progress current={1} total={primarySteps} />
      <p className="step-label">1 de 3</p>
      <h1>Cadastro do motorista</h1>
      <p className="subtitle">Preencha seus dados</p>
      <div className="form-stack">
        <Field icon="user" label="Nome completo" onChange={(value) => updateField("full_name", value)} value={form.full_name} />
        <Field
          icon="calendar"
          label="Data de nascimento"
          onChange={(value) => updateField("birth_date", value)}
          type="date"
          value={form.birth_date}
        />
        <Field icon="id" label="CPF" onChange={(value) => updateField("cpf", value)} value={form.cpf} />
        <Field icon="mail" label="E-mail" onChange={(value) => updateField("email", value)} type="email" value={form.email} />
        <Field icon="phone" label="WhatsApp" onChange={(value) => updateField("whatsapp", value)} value={form.whatsapp} />
        <Field icon="lock" label="Senha" onChange={(value) => updateField("password", value)} secure value={form.password} />
        <Field
          icon="lock"
          label="Confirmar senha"
          onChange={(value) => updateField("confirm_password", value)}
          secure
          value={form.confirm_password}
        />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <ActionButton onClick={handleContinue}>{isSubmitting ? "Salvando..." : "Continuar"}</ActionButton>
      <button className="plain-back" onClick={() => go("login")} type="button">
        Voltar
      </button>
    </section>
  );
}

function FacePhoto({
  go,
  token,
}: {
  go: (screen: Screen) => void;
  token?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function handleFaceFile(file?: File) {
    if (!file || !token) {
      setError("Entre ou cadastre-se antes de enviar a foto.");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const upload = await uploadDriverImage(token, file, "driver_face");
      await saveDriverFacePhoto(token, upload);
      go("cnh");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="scroll-screen face-screen">
      <button className="icon-back" onClick={() => go("signup")} type="button">
        ←
      </button>
      <h1>Validar foto do rosto</h1>
      <p className="subtitle">Tire uma foto nitida do seu rosto</p>
      <div className="face-card">
        <span className="tip left">
          <Icon name="spark" /> Boa iluminação
        </span>
        <span className="tip right">
          <Icon name="user" /> Rosto centralizado
        </span>
        <div className="face-oval" />
        <div className="avatar-face">
          <i className="hair" />
          <i className="head" />
          <i className="neck" />
          <i className="shirt" />
          <i className="eye left-eye" />
          <i className="eye right-eye" />
          <i className="nose" />
          <i className="mouth" />
        </div>
        <span className="tip bottom">
          <Icon name="ban" /> Sem acessórios que cubram o rosto
        </span>
      </div>
      <div className="success-line">
        <span>✓</span>
        Foto válida! Sua foto está nitida e bem enquadrada.
      </div>
      <input
        accept="image/*"
        capture="user"
        hidden
        onChange={(event) => handleFaceFile(event.target.files?.[0])}
        ref={fileInputRef}
        type="file"
      />
      {error ? <p className="form-error">{error}</p> : null}
      <button className="action camera-action" onClick={() => fileInputRef.current?.click()} type="button">
        <Icon name="camera" />
        {isUploading ? "Enviando..." : "Abrir câmera"}
      </button>
      <ActionButton onClick={() => go("face")} secondary>
        Tentar novamente
      </ActionButton>
      <p className="security">▣ Suas fotos são protegidas e usadas apenas para verificação de segurança.</p>
    </section>
  );
}

function Cnh({
  cnhBack,
  cnhFront,
  go,
  setCnhBack,
  setCnhFront,
  token,
}: {
  cnhBack?: UploadResult;
  cnhFront?: UploadResult;
  go: (screen: Screen) => void;
  setCnhBack: (upload: UploadResult) => void;
  setCnhFront: (upload: UploadResult) => void;
  token?: string;
}) {
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [uploadingSide, setUploadingSide] = useState<"front" | "back" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleUpload(file: File | undefined, side: "front" | "back") {
    if (!file || !token) {
      setError("Entre ou cadastre-se antes de enviar a CNH.");
      return;
    }

    setUploadingSide(side);
    setError("");
    try {
      const upload = await uploadDriverImage(token, file, "driver_cnh");
      if (side === "front") {
        setCnhFront(upload);
      } else {
        setCnhBack(upload);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a CNH.");
    } finally {
      setUploadingSide(null);
    }
  }

  async function handleFinish() {
    if (!token || !cnhFront || !cnhBack) {
      setError("Envie frente e verso da CNH antes de finalizar.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await saveDriverCnh(token, {
        cnh_back_file_id: cnhBack.storage_file_id,
        cnh_back_url: cnhBack.url,
        cnh_front_file_id: cnhFront.storage_file_id,
        cnh_front_url: cnhFront.url,
      });
      await submitDriverReview(token);
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
      <p className="step-label strong">3 de 3</p>
      <Progress current={3} total={primarySteps} />
      <h1>Enviar CNH</h1>
      <p className="subtitle">Envie imagens nitidas do documento</p>
      <div className="upload-card">
        <strong>Frente da CNH</strong>
        <div className="doc-preview cnh-front">
          <i />
          <b />
          <span />
        </div>
        <span>{cnhFront ? "✓ Enviado" : "Pendente"}</span>
        <input
          accept="image/*,.pdf"
          hidden
          onChange={(event) => handleUpload(event.target.files?.[0], "front")}
          ref={frontInputRef}
          type="file"
        />
        <button onClick={() => frontInputRef.current?.click()} type="button">
          <Icon name="camera" />
          {uploadingSide === "front" ? "Enviando..." : cnhFront ? "Trocar imagem" : "Enviar imagem"}
        </button>
      </div>
      <div className="upload-card">
        <strong>Verso da CNH</strong>
        <div className="doc-preview cnh-back">
          <i />
          <b />
        </div>
        <span>{cnhBack ? "✓ Enviado" : "Pendente"}</span>
        <input
          accept="image/*,.pdf"
          hidden
          onChange={(event) => handleUpload(event.target.files?.[0], "back")}
          ref={backInputRef}
          type="file"
        />
        <button onClick={() => backInputRef.current?.click()} type="button">
          <Icon name="camera" />
          {uploadingSide === "back" ? "Enviando..." : cnhBack ? "Trocar imagem" : "Enviar imagem"}
        </button>
      </div>
      <p className="info-line">ⓘ Verifique se todos os dados estão legíveis</p>
      {error ? <p className="form-error">{error}</p> : null}
      <ActionButton onClick={handleFinish}>{isSubmitting ? "Finalizando..." : "Finalizar cadastro"}</ActionButton>
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
      </div>
      <p className="calendar-line">▣ Seu cadastro será analisado em breve.</p>
      <ActionButton onClick={() => go("status")}>Acompanhar status</ActionButton>
      <ActionButton onClick={() => go("login")} secondary>
        Voltar ao login
      </ActionButton>
      <FooterNote />
    </section>
  );
}

function Status({
  go,
  token,
}: {
  go: (screen: Screen) => void;
  token?: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(9 * 60);
  const [statusText, setStatusText] = useState("EM_ANALISE");
  const [error, setError] = useState("");
  const minutesLeft = Math.ceil(secondsLeft / 60);
  const progress = Math.max(0, Math.min(1, secondsLeft / (9 * 60)));

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
      <p className="subtitle">Estamos verificando seus dados. No MVP, a aprovação é simulada em até 10 minutos.</p>
      {error ? <p className="form-error">{error}</p> : null}
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
    </section>
  );
}

function Dashboard({ go }: { go: (screen: Screen) => void }) {
  return (
    <section className="map-screen">
      <div className="map-art">
        <span className="pin">●</span>
        <span className="car-dot one" />
        <span className="car-dot two" />
        <span className="car-dot three" />
      </div>
      <header className="floating-header">
        <BrandLockup compact />
        <button type="button">♙</button>
      </header>
      <div className="bottom-sheet">
        <i />
        <div className="sheet-title">
          <div>
            <h1>Dirija na sua cidade</h1>
            <p>Mobilidade pensada para cidades pequenas</p>
          </div>
          <div className="mini-car" />
        </div>
        <ActionButton onClick={() => go("dashboard")}>Online</ActionButton>
        <ActionButton onClick={() => go("vehicle-brand")} secondary>
          Adicionar veículo
        </ActionButton>
        <div className="benefits">
          <span>▣ Ganhe dirigindo com segurança</span>
          <span>☆ Você define seus horários</span>
          <span>▤ Mais corridas, mais ganhos</span>
        </div>
      </div>
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
      {error ? <p className="form-error">{error}</p> : null}
      <ActionButton onClick={() => go("vehicle-review")}>Enviar fotos</ActionButton>
      <button className="outline-back" onClick={() => go("vehicle-data")} type="button">
        Voltar
      </button>
      <p className="security">▣ Seus dados estão protegidos e usados apenas para verificação.</p>
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
      {error ? <p className="form-error">{error}</p> : null}
      <ActionButton onClick={handleTrackStatus}>{isSubmitting ? "Salvando..." : "Acompanhar status"}</ActionButton>
      <ActionButton onClick={() => go("vehicle-photos")} secondary>
        Voltar
      </ActionButton>
      <div className="benefits inline">
        <span>▣ Cadastro seguro</span>
        <span>☆ Processo rápido</span>
        <span>▤ Mais corridas, mais ganhos</span>
      </div>
    </section>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("login");
  const [showSplash, setShowSplash] = useState(true);
  const [driverToken, setDriverToken] = useState<string | undefined>(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    return localStorage.getItem("suwave-driver-token") ?? undefined;
  });
  const [signupForm, setSignupForm] = useState<DriverSignupForm>({
    birth_date: "",
    confirm_password: "",
    cpf: "",
    email: "",
    full_name: "",
    password: "",
    whatsapp: "",
  });
  const [cnhFront, setCnhFront] = useState<UploadResult>();
  const [cnhBack, setCnhBack] = useState<UploadResult>();
  const [selectedBrand, setSelectedBrand] = useState<VehicleBrandOption | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({ model: "", plate: "" });
  const [vehicleUploads, setVehicleUploads] = useState<VehicleUploads>({});

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 2300);
    return () => window.clearTimeout(timer);
  }, []);

  const content = useMemo(() => {
    const go = setScreen;
    switch (screen) {
      case "signup":
        return <Signup form={signupForm} go={go} onAuthenticated={setDriverToken} setForm={setSignupForm} />;
      case "face":
        return <FacePhoto go={go} token={driverToken} />;
      case "cnh":
        return (
          <Cnh
            cnhBack={cnhBack}
            cnhFront={cnhFront}
            go={go}
            setCnhBack={setCnhBack}
            setCnhFront={setCnhFront}
            token={driverToken}
          />
        );
      case "submitted":
        return <Submitted go={go} />;
      case "status":
        return <Status go={go} token={driverToken} />;
      case "dashboard":
        return <Dashboard go={go} />;
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
  }, [cnhBack, cnhFront, driverToken, screen, selectedBrand, signupForm, vehicleForm, vehicleUploads]);

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
