"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";
import { getLoginUrl } from "@/lib/api";
import SocialLogo from "@/components/SocialLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { status, user, disconnectSocial, updateEmail, updatePassword } = useAuth();
  const [disconnecting, setDisconnecting] = useState(false);

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
          <h1 className="text-2xl font-semibold">Configuración</h1>
          <p className="text-sm text-muted-foreground mt-1">
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
                  <SocialLogo platform="instagram" size="sm" />
                  <div>
                    <p className="text-sm font-medium">Instagram</p>
                    <p className="text-xs text-muted-foreground">
                      {igConnected ? `ID: ${status?.instagram.userId}` : "No conectado"}
                    </p>
                  </div>
                </div>
                <Badge variant={igConnected ? "secondary" : "outline"}>
                  {igConnected ? "Activo" : "Inactivo"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-background rounded-xl">
                <div className="flex items-center gap-3">
                  <SocialLogo platform="facebook" size="sm" />
                  <div>
                    <p className="text-sm font-medium">Facebook</p>
                    <p className="text-xs text-muted-foreground">
                      {fbConnected
                        ? `${status?.facebook.pageName} (${status?.facebook.pageId})`
                        : "No conectado"}
                    </p>
                  </div>
                </div>
                <Badge variant={fbConnected ? "secondary" : "outline"}>
                  {fbConnected ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>

            <div className="flex gap-2 mt-5 flex-wrap">
              <Button asChild size="sm">
                <a href={getLoginUrl()}>
                  {igConnected || fbConnected ? "Reconectar cuentas" : "Conectar cuentas"}
                </a>
              </Button>
              {igConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disconnecting}
                  onClick={async () => { setDisconnecting(true); await disconnectSocial("instagram"); setDisconnecting(false); }}
                >
                  Desconectar Instagram
                </Button>
              )}
              {fbConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={disconnecting}
                  onClick={async () => { setDisconnecting(true); await disconnectSocial("facebook"); setDisconnecting(false); }}
                >
                  Desconectar Facebook
                </Button>
              )}
              {igConnected && fbConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-error hover:text-error hover:bg-error-light"
                  disabled={disconnecting}
                  onClick={async () => { setDisconnecting(true); await disconnectSocial(); setDisconnecting(false); }}
                >
                  Desconectar todo
                </Button>
              )}
            </div>
          </Card>

          {fbConnected && !igConnected && (
            <Card title="Cómo conectar Instagram" color="var(--ig)">
              <p className="text-sm text-muted-foreground mb-4">
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
                    <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {n}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          )}

          {!fbConnected && !igConnected && (
            <Card title="Para empezar">
              <p className="text-sm text-muted-foreground">
                Conecta tu cuenta de Facebook para comenzar. Instagram se detectará automáticamente si tienes una cuenta Business o Creator vinculada a tu página.
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Cuenta del sistema">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-semibold">{user?.name || "Sin nombre"}</p>
              <p className="text-xs text-muted-foreground pt-2">Correo</p>
              <p className="text-sm font-semibold break-all">{user?.email || "Sin correo"}</p>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Cambiar correo">
          <form className="space-y-4" onSubmit={submitEmail}>
            <div className="space-y-2">
              <Label htmlFor="new-email">Nuevo correo</Label>
              <Input
                id="new-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nuevo-correo@dominio.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-current-password">Contraseña actual</Label>
              <Input
                id="email-current-password"
                type="password"
                value={emailPassword}
                onChange={(event) => setEmailPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {emailError ? <p className="text-xs text-error">{emailError}</p> : null}
            {emailMessage ? <p className="text-xs text-success">{emailMessage}</p> : null}
            <Button type="submit" size="sm" disabled={emailLoading}>
              {emailLoading ? "Actualizando..." : "Actualizar correo"}
            </Button>
          </form>
        </Card>

        <Card title="Cambiar contraseña">
          <form className="space-y-4" onSubmit={submitPassword}>
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contraseña"
                required
                minLength={8}
              />
            </div>
            {passwordError ? <p className="text-xs text-error">{passwordError}</p> : null}
            {passwordMessage ? <p className="text-xs text-success">{passwordMessage}</p> : null}
            <Button type="submit" size="sm" disabled={passwordLoading}>
              {passwordLoading ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        </Card>
      </div>

      <Card title="Acerca de" className="overflow-hidden">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-muted-foreground md:whitespace-nowrap">
            Teko Social Manager v1.0 — Sistema de gestión de redes sociales usando la API oficial de Meta.
          </p>
          <p className="text-xs text-muted-foreground md:text-right md:whitespace-nowrap">
            Backend: Laravel 13 | Frontend: Next.js + Tailwind CSS
          </p>
        </div>
      </Card>
    </div>
  );
}
