export const BRAND = {
  name: "Allpa",
  tagline: "Tu tierra frente al Cayambe",
  sector: "Sector Ayora, vía a Olmedo · Cayambe",
  whatsapp: "593000000000",
  phone: "+593 00 000 0000",
  hours: "Sábados y domingos de 9:00 a 17:00 en el terreno. Entre semana, con cita.",
};

export const INCLUDES: { icon: string; title: string; text: string }[] = [
  { icon: "water", title: "Agua potable", text: "Red pública con medidor para cada lote." },
  { icon: "pipe", title: "Alcantarillado", text: "Aguas servidas y pluviales separadas." },
  { icon: "bolt", title: "Luz soterrada", text: "Sin postes ni cables a la vista, con alumbrado LED." },
  { icon: "road", title: "Calles adoquinadas", text: "Bulevar de 14 m y calles de 8 m con veredas." },
  { icon: "wifi", title: "Fibra óptica", text: "Ductos listos para internet en cada lote." },
  { icon: "shield", title: "Cerramiento y guardianía", text: "Un solo acceso con portón y guardia las 24 horas." },
  { icon: "home", title: "Casa comunal", text: "Salón para reuniones, cumpleaños y la directiva." },
  { icon: "ball", title: "Cancha sintética", text: "Para el partido del fin de semana, con iluminación." },
  { icon: "kid", title: "Juegos infantiles", text: "Junto al parque central, a la vista de los papás." },
  { icon: "leaf", title: "Huertos y sendero", text: "Parcelas para sembrar y un sendero entre árboles nativos." },
  { icon: "doc", title: "Escritura individual", text: "Cada lote con su escritura inscrita en el Registro de la Propiedad." },
  { icon: "pencil", title: "Construye cuando quieras", text: "Sin plazo obligatorio para empezar tu casa." },
];

export const PLACES: { name: string; time: string; detail: string }[] = [
  { name: "Centro de Cayambe", time: "7 min", detail: "Parque central, mercado, bancos y escuelas" },
  { name: "Panamericana E35", time: "4 min", detail: "Salida directa hacia Quito y Otavalo" },
  { name: "Quitsato, Mitad del Mundo", time: "12 min", detail: "El reloj solar sobre la línea ecuatorial" },
  { name: "Tabacundo", time: "18 min", detail: "Cabecera de Pedro Moncayo" },
  { name: "Otavalo", time: "35 min", detail: "Plaza de los Ponchos y laguna de San Pablo" },
  { name: "Aeropuerto de Quito", time: "50 min", detail: "Por la E35 y Guayllabamba" },
  { name: "Norte de Quito", time: "1 h 10 min", detail: "Carcelén y Calderón por la Panamericana" },
];

export const MILESTONES: { title: string; when: string; state: "done" | "now" | "next"; progress?: number; etapa?: 1 | 2 }[] = [
  { title: "Lotización aprobada y escrituras", when: "Junio 2026", state: "done" },
  { title: "Movimiento de tierras y lotes amojonados", when: "Agosto 2026", state: "done", etapa: 1 },
  { title: "Agua, alcantarillado y ductos", when: "Octubre 2026", state: "done", etapa: 1 },
  { title: "Adoquinado, veredas y luz", when: "Diciembre 2026", state: "now", progress: 65, etapa: 1 },
  { title: "Cerramiento, portón y casa comunal", when: "Febrero 2027", state: "next", etapa: 1 },
  { title: "Entrega de la etapa 1", when: "Marzo 2027", state: "next", etapa: 1 },
  { title: "Obras y entrega de la etapa 2", when: "Diciembre 2027", state: "next", etapa: 2 },
];

export const OVERALL_PROGRESS = 46;

export const FAQ: { q: string; a: string }[] = [
  { q: "¿Los lotes tienen escritura?", a: "Sí. Cada lote tiene su escritura individual inscrita en el Registro de la Propiedad de Cayambe. Firmas la promesa de compraventa al separar y la escritura cuando terminas de pagar, o antes si pagas de contado." },
  { q: "¿Necesito crédito del banco?", a: "No. El financiamiento es directo con la urbanizadora: entrada desde el 20 % y el saldo en cuotas fijas de 12 a 60 meses. Hasta 24 meses no pagas intereses." },
  { q: "¿Cuándo puedo construir?", a: "Cuando quieras: no hay plazo obligatorio. Los lotes de la etapa 1 se entregan con todos los servicios en marzo de 2027 y desde ahí puedes empezar tu casa." },
  { q: "¿Hay reglas para construir?", a: "Pocas y para cuidar el barrio: hasta 2 pisos y terraza, retiro frontal de 3 metros y fachada terminada. Te damos los planos tipo aprobados por si los quieres usar." },
  { q: "¿Cuánto es la alícuota?", a: "15 dólares al mes desde la entrega de tu lote. Cubre guardianía, alumbrado de las áreas comunes y el mantenimiento del parque." },
  { q: "¿Qué pasa si me atraso en una cuota?", a: "Nos escribes y buscamos una solución. Tienes 30 días de gracia sin recargo y puedes adelantar cuotas cuando quieras sin penalidad." },
];
