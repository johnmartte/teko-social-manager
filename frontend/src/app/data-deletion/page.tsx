import LegalLayout from "@/components/LegalLayout";

export const metadata = { title: "Eliminación de datos - Teko Social Manager" };

export default function DataDeletionPage() {
  return (
    <LegalLayout title="Eliminación de datos">
      <p>Para eliminar tus datos de Teko Social Manager sigue estos pasos:</p>
      <ol className="list-decimal pl-6 space-y-2">
        <li>En Facebook, ve a Configuración &gt; Integraciones de negocios y quita &quot;Teko manager&quot;.</li>
        <li>Envía un correo a <a href="mailto:boludotumblr@gmail.com">boludotumblr@gmail.com</a> con el asunto &quot;Eliminar mis datos&quot;, desde el correo de tu cuenta.</li>
      </ol>
      <p>Borraremos tu cuenta, tokens, publicaciones programadas y mensajes guardados en un plazo máximo de 30 días y te confirmaremos por correo. Más detalles en la <a href="/privacy">política de privacidad</a>.</p>
    </LegalLayout>
  );
}
