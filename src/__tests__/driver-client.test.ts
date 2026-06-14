import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  requestDriverPasswordReset,
  resetDriverPassword,
  loginDriverAccount,
  DriverApiError,
} from "../services/driver-client";

// Helpers to build mock fetch responses
function mockJsonResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    url: "https://99dev.pro/suwave-api/api/v1/auth/password/forgot",
    json: () => Promise.resolve(data),
  } as unknown as Response;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// requestDriverPasswordReset
// ---------------------------------------------------------------------------

describe("requestDriverPasswordReset", () => {
  it("sends POST to /auth/password/forgot with the given email", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({ data: { email: "driver@example.com", whatsapp: null } }),
    );

    await requestDriverPasswordReset({ email: "driver@example.com" });

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/password/forgot");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ email: "driver@example.com" });
  });

  it("includes X-Client-App: motorista header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({ data: { email: "driver@example.com", whatsapp: null } }),
    );

    await requestDriverPasswordReset({ email: "driver@example.com" });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Client-App"]).toBe("motorista");
  });

  it("returns the data envelope from the API", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({ data: { email: "driver@example.com", whatsapp: "66999990001" } }),
    );

    const result = await requestDriverPasswordReset({ email: "driver@example.com" });

    expect(result).toEqual({ email: "driver@example.com", whatsapp: "66999990001" });
  });

  it("throws DriverApiError with the API message on error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse(
        { error: { code: "password_reset_account_not_found", message: "E-mail ou WhatsApp não encontrado." } },
        404,
      ),
    );

    await expect(requestDriverPasswordReset({ email: "nobody@example.com" })).rejects.toThrow(
      "E-mail ou WhatsApp não encontrado.",
    );
  });

  it("thrown error is a DriverApiError with correct code on 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse(
        { error: { code: "password_reset_account_not_found", message: "E-mail ou WhatsApp não encontrado." } },
        404,
      ),
    );

    let thrown: unknown;
    try {
      await requestDriverPasswordReset({ email: "nobody@example.com" });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(DriverApiError);
    expect((thrown as DriverApiError).code).toBe("password_reset_account_not_found");
  });
});

// ---------------------------------------------------------------------------
// resetDriverPassword
// ---------------------------------------------------------------------------

describe("resetDriverPassword", () => {
  it("sends POST to /auth/password/reset with token and password", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({ data: { email: "driver@example.com" } }),
    );

    await resetDriverPassword("abc-token-123", "newpass456");

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/password/reset");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ token: "abc-token-123", password: "newpass456" });
  });

  it("includes X-Client-App: motorista header", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({ data: { email: "driver@example.com" } }),
    );

    await resetDriverPassword("abc-token-123", "newpass456");

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Client-App"]).toBe("motorista");
  });

  it("returns the email from the API on success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({ data: { email: "driver@example.com" } }),
    );

    const result = await resetDriverPassword("abc-token-123", "newpass456");

    expect(result).toEqual({ email: "driver@example.com" });
  });

  it("throws DriverApiError with 'Link inválido' message on invalid token", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse(
        { error: { code: "invalid_token", message: "Link inválido ou já utilizado." } },
        404,
      ),
    );

    await expect(resetDriverPassword("bad-token", "newpass")).rejects.toThrow(
      "Link inválido ou já utilizado.",
    );
  });

  it("throws DriverApiError with expired_token code on 410", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse(
        { error: { code: "expired_token", message: "Link expirado. Solicite um novo." } },
        410,
      ),
    );

    let thrown: unknown;
    try {
      await resetDriverPassword("expired-token", "newpass");
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(DriverApiError);
    expect((thrown as DriverApiError).code).toBe("expired_token");
  });

  it("throws DriverApiError with token_already_used code on 409", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse(
        { error: { code: "token_already_used", message: "Link já utilizado." } },
        409,
      ),
    );

    let thrown: unknown;
    try {
      await resetDriverPassword("used-token", "newpass");
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(DriverApiError);
    expect((thrown as DriverApiError).code).toBe("token_already_used");
  });
});

// ---------------------------------------------------------------------------
// loginDriverAccount — verifies the motorista header is always added
// ---------------------------------------------------------------------------

describe("loginDriverAccount", () => {
  it("sends POST to /auth/login with email and password", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        data: {
          access_token: "tok-access",
          refresh_token: "tok-refresh",
          user: { id: "u1", email: "driver@example.com", full_name: "Driver" },
        },
      }),
    );

    await loginDriverAccount({ email: "driver@example.com", password: "secret123" });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/auth/login");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ email: "driver@example.com", password: "secret123" });
  });

  it("includes X-Client-App: motorista on login requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse({
        data: {
          access_token: "tok-access",
          refresh_token: "tok-refresh",
          user: { id: "u1", email: "driver@example.com", full_name: "Driver" },
        },
      }),
    );

    await loginDriverAccount({ email: "driver@example.com", password: "secret123" });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Client-App"]).toBe("motorista");
  });

  it("throws DriverApiError with invalid_credentials code on 401", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      mockJsonResponse(
        { error: { code: "invalid_credentials", message: "E-mail ou senha inválidos." } },
        401,
      ),
    );

    let thrown: unknown;
    try {
      await loginDriverAccount({ email: "driver@example.com", password: "wrongpass" });
    } catch (err) {
      thrown = err;
    }

    expect(thrown).toBeInstanceOf(DriverApiError);
    expect((thrown as DriverApiError).code).toBe("invalid_credentials");
  });
});
