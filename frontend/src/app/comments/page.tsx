"use client";

import { useAuth } from "@/context/AuthContext";
import Card from "@/components/Card";

export default function CommentsPage() {
  const { status } = useAuth();
  const connected = status?.instagram.connected || status?.facebook.connected;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Comentarios</h1>

      {!connected ? (
        <p className="text-muted text-center py-12">Conecta una cuenta para gestionar comentarios.</p>
      ) : (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-fb-light flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1877f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-1">Gestión de comentarios</h3>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Selecciona un post desde la sección de Instagram o Facebook para ver y moderar sus comentarios.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
