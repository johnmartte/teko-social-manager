"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import { getLoginUrl } from "@/lib/api";

export default function SettingsPage() {
  const { status, user, logout, updateEmail, updatePassword } = useAuth();

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailPassword, setEmailPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const igConnected = status?.instagram.connected;
  const fbConnected = status?.facebook.connected;

  const submitEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEmailError("");
    setEmailMessage("");
    setEmailLoading(true);

    try {
      await updateEmail(email.trim(), emailPassword);
      setEmailMessage("Correo actualizado correctamente.");
      setEmailPassword("");
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "No se pudo actualizar el correo.");
    } finally {
      setEmailLoading(false);
    }
  };

  const submitPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setPasswordLoading(true);

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordMessage("Contraseña actualizada correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : "No se pudo actualizar la contraseña.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-sm text-muted mt-1">
            Administra tus conexiones sociales y la seguridad de tu cuenta.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Cuentas conectadas">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-light flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e1306c" strokeWidth="2">
                      <rect x="2" y="2" width="20" height="20" rx="5" />
                      <circle cx="12" cy="12" r="5" />
                      <circle cx="17.5" cy="6.5" r="1.5" fill="#e1306c" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="text-xs text-muted">
                      {igConnected ? `ID: ${status?.instagram.userId}` : "No conectado"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    igConnected ? "bg-success-light text-green-700" : "bg-red-50 text-red-500"
                  }`}
                >
                  {igConnected ? "Activo" : "Inactivo"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fb-light flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877f2">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Facebook</p>
                    <p className="text-xs text-muted">
                      {fbConnected
                        ? `${status?.facebook.pageName} (${status?.facebook.pageId})`
                        : "No conectado"}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                    fbConnected ? "bg-success-light text-green-700" : "bg-red-50 text-red-500"
                  }`}
                >
                  {fbConnected ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-5 flex-wrap">
              <a
                href={getLoginUrl()}
                className="text-xs px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity"
              >
                {igConnected || fbConnected ? "Reconectar cuentas" : "Conectar cuentas"}
              </a>
              {(igConnected || fbConnected) && (
                <button
                  onClick={logout}
                  className="text-xs px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground hover:border-foreground/20 transition-colors"
                >
                  Desconectar todo
                </button>
              )}
            </div>
          </Card>

          {fbConnected && !igConnected && (
            <Card title="Cómo conectar Instagram" color="#e1306c">
              <p className="text-sm text-muted mb-4">
                Instagram aparece desconectado porque tu página de Facebook{" "}
                <strong className="text-foreground">{status?.facebook.pageName}</strong> no tiene una cuenta de Instagram Business o Creator vinculada.
              </p>
              <ol className="space-y-3">
                {[
                  {
                    n: 1,
                    title: "Convierte tu cuenta de Instagram a Business o Creator",
                    desc: "Ve a Instagram → Configuración → Cuenta → Cambiar tipo de cuenta.",
                  },
                  {
                    n: 2,
                    title: "Vincula Instagram a tu página de Facebook",
                    desc: "Ve a Meta Business Suite → Configuración → Cuentas de Instagram.",
                  },
                  {
                    n: 3,
                    title: "Reconecta la app",
                    desc: "Haz click en Reconectar cuentas para volver a autorizar permisos.",
                  },
                ].map(({ n, title, desc }) => (
                  <li key={n} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {n}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {!fbConnected && !igConnected && (
            <Card title="Para empezar">
              <p className="text-sm text-muted">
                Conecta tu cuenta de Facebook para comenzar. Instagram se detectará automáticamente si tienes una cuenta Business o Creator vinculada a tu página.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Cuenta del sistema">
            <div className="space-y-2">
              <p className="text-xs text-muted">Nombre</p>
              <p className="text-sm font-semibold">{user?.name || "Sin nombre"}</p>
              <p className="text-xs text-muted pt-2">Correo</p>
              <p className="text-sm font-semibold break-all">{user?.email || "Sin correo"}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Cambiar correo">
          <form className="space-y-3" onSubmit={submitEmail}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nuevo-correo@dominio.com"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30"
              required
            />
            <input
              type="password"
              value={emailPassword}
              onChange={(event) => setEmailPassword(event.target.value)}
              placeholder="Contraseña actual"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30"
              required
            />
            {emailError ? <p className="text-xs text-red-500">{emailError}</p> : null}
            {emailMessage ? <p className="text-xs text-green-700">{emailMessage}</p> : null}
            <button
              type="submit"
              disabled={emailLoading}
              className="text-xs px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-65"
            >
              {emailLoading ? "Actualizando..." : "Actualizar correo"}
            </button>
          </form>
        </Card>

        <Card title="Cambiar contraseña">
          <form className="space-y-3" onSubmit={submitPassword}>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="Contraseña actual"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30"
              required
            />
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="Nueva contraseña"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30"
              required
              minLength={8}
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirmar nueva contraseña"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-foreground/30"
              required
              minLength={8}
            />
            {passwordError ? <p className="text-xs text-red-500">{passwordError}</p> : null}
            {passwordMessage ? <p className="text-xs text-green-700">{passwordMessage}</p> : null}
            <button
              type="submit"
              disabled={passwordLoading}
              className="text-xs px-4 py-2.5 rounded-xl bg-accent text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-65"
            >
              {passwordLoading ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </Card>
      </div>

      <Card title="Acerca de" className="overflow-hidden">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted md:whitespace-nowrap">
            Teko Social Manager v1.0 — Sistema de gestión de redes sociales usando la API oficial de Meta.
          </p>
          <p className="text-xs text-muted md:text-right md:whitespace-nowrap">
            Backend: Laravel 13 | Frontend: Next.js + Tailwind CSS
          </p>
        </div>
      </Card>
    </div>
  );
}
