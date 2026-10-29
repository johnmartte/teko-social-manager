export const metadata = { title: "Eliminación de datos - Teko Social Manager" };

export default function DataDeletionPage() {
  return (
    <article className="mx-auto max-w-2xl px-6 py-12 space-y-4 text-sm leading-relaxed">
      <h1 className="text-2xl font-semibold">Eliminación de datos</h1>
      <p>Para eliminar tus datos de Teko Social Manager:</p>
      <ol className="list-decimal pl-6 space-y-1">
        <li>En Facebook, ve a Configuración &gt; Integraciones de negocios, y quita &quot;Teko manager&quot;.</li>
        <li>Envía un correo a boludotumblr@gmail.com con el asunto &quot;Eliminar mis datos&quot; desde el correo de tu cuenta.</li>
      </ol>
      <p>Borraremos tu cuenta, tokens, publicaciones programadas y mensajes guardados en un plazo máximo de 30 días y te confirmaremos por correo.</p>
    </article>
  );
}
