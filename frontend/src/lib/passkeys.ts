import { api } from "@/lib/api";

type Descriptor = { id: string; type: "public-key"; transports?: AuthenticatorTransport[] };
type CreationJSON = Omit<PublicKeyCredentialCreationOptions, "challenge" | "user" | "excludeCredentials"> & {
  challenge: string;
  user: { id: string; name: string; displayName: string };
  excludeCredentials?: Descriptor[];
};
type RequestJSON = Omit<PublicKeyCredentialRequestOptions, "challenge" | "allowCredentials"> & {
  challenge: string;
  allowCredentials?: Descriptor[];
};

export type Passkey = { id: number; name: string; created_at: string; last_used_at: string | null };

export const passkeysSupported = () => typeof window !== "undefined" && !!window.PublicKeyCredential && !!navigator.credentials;

// El servidor usa base64url; el navegador necesita ArrayBuffer.
const toBuf = (s: string) => {
  const b = atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "="));
  return Uint8Array.from(b, (c) => c.charCodeAt(0)).buffer;
};
const toB64u = (buf: ArrayBuffer | null | undefined) =>
  buf ? btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : null;

const withBuf = (d: Descriptor) => ({ ...d, id: toBuf(d.id) });

/** Cancelar el diálogo del sistema no es un error que haya que mostrar. */
export const isCancelled = (e: unknown) => e instanceof DOMException && (e.name === "NotAllowedError" || e.name === "AbortError");

/** Registra un passkey (Touch ID / llavero) para el usuario con sesión iniciada. */
export async function registerPasskey(name: string): Promise<Passkey> {
  const o = await api<CreationJSON>("/auth/passkeys/options", { method: "POST", body: {} });
  const cred = (await navigator.credentials.create({
    publicKey: {
      ...o,
      challenge: toBuf(o.challenge),
      user: { ...o.user, id: toBuf(o.user.id) },
      excludeCredentials: o.excludeCredentials?.map(withBuf),
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("No se creó el passkey.");

  const r = cred.response as AuthenticatorAttestationResponse;
  const { passkey } = await api<{ passkey: Passkey }>("/auth/passkeys", {
    method: "POST",
    body: {
      name,
      credential: {
        id: cred.id,
        rawId: toB64u(cred.rawId),
        type: cred.type,
        response: { clientDataJSON: toB64u(r.clientDataJSON), attestationObject: toB64u(r.attestationObject), transports: r.getTransports?.() ?? [] },
        clientExtensionResults: cred.getClientExtensionResults(),
      },
    },
  });
  return passkey;
}

/** Pide el passkey al sistema (huella, llavero…) y devuelve la sesión que entrega el servidor. */
export async function loginWithPasskeyCeremony() {
  const { token, options } = await api<{ token: string; options: RequestJSON }>("/auth/passkey/login-options", { method: "POST", body: {} });
  const cred = (await navigator.credentials.get({
    publicKey: { ...options, challenge: toBuf(options.challenge), allowCredentials: options.allowCredentials?.map(withBuf) },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("No se obtuvo el passkey.");

  const r = cred.response as AuthenticatorAssertionResponse;
  return api<{ token: string; user: { id: number; name: string; email: string } }>("/auth/passkey/login", {
    method: "POST",
    body: {
      token,
      credential: {
        id: cred.id,
        rawId: toB64u(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: toB64u(r.clientDataJSON),
          authenticatorData: toB64u(r.authenticatorData),
          signature: toB64u(r.signature),
          userHandle: toB64u(r.userHandle),
        },
        clientExtensionResults: cred.getClientExtensionResults(),
      },
    },
  });
}
