import LegalLayout from "@/components/LegalLayout";

export const metadata = { title: "Política de privacidad - Teko Social Manager" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad" updated="octubre de 2026">
      <p>Teko Social Manager es una herramienta para planificar, publicar y gestionar contenido, mensajes y comentarios de tus cuentas de Facebook e Instagram.</p>
      <section>
        <h2>Datos que recibimos</h2>
        <p>Al iniciar sesión con Meta recibimos tu nombre público, el identificador de tu cuenta, las Páginas y cuentas de Instagram Business que conectas, y tokens de acceso. Con tu autorización, accedemos a publicaciones, mensajes, comentarios y estadísticas de esas cuentas.</p>
      </section>
      <section>
        <h2>Para qué los usamos</h2>
        <p>Solo para ofrecerte las funciones de la aplicación: programar publicaciones, mostrar tu bandeja de mensajes y comentarios, ejecutar tus reglas de automatización y mostrar estadísticas. No vendemos ni compartimos tus datos con terceros.</p>
      </section>
      <section>
        <h2>Conservación y eliminación</h2>
        <p>Guardamos los datos mientras tu cuenta esté activa. Puedes pedir su eliminación en cualquier momento siguiendo las instrucciones en <a href="/data-deletion">Eliminación de datos</a>.</p>
      </section>
      <section>
        <h2>Contacto</h2>
        <p><a href="mailto:boludotumblr@gmail.com">boludotumblr@gmail.com</a></p>
      </section>
    </LegalLayout>
  );
}
