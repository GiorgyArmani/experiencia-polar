// Banco de preguntas. SOLO se importa en el servidor (API routes):
// el navegador nunca recibe cuál es la respuesta correcta.
//
// Cada estación es un nivel del mapa. A cada jugador le tocan QUESTIONS_PER_TRIVIA preguntas
// al azar del banco de su estación (si el banco tiene menos, le tocan todas).
// `correct` es el índice de la opción correcta (las preguntas de verdadero/falso tienen 2 opciones).
import { ESTACIONES } from '@/shared/estaciones';

export interface Question {
  text: string;
  options: string[]; // 2 a 4
  correct: number;
  /** Mensaje al acertar (lo envía la UEP). Si falta, se muestra la opción correcta. */
  ok?: string;
  /** Mensaje al fallar. Si falta, se usa `ok`; y si tampoco hay, la opción correcta. */
  ko?: string;
}

export interface Trivia {
  id: number; // 1..4
  title: string;
  /** Banco de la estación: de aquí salen las preguntas de cada jugador. */
  bank: Question[];
}

/** Preguntas que responde cada jugador en cada estación. */
export const QUESTIONS_PER_TRIVIA = 3;

const q = (text: string, options: string[], correct: number, ok?: string, ko?: string): Question => ({
  text,
  options,
  correct,
  ok,
  ko: ko ?? ok,
});
const VF = ['Verdadero', 'Falso'];

/** Mensaje que ve el jugador tras responder: el de acierto o el de fallo (null: se muestra la opción correcta). */
export function feedbackFor(question: Question, correct: boolean): string | null {
  return (correct ? question.ok : question.ko) ?? null;
}

// Banco enviado por la UEP ("Bancos de preguntas - Juego Aniversario UEP"), con sus mensajes de acierto y fallo.
const BANKS: Record<number, Question[]> = {
  // Estación 1 · Universidad Empresas Polar
  1: [
    q(
      '¿Sabes en qué año nació la Universidad Empresas Polar?',
      ['2021', '2022', '2023', '2024'],
      1,
      'La Universidad Empresas Polar comenzó sus actividades el 02 de noviembre de 2022.',
    ),
    q(
      '¿Recuerdas en qué año se estrenó la app de la UEP?',
      ['2022', '2023', '2024', '2025'],
      3,
      'La aplicación de la Universidad se desplegó el 13 de noviembre de 2025, para celebrar el 3er aniversario.',
    ),
    q(
      '¿Cuál es el objetivo principal de la plataforma de la Universidad Empresas Polar?',
      [
        'Tu formación integral y el desarrollo de competencias requeridas en tu rol',
        'Gestionar exclusivamente la nómina y beneficios de los colaboradores',
        'Evaluar el desempeño anual de los trabajadores',
        'Ofrecer eventos de entretenimiento presenciales para la organización',
      ],
      0,
      '¡Así es! La UEP es una plataforma creada para acompañar tu formación integral y potenciar tu talento.',
      '¡Casi! El objetivo principal de la UEP es tu formación integral y el desarrollo de tus competencias en la organización.',
    ),
    q(
      '¿Cuántas líneas educativas contempla el Modelo de Aprendizaje propio de la UEP?',
      ['2 líneas educativas', '3 líneas educativas', '4 líneas educativas', '5 líneas educativas'],
      1,
      'La UEP contempla 3 líneas educativas: Individual, Organizacional y Técnica / Especializada.',
    ),
    q(
      '¿Qué busca desarrollar la Línea Individual del Modelo de Aprendizaje?',
      [
        'Desarrollo de capacidades específicas y especializadas por área',
        'Desarrollo de capacidades asociadas a la ejecución del rol en la organización',
        'Desarrollo de habilidades humanas y comportamientos de Gente Polar',
        'Entrenamiento exclusivo de directivos y gerentes',
      ],
      2,
    ),
    q(
      'Si la Línea Individual contribuye al desarrollo de capacidades humanas... ¿Qué capacidades aborda la Línea Organizacional?',
      [
        'Capacidades específicas técnicas requeridas por cada área operativa',
        'Capacidades asociadas a la ejecución del rol dentro de la organización',
        'Habilidades exclusivamente académicas y teóricas',
        'Formación de competencias en idiomas extranjeros',
      ],
      1,
      '¡Así es! La Línea Organizacional impulsa las capacidades clave para desempeñar con éxito tu rol en la empresa.',
      '¡Incorrecto! La Línea Organizacional desarrolla las capacidades necesarias para ejecutar tu rol dentro de la organización.',
    ),
    q(
      '¿Cuál es el enfoque principal de la Línea Técnica especializada?',
      [
        'Habilidades humanas de liderazgo y empatía',
        'Capacidades asociadas únicamente al clima organizacional',
        'Capacidades específicas y especializadas requeridas por el área a la que perteneces',
        'Integración y convivencia corporativa',
      ],
      2,
      '¡Exacto! Esta línea fortalece los conocimientos técnicos y especializados de tu área de trabajo.',
      '¡Casi! La Línea Técnica busca desarrollar capacidades específicas y especializadas propias de tu área.',
    ),
    q(
      '¿Quiénes tienen acceso a la plataforma de la Universidad Empresas Polar?',
      [
        'Únicamente el personal directivo y gerencial',
        'Todos los trabajadores de la organización',
        'Solo los trabajadores del área técnica',
        'Exclusivamente los empleados de nuevo ingreso',
      ],
      1,
      '¡Correcto! La plataforma está disponible para el 100% de los trabajadores de Empresas Polar.',
      '¡Incorrecto! Todos los trabajadores de la organización cuentan con acceso a la plataforma UEP.',
    ),
    q(
      '¿Qué modalidades de formación te ofrece la UEP?',
      ['Únicamente presenciales', 'Únicamente virtuales', 'Exclusivamente a través de guías impresas', 'Tanto presenciales como virtuales'],
      3,
      '¡Así es! Combinamos experiencias formativas presenciales y virtuales para adaptarnos a tus necesidades.',
      '¡Casi! Las actividades de la UEP ofrecen modalidades tanto presenciales como virtuales.',
    ),
    q(
      '¿Sabes qué ventaja de conexión te da la app de la UEP?',
      [
        'Requiere obligatoriamente conexión a internet por fibra óptica',
        'Solo funciona mediante conexión a red interna de la empresa',
        'Permite conexión de manera offline en algunos recursos',
        'Funciona únicamente enviando mensajes de texto (SMS)',
      ],
      2,
      '¡Excelente! Puedes acceder a recursos de aprendizaje seleccionados incluso sin conexión a internet.',
      '¡Incorrecto! La aplicación móvil permite conectarte de manera offline en ciertos recursos para facilitar tu aprendizaje.',
    ),
  ],
  // Estación 2 · Biblioteca UEP
  2: [
    q(
      '¿En qué fecha sumamos la Biblioteca UEP a nuestro ecosistema de aprendizaje?',
      ['Marzo de 2025', 'Noviembre de 2024', 'Enero de 2023', 'Julio de 2024'],
      1,
    ),
    q(
      '¿Qué hace únicos a los contenidos de la Biblioteca UEP?',
      [
        'Contiene únicamente documentos en formato PDF y en español',
        'Ofrece recursos exclusivamente en formato impreso y físico',
        'Maneja recursos en distintos idiomas y formatos',
        'Solo está disponible para consulta en horario de oficina',
      ],
      2,
      '¡Así es! Cuentas con una amplia diversidad de formatos (ebooks, audios, videos) y contenidos en distintos idiomas.',
      '¡Incorrecto! La Biblioteca UEP se destaca por ofrecer recursos en múltiples idiomas y diversos formatos digitales.',
    ),
    q(
      '¿Cómo puedes crear y compartir una selección personalizada de recursos con tus compañeros en la Biblioteca UEP?',
      [
        'Enviando un correo electrónico directamente al equipo de soporte de la plataforma',
        'En la Biblioteca, haciendo clic en la opción de “Listas” en el área del usuario para crear listas públicas o privadas',
        'Descargando los archivos directamente al equipo y enviándolos por mensajería interna',
        'Solicitando una autorización impresa al equipo de Gestión de Gente',
      ],
      1,
      '¡Muy bien! En la sección “Listas” de tu perfil puedes guardar y compartir tus selecciones favoritas con tus compañeros.',
      '¡Casi! Puedes ingresar a “Listas” en tu área de usuario para crear y compartir listas públicas o privadas.',
    ),
    q(
      '¿A cuántos recursos educativos puedes acceder en la Biblioteca UEP?',
      [
        'A más de 100 manuales técnicos únicamente en formato texto',
        'A más de 4 millones de recursos de distintos tipos, como ebooks, audiolibros, películas, resúmenes y videos',
        'A 500 resúmenes en formato web',
        'A 1 millón de artículos académicos únicamente en español',
      ],
      1,
      '¡Impresionante! Tienes a tu alcance más de 4 millones de contenidos educativos diversos.',
      '¡Incorrecto! La Biblioteca UEP cuenta con más de 4 millones de recursos (ebooks, audiolibros, videos y más).',
    ),
    q(
      'Si deseas acceder a un recurso educativo que actualmente no se encuentra disponible en la Biblioteca UEP, puedes sugerirlo a través de una opción al final del catálogo navegando por la plataforma.',
      VF,
      0,
      '¡Así es! Al final del catálogo encontrarás la opción para solicitar los recursos que desees ver en la plataforma.',
      '¡Incorrecto! Es Verdadero. Puedes sugerir contenidos nuevos utilizando la opción disponible al final del catálogo.',
    ),
    q(
      '¿Con qué frecuencia la Universidad Empresas Polar realiza campañas para promocionar nuevos contenidos y mantener actualizado su catálogo?',
      ['Semanalmente', 'Mensualmente', 'Trimestralmente', 'Anualmente'],
      1,
      '¡Así es! Cada mes lanzamos campañas especiales con los contenidos más relevantes para ti.',
      '¡Casi! Las campañas de promoción y actualización de contenidos se realizan mensualmente.',
    ),
    q(
      '¿Desde cuántos dispositivos puedes acceder a la Biblioteca UEP?',
      ['2', '3', '4', '6'],
      3,
      '¡Correcto! Puedes acceder a la Biblioteca UEP desde un máximo de 6 dispositivos.',
      '¡Casi! Puedes acceder a la Biblioteca UEP desde hasta 6 dispositivos.',
    ),
    // El documento no marca la correcta; por los mensajes de acierto y fallo es la primera (medallas y badges).
    q(
      'Además de los puntos y el ranking, ¿de qué otra forma reconoce la plataforma el aprendizaje acumulado de los usuarios?',
      [
        'Otorgando medallas y badges acumulables mediante el progreso, el número de recursos consumidos o las horas dedicadas',
        'Enviando diplomas impresos por correo postal al finalizar la semana',
        'Otorgando permisos especiales para modificar el catálogo de la biblioteca',
        'Habilitando la descarga de materiales externos a la universidad',
      ],
      0,
      '¡Excelente! Ganarás medallas e insignias digitales a medida que acumules horas de aprendizaje y lecturas.',
      '¡Casi! La plataforma te otorga medallas y badges acumulables según tus recursos consumidos y tiempo invertido.',
    ),
    q(
      'Al solicitar el préstamo de un recurso en la Biblioteca UEP, ¿cuántos puntos obtienes y cuál es el límite diario permitido por esta acción?',
      [
        '1 punto por préstamo, hasta un máximo de 5 puntos al día',
        '5 puntos por préstamo, hasta un máximo de 20 puntos al día',
        '2 puntos por préstamo, hasta un máximo de 10 puntos al día',
        '10 puntos por préstamo, sin límite diario de puntos',
      ],
      2,
      '¡Así es! Sumas 2 puntos por cada préstamo, pudiendo acumular un máximo de 10 puntos diarios por esta acción.',
      '¡Incorrecto! Cada préstamo te otorga 2 puntos, con un límite máximo de 10 puntos al día.',
    ),
    q(
      '¿Cómo funciona el sistema de ranking en la plataforma para los usuarios a medida que consumen contenidos?',
      [
        'Asigna posiciones aleatorias cada semana independientemente del uso',
        'Permite acumular puntos por realizar acciones en la plataforma, ubicando al usuario en un ranking del mes y un ranking global',
        'Compara únicamente las calificaciones obtenidas en evaluaciones presenciales',
        'Otorga puntos exclusivamente por la asistencia a charlas presenciales en la empresa',
      ],
      1,
      '¡Correcto! Tus interacciones y lecturas te suman puntos para destacar en el ranking mensual y global.',
      '¡Casi! Todas tus acciones de aprendizaje te otorgan puntos para ubicarte en el ranking del mes y el global.',
    ),
    q(
      '¿Cuál fue el último carrusel que se estrenó en la Biblioteca UEP?',
      ['Líderes del Futuro', 'Innovación y Tecnología', 'Serie Gente Polar', 'Competencias Digitales 2025'],
      2,
      '¡Así es! “Serie Gente Polar” fue el carrusel más reciente en integrarse al catálogo.',
      '¡Incorrecto! El carrusel más reciente estrenado en la Biblioteca fue Serie Gente Polar.',
    ),
  ],
  // Estación 3 · Unidad Móvil
  3: [
    q(
      '¿En qué mes y año arrancó motores la Unidad Móvil de la UEP?',
      ['Febrero de 2026', 'Marzo de 2026', 'Abril de 2026', 'Mayo de 2025'],
      1,
      '¡Excelente! La UEP Móvil inició su recorrido el 12 de marzo de 2026.',
      '¡Casi! La UEP Móvil tuvo su primera actividad en carretera el 12 de marzo de 2026.',
    ),
    q(
      '¿Cuál fue la primera planta que visitó la UEP Móvil?',
      ['Caucagua', 'San Joaquín', 'Turmero', 'San Pedro'],
      0,
      '¡Así es! La primera parada oficial de la Unidad Móvil fue la planta de Caucagua.',
      '¡Incorrecto! La primera actividad de la UEP Móvil se realizó en Caucagua el 12 de marzo de 2026.',
    ),
    q(
      '¿La Unidad Móvil tiene la capacidad de operar con energía fotovoltaica?',
      VF,
      0,
      '¡Correcto! La Unidad Móvil puede operar aprovechando la energía solar.',
      '¡Incorrecto! Es Verdadero. La unidad está equipada para operar mediante energía fotovoltaica.',
    ),
    q(
      '¿La Unidad Móvil tiene características sustentables?',
      VF,
      0,
      '¡Excelente! Cuenta con 12 paneles solares y un avanzado sistema de administración de cargas.',
      '¡Incorrecto! Es Verdadero. Es sustentable gracias a sus 12 paneles solares y su sistema de gestión de cargas.',
    ),
    q(
      'A lo largo de la primera gira, la Unidad Móvil recorrió más de 4.000 kilómetros.',
      VF,
      0,
      '¡Así es! Recorrió un total de 4.337 kilómetros llevando formación a nuestras sedes.',
      '¡Casi! Es Verdadero. La gira cubrió exactamente 4.337 kilómetros a nivel nacional.',
    ),
    // El documento no marca la correcta; por los mensajes de acierto y fallo es la segunda.
    q(
      '¿Cuál es el propósito principal de la Unidad Móvil de la Universidad Empresas Polar?',
      [
        'Realizar entregas de productos y mercancía a nivel nacional',
        'Fomentar la conexión presencial con los trabajadores llevando el aprendizaje a cada rincón del país con experiencias de desarrollo',
        'Funcionar como una oficina administrativa itinerante de reclutamiento',
        'Ofrecer servicios de transporte privado para los colaboradores',
      ],
      1,
      '¡Así es! La UEP Móvil busca conectar presencialmente con cada trabajador en todo el país para impulsar su máximo potencial.',
      '¡Casi! Su propósito central es fomentar la conexión presencial llevando el aprendizaje a cada rincón del país.',
    ),
    q(
      'El contenido abordado en la primera gira de la Unidad Móvil fue:',
      ['Serie Gente Polar', 'Biblioteca UEP', 'Todos Somos Líderes'],
      1,
      '¡Correcto! La primera gira estuvo dedicada a promover el uso y alcance de la Biblioteca UEP.',
      '¡Incorrecto! El tema principal desplegado durante la primera gira fue la Biblioteca UEP.',
    ),
    q(
      '¿De qué color es externamente la Unidad Móvil de la Universidad Empresas Polar?',
      ['Verde Oliva', 'Azul Rey', 'Blanco', 'Azul Cielo'],
      1,
      '¡Así es! La Unidad Móvil destaca por su distintivo color Azul Rey.',
      '¡Casi! El color exterior de la Unidad Móvil es Azul Rey.',
    ),
    q(
      '¿Cuáles son las dimensiones físicas (largo por ancho) de la Unidad Móvil UEP?',
      [
        '10 metros de largo por 2,00 metros de ancho',
        '12 metros de largo por 2,40 metros de ancho',
        '13 metros de largo por 2,60 metros de ancho',
        '15 metros de largo por 3,00 metros de ancho',
      ],
      2,
      '¡Correcto! La Unidad Móvil tiene una extensión de 13 metros de largo por 2,60 metros de ancho.',
      '¡Incorrecto! Sus medidas exactas son 13 metros de largo por 2,60 metros de ancho.',
    ),
    q(
      '¿Con cuántos neumáticos (cauchos) cuenta la Unidad Móvil de la UEP para recorrer el país?',
      ['4 neumáticos', '6 neumáticos', '8 neumáticos', '10 neumáticos'],
      2,
      '¡Correcto! La Unidad Móvil cuenta con 8 neumáticos (sin contar con los de repuesto).',
      '¡Casi! La Unidad Móvil cuenta con 8 neumáticos (sin contar con los de repuesto).',
    ),
  ],
  // Estación 4 · Plataforma UEP (por ahora una sola pregunta; la UEP enviará las que faltan)
  4: [
    q(
      '¿Qué requisito hay para descargar e instalar las aplicaciones de la Universidad Empresas Polar y la Biblioteca UEP en tus dispositivos?',
      [
        'Ninguno, ambas aplicaciones son totalmente gratuitas para todos los colaboradores',
        'Requiere pagar una suscripción mensual de uso',
        'Debes realizar un pago único al momento de la descarga en la tienda de aplicaciones',
        'Necesitas una autorización bancaria previa para habilitar la descarga',
      ],
      0,
      'Puedes descargar e instalar ambas aplicaciones de forma 100% gratuita para disfrutar de todo su contenido sin costo ni suscripciones.',
      'Ambas aplicaciones (Universidad Empresas Polar y Biblioteca UEP) son completamente gratuitas y no requieren ningún pago ni suscripción.',
    ),
  ],
};

export const TRIVIAS: Trivia[] = ESTACIONES.map((e) => ({ id: e.id, title: e.nombre, bank: BANKS[e.id] ?? [] }));

export const TOTAL_TRIVIAS = TRIVIAS.length;

export function getTrivia(id: number): Trivia | undefined {
  return TRIVIAS.find((t) => t.id === id);
}

/** Sortea las preguntas de un jugador para una estación: índices del banco, sin repetir. */
export function drawQuestions(t: Trivia): number[] {
  const idx = t.bank.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, Math.min(QUESTIONS_PER_TRIVIA, idx.length));
}

/**
 * Índices del banco que le tocaron al jugador. Si no hay sorteo guardado (partidas de antes del cambio),
 * usa las primeras del banco.
 */
export function questionIdsFor(t: Trivia, ids: number[] | null | undefined): number[] {
  const valid = (ids ?? []).filter((i) => Number.isInteger(i) && i >= 0 && i < t.bank.length);
  return valid.length ? valid : t.bank.slice(0, QUESTIONS_PER_TRIVIA).map((_, i) => i);
}
