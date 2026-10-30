/** Contenido del manual y las preguntas frecuentes. Para añadir una captura a un paso, guarda la imagen en
 *  `public/manual/` y pon `image: "/manual/nombre.png"` en ese paso. */

export type Step = { text: string; image?: string };
export type Guide = { id: string; title: string; summary: string; steps: Step[]; tips?: string[] };
export type Faq = { q: string; a: string };

export const guides: Guide[] = [
  {
    id: "primeros-pasos",
    title: "Primeros pasos: crear tu cuenta y entrar",
    summary: "Cómo registrarte, iniciar sesión y recuperar tu contraseña.",
    steps: [
      { text: "Abre la página del sistema. Si aún no tienes cuenta, pulsa «Crear cuenta», escribe tu nombre, correo y una contraseña." },
      { text: "Para volver a entrar, usa tu correo y contraseña en «Iniciar sesión». Marca «Recordarme» si no quieres que se cierre la sesión." },
      { text: "Si olvidaste la contraseña, pulsa «¿Olvidaste tu contraseña?», escribe tu correo y te llegará un código. Introdúcelo y elige una contraseña nueva." },
    ],
    tips: ["Tu cuenta del sistema es distinta de tus cuentas de Instagram y Facebook: primero entras al sistema y luego conectas tus redes."],
  },
  {
    id: "conectar",
    title: "Conectar Instagram y Facebook",
    summary: "Enlaza tus redes para publicar, ver mensajes y estadísticas.",
    steps: [
      { text: "Antes de empezar, comprueba que tu cuenta de Instagram es profesional (Business o Creator) y que está vinculada a una Página de Facebook." },
      { text: "Pulsa «Conectar» arriba a la derecha, o entra en Configuración > Cuentas conectadas." },
      { text: "En la ventana de Facebook, elige tu Página y tu cuenta de Instagram (usa «Editar configuración» si no aparecen marcadas) y acepta los permisos." },
      { text: "Al volver al sistema, los indicadores «Instagram» y «Facebook» de la parte superior se ponen en verde con un punto luminoso." },
    ],
    tips: [
      "Si no marcas la cuenta de Instagram en la ventana de Facebook, el sistema no podrá leer tus mensajes ni publicar en ella.",
      "Para desconectar una red, ve a Configuración > Cuentas conectadas.",
    ],
  },
  {
    id: "campanas",
    title: "Crear y usar campañas",
    summary: "Agrupa tus posts por campaña para organizarlos por color.",
    steps: [
      { image: "/manual/feed.jpg", text: "Entra en «Feed y campañas» y pulsa «Nueva campaña» (también está el signo + junto a «Campañas» en el menú lateral)." },
      { text: "Ponle nombre, un color y, si quieres, una descripción y fechas de inicio y fin." },
      { text: "Guarda. La campaña aparece como pestaña arriba del feed y en el menú lateral." },
      { text: "Pulsa la pestaña de una campaña para resaltar sus posts; los demás se atenúan. «Todo el feed» vuelve a mostrar todo." },
      { text: "Para asignar un post a una campaña, ábrelo y elige la campaña en el selector «Campaña»." },
    ],
  },
  {
    id: "feed",
    title: "Planificar tu feed con borradores",
    summary: "Prepara posts sin fecha y ordénalos como se verán en tu perfil.",
    steps: [
      { text: "En «Feed y campañas» pulsa «Nuevo borrador». Aparece arriba a la izquierda: es el próximo en publicarse." },
      { text: "Pulsa el borrador para abrir su editor a la derecha. Elige el formato: Foto, Carrusel o Reel." },
      { text: "Sube la imagen o el video, escribe el texto y elige la campaña." },
      { text: "Pulsa «Guardar borrador» para dejarlo sin fecha, o elige una fecha y pulsa «Programar»." },
      { text: "Arrastra los posts para cambiar su orden. También puedes usar las flechas del editor para moverlo antes o después." },
      { text: "Para quitar un post, arrástralo a la papelera que aparece abajo o usa el icono de papelera del post." },
    ],
    tips: ["Un post programado necesita fecha e imagen. Si falta alguna, el botón «Programar» está desactivado y te dice qué falta."],
  },
  {
    id: "importar",
    title: "Importar una carpeta de imágenes",
    summary: "Sube muchas imágenes de una vez; cada carpeta se convierte en un post.",
    steps: [
      { image: "/manual/feed.jpg", text: "En «Feed y campañas» pulsa «Importar carpeta» y elige la carpeta principal desde tu computadora." },
      { text: "El sistema lee las subcarpetas: cada una se convierte en un borrador. Con varias imágenes es un carrusel; con una sola, una foto." },
      { text: "Revisa la lista. Puedes desmarcar lo que no quieras importar. Las carpetas «Historias» y «Variaciones» vienen desmarcadas." },
      { text: "Pulsa «Importar». Verás una barra de progreso mientras se suben los archivos." },
      { text: "Si algún post falla, pulsa «Reintentar» para repetir solo los que fallaron." },
    ],
    tips: [
      "Las láminas de un carrusel se ordenan por el nombre del archivo; si empiezan con números (01, 02…) quedan en orden.",
      "Instagram permite 10 láminas por carrusel: si una carpeta tiene más, se divide en partes.",
      "El nombre de la carpeta no se guarda como texto del post: el texto queda vacío para que lo escribas tú.",
    ],
  },
  {
    id: "carruseles",
    title: "Gestionar carruseles: ver, unir y disolver",
    summary: "Mira todas las láminas, sepáralas o junta varios posts en uno.",
    steps: [
      { image: "/manual/carrusel-editor.jpg", text: "Abre un post de tipo carrusel: en el editor ves todas sus láminas numeradas. Usa las flechas para reordenarlas, la X para quitar una y la tijera para sacarla como post independiente." },
      { text: "Pulsa la pestaña «Carruseles» (arriba del feed) para ver todos tus carruseles con sus láminas en fila." },
      { image: "/manual/carruseles.jpg", text: "Si un carrusel en realidad eran varios posts sueltos, pulsa «Disolver»: cada lámina pasa a ser un post propio." },
      { text: "Para disolver muchos a la vez, marca sus casillas (o «Seleccionar todos») y pulsa «Disolver seleccionados»; confirma el aviso." },
      { text: "Para juntar posts en un carrusel, vuelve a «Feed», pulsa «Seleccionar y unir», toca los posts que quieras y pulsa «Unir en carrusel»." },
    ],
    tips: [
      "Disolver y unir se deshacen entre sí: si te equivocas, haz la operación contraria.",
      "Un carrusel necesita entre 2 y 10 imágenes. No se pueden unir videos.",
      "Los posts nuevos que salen de disolver o separar no heredan el texto del original.",
    ],
  },
  {
    id: "calendario",
    title: "Ver y organizar el calendario",
    summary: "Consulta qué se publica cada día.",
    steps: [
      { text: "Entra en «Calendario». Cambia entre las vistas disponibles y usa las flechas para ir al mes anterior o siguiente." },
      { text: "Cada día muestra los posts programados. Pulsa uno para ver sus opciones: publicar ahora, duplicar, eliminar o moverlo de fecha." },
    ],
    tips: ["Los borradores sin fecha no aparecen en el calendario; están en «Feed y campañas»."],
  },
  {
    id: "publicar",
    title: "Publicar ahora, programar o en lote",
    summary: "Las tres formas de enviar contenido a tus redes.",
    steps: [
      { image: "/manual/publicar.jpg", text: "Entra en «Publicar» (o pulsa «Crear» arriba). Elige el modo: «Ahora», «Programar» o «Múltiples»." },
      { text: "Elige el formato: IG Foto, IG Reel, IG Carrusel, FB Texto o FB Foto. Las redes sin conectar aparecen desactivadas." },
      { text: "Sube la imagen o el video y escribe el texto. En «Programar» elige también la fecha y la hora." },
      { text: "En «Múltiples» defines un rango: fecha de inicio, posts por día y horas por día. El sistema reparte tus publicaciones automáticamente." },
      { text: "Pulsa el botón de publicar o programar y espera la confirmación." },
    ],
    tips: ["Instagram necesita una imagen o un video para cada publicación; un post solo de texto solo es posible en Facebook."],
  },
  {
    id: "inbox",
    title: "Responder mensajes (Inbox)",
    summary: "Atiende los mensajes directos de Instagram y Facebook en un solo lugar.",
    steps: [
      { text: "Entra en «Inbox». A la izquierda están las conversaciones; usa los filtros «Todos», «Instagram» o «Facebook»." },
      { text: "Pulsa una conversación para ver sus mensajes a la derecha." },
      { text: "Escribe en la caja de abajo y pulsa «Enviar» o la tecla Enter." },
      { text: "Pulsa «Actualizar» para traer mensajes nuevos. La lista también se refresca sola cada 30 segundos." },
    ],
    tips: [
      "Regla de Instagram: solo puedes responder dentro de las 24 horas siguientes al último mensaje de esa persona. Pasado ese plazo, el sistema te avisa con una notificación.",
      "Los mensajes con palabras de prioridad (por ejemplo «urgente» o «reembolso») suben al principio de la lista. Puedes cambiarlas en Automatizaciones.",
    ],
  },
  {
    id: "comentarios",
    title: "Moderar comentarios",
    summary: "Responde, oculta o elimina comentarios de tus publicaciones.",
    steps: [
      { text: "Entra en «Comentarios» y elige la publicación." },
      { text: "En cada comentario puedes «Responder», «Ocultar» o «Eliminar»." },
      { text: "Los comentarios con palabras o enlaces sospechosos aparecen marcados «Marcado por moderación» para que los revises primero." },
    ],
    tips: ["Ocultar no avisa a quien comentó, pero el comentario deja de verse para los demás."],
  },
  {
    id: "automatizaciones",
    title: "Automatizaciones: palabras clave",
    summary: "Define qué palabras activan la moderación y la prioridad.",
    steps: [
      { text: "Entra en «Automatizaciones». Verás dos reglas: «Moderación de comentarios» y «Prioridad en el inbox»." },
      { text: "Usa el interruptor de cada regla para activarla o desactivarla." },
      { text: "Edita su lista de palabras clave: añade nuevas o quita las que no quieras. Se guarda automáticamente." },
    ],
  },
  {
    id: "estadisticas",
    title: "Entender tus estadísticas",
    summary: "Seguidores, alcance y cuándo están activos tus seguidores.",
    steps: [
      { text: "Entra en «Estadísticas» con tu cuenta conectada. Elige el periodo que quieres analizar." },
      { text: "Revisa la actividad de seguidores por hora para elegir buenos horarios de publicación." },
      { text: "La edad, el género y las ciudades de tu audiencia aparecen cuando tu cuenta tiene al menos 100 seguidores." },
    ],
    tips: ["Si una sección sale vacía en una cuenta nueva, es normal: Instagram aún no entrega datos suficientes."],
  },
  {
    id: "almacenamiento",
    title: "Cuidar el espacio de tus imágenes",
    summary: "Consulta cuánto espacio llevas usado.",
    steps: [
      { text: "Entra en Configuración > «Almacenamiento de imágenes». También se ve dentro de «Importar carpeta»." },
      { text: "La barra se pone ámbar al 80 % y roja al 95 %. Cuando eso ocurra, borra material que ya no uses o amplía tu plan." },
    ],
    tips: ["Los créditos se comparten entre espacio, descargas y transformaciones, por eso el porcentaje puede subir aunque no subas imágenes nuevas."],
  },
  {
    id: "buscador-notificaciones",
    title: "Buscador y notificaciones",
    summary: "Encuentra cualquier cosa rápido y entérate de lo importante.",
    steps: [
      { image: "/manual/buscador.jpg", text: "Usa la lupa de arriba para buscar páginas, campañas, posts o temas de esta ayuda. Pulsa un resultado para ir directo." },
      { text: "La campana muestra avisos: publicaciones que fallaron, posts que se publican en las próximas 24 horas y publicaciones recientes." },
      { text: "Pulsa un aviso para ir al post. Usa «Marcar todo como leído» para limpiar el contador." },
    ],
  },
  {
    id: "perfil",
    title: "Tu perfil y tu configuración",
    summary: "Qué se cambia en cada sitio.",
    steps: [
      { text: "«Mi perfil» (menú de tu avatar) es para tu nombre y un resumen de tu actividad y tus cuentas conectadas." },
      { text: "«Configuración» es para el correo, la contraseña, las cuentas conectadas y el almacenamiento." },
      { text: "Para cerrar sesión, abre el menú de tu avatar y pulsa «Cerrar sesión»." },
    ],
  },
];

export const faqs: Faq[] = [
  { q: "¿Por qué no puedo conectar mi cuenta de Instagram?", a: "Revisa que sea una cuenta profesional (Business o Creator), que esté vinculada a una Página de Facebook, y que al conectar hayas marcado tanto la Página como la cuenta de Instagram en la ventana de Facebook." },
  { q: "No veo mis mensajes en el Inbox, ¿qué hago?", a: "Confirma que Instagram aparece conectado en verde arriba y que en la app de Instagram está activado «Permitir acceso a los mensajes» (Configuración > Mensajes y respuestas > Herramientas conectadas). Si cambiaste algo, vuelve a conectar la cuenta desde Configuración." },
  { q: "¿Por qué no puedo responder un mensaje?", a: "Instagram solo permite responder dentro de las 24 horas siguientes al último mensaje de esa persona. Cuando te vuelva a escribir, podrás responderle de nuevo." },
  { q: "¿Qué diferencia hay entre borrador, programado y publicado?", a: "Un borrador no tiene fecha y no se publica solo. Un post programado tiene fecha y hora y se publica automáticamente. Un publicado ya está en tu perfil." },
  { q: "¿Cuántas imágenes puede tener un carrusel?", a: "Entre 2 y 10, que es el límite de Instagram. Si importas una carpeta con más, el sistema la divide en partes." },
  { q: "Importé una carpeta y todo quedó como carrusel, pero eran posts sueltos. ¿Cómo lo arreglo?", a: "Entra en la pestaña «Carruseles» del feed, marca los que quieras y pulsa «Disolver seleccionados». Cada lámina pasa a ser un post independiente." },
  { q: "¿Puedo deshacer una unión o una disolución?", a: "Sí, haciendo la operación contraria: si uniste posts, ábrelo y sepáralos; si disolviste un carrusel, selecciónalos y únelos de nuevo con «Seleccionar y unir»." },
  { q: "¿Qué pasa si se llena el almacenamiento?", a: "Cuando la barra llegue al 100 %, no podrás subir imágenes nuevas hasta liberar espacio o ampliar el plan. Te avisa en ámbar al 80 % y en rojo al 95 %." },
  { q: "¿Qué formatos de archivo puedo subir?", a: "Imágenes PNG, JPG, WEBP y GIF, y videos MP4 y MOV. Cada archivo puede pesar hasta 100 MB." },
  { q: "¿Por qué mi cuenta aparece vacía en Estadísticas?", a: "Los datos de audiencia (edad, género, ciudades) requieren al menos 100 seguidores, y las cuentas nuevas necesitan unos días para acumular datos." },
  { q: "¿Cómo cambio mi correo o mi contraseña?", a: "En Configuración. Para cambiar el correo te pedirá tu contraseña actual por seguridad." },
  { q: "¿Cómo cambio mi nombre?", a: "En «Mi perfil», desde el menú de tu avatar." },
  { q: "Olvidé mi contraseña", a: "En la pantalla de inicio de sesión pulsa «¿Olvidaste tu contraseña?». Recibirás un código por correo para crear una nueva." },
  { q: "¿Mis datos están seguros? ¿Cómo los elimino?", a: "Solo guardamos lo necesario para que el sistema funcione. Puedes pedir la eliminación de tus datos en cualquier momento siguiendo las instrucciones de la página «Eliminación de datos», enlazada en la pantalla de inicio." },
  { q: "Una publicación falló, ¿qué hago?", a: "Recibirás una notificación con el motivo. Ábrela desde la campana, revisa el mensaje de error (por ejemplo, formato o tamaño de imagen no válido), corrige el post y vuelve a programarlo." },
];
