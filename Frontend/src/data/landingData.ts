export interface ServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  image: string;
  icon: string;
  features: string[];
  whatsappMessage: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'taller' | 'recepcion' | 'exterior' | 'equipamiento';
  categoryLabel: string;
  description: string;
  image: string;
  featured?: boolean;
}

export interface ProcessStep {
  stepNumber: string;
  title: string;
  badge: string;
  description: string;
  detail: string;
  icon: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: 'microelectronica',
    title: 'Reparación de Placas y Microelectrónica',
    shortDescription: 'Diagnóstico y reparación a nivel de componentes en placa madre de laptops y PCs.',
    fullDescription: 'Intervención especializada en laboratorio con instrumental de precisión. Solución a cortocircuitos en líneas de alimentación (19V), circuitos de carga, reemplazo de integrados SMD, MOSFETs y conectores DC Jack.',
    image: '/images/web-publica/laboratorio-microelectronica.webp',
    icon: 'CpuChipIcon',
    features: [
      'Líneas principales y secundarias de voltaje',
      'Reparación de circuitos de carga y batería',
      'Sustitución de componentes SMD e integrados',
      'Diagnóstico con osciloscopio y cámara térmica',
    ],
    whatsappMessage: 'Hola Hospital del Computador, deseo solicitar información sobre la reparación de placa madre / microelectrónica para mi equipo.',
  },
  {
    id: 'mantenimiento',
    title: 'Mantenimiento Preventivo y Correctivo',
    shortDescription: 'Limpieza profunda, optimización térmica y calibración completa del sistema.',
    fullDescription: 'Mantenimiento integral para laptops y computadoras de escritorio. Desarme minucioso, limpieza ultrasónica de disipadores, lubricación de ventiladores y aplicación de pasta térmica de alto rendimiento térmico.',
    image: '/images/web-publica/puestos-trabajo-taller.webp',
    icon: 'WrenchScrewdriverIcon',
    features: [
      'Eliminación total de polvo y residuos internos',
      'Pasta térmica de alta conductividad',
      'Pruebas de estrés y temperaturas bajo carga',
      'Optimización de ventilación y reducción de ruido',
    ],
    whatsappMessage: 'Hola Hospital del Computador, quiero agendar un mantenimiento preventivo para mi computadora/laptop.',
  },
  {
    id: 'impresoras',
    title: 'Servicio Técnico de Impresoras',
    shortDescription: 'Mantenimiento y reparación de impresoras de tanque de tinta y láser.',
    fullDescription: 'Atención técnica para equipos Epson, Canon y HP. Purga y destape de cabezales, cambio de almohadillas con reseteo de contador, reemplazo de rodillos de arrastre y solución a atascos continuos.',
    image: '/images/web-publica/servicio-tecnico-impresoras.webp',
    icon: 'PrinterIcon',
    features: [
      'Destape y alineación de cabezales de impresión',
      'Cambio y reseteo de almohadillas de desecho',
      'Mantenimiento de sistemas continuos de tinta',
      'Reemplazo de gomas de tracción y rodillos',
    ],
    whatsappMessage: 'Hola Hospital del Computador, necesito asistencia técnica para mi impresora.',
  },
  {
    id: 'pantallas-bisagras',
    title: 'Pantallas y Reconstrucción de Bisagras',
    shortDescription: 'Sustitución de displays LCD/LED y reparación estructural de chasis.',
    fullDescription: 'Reemplazo de pantallas rotas, parpadeantes o con líneas para todas las marcas. Reconstrucción artesanal de anclajes de bisagras fracturadas en chasis de laptops, devolviendo la rigidez y apertura suave original.',
    image: '/images/web-publica/puesto-trabajo-individual.webp',
    icon: 'TvIcon',
    features: [
      'Displays originales HD, FHD, IPS y OLED',
      'Reconstrucción de bases y anclajes plásticos',
      'Alineación y regulación de tensión en bisagras',
      'Garantía de fijación estructural duradera',
    ],
    whatsappMessage: 'Hola Hospital del Computador, requiero cotización para cambio de pantalla o reparación de bisagras de mi laptop.',
  },
  {
    id: 'actualizacion-ssd-ram',
    title: 'Repotenciación con SSD y Memoria RAM',
    shortDescription: 'Multiplica la velocidad de tu equipo con unidades de estado sólido y más memoria.',
    fullDescription: 'Convierte tu computadora lenta en un equipo veloz y eficiente. Instalación de SSD NVMe PCIe o SATA de alta velocidad, ampliación de memoria RAM compatible y clonación exacta de tu información sin perder nada.',
    image: '/images/web-publica/vitrina-laptops-redes.webp',
    icon: 'ArrowPathIcon',
    features: [
      'Unidades SSD ultrarrápidas NVMe y SATA',
      'Memorias RAM DDR3, DDR4 y DDR5 compatibles',
      'Clonación íntegra de sistema operativo y datos',
      'Incremento de hasta 10x en velocidad de arranque',
    ],
    whatsappMessage: 'Hola Hospital del Computador, deseo repotenciar mi equipo con un disco sólido SSD o más memoria RAM.',
  },
  {
    id: 'software-seguridad',
    title: 'Sistemas Operativos, Software y Seguridad',
    shortDescription: 'Instalación limpia, controladores originales y protección contra virus.',
    fullDescription: 'Formateo y configuración profesional de sistemas Windows y Linux. Instalación de drivers de fábrica, paquetes de software utilitario, eliminación profunda de virus/malware y respaldo de archivos personales.',
    image: '/images/web-publica/recepcion-principal.webp',
    icon: 'ShieldCheckIcon',
    features: [
      'Instalación oficial y limpia de Windows y Linux',
      'Drivers actualizados y certificados por fabricante',
      'Desinfección de troyanos, adware y virus',
      'Respaldo preventivo seguro de información',
    ],
    whatsappMessage: 'Hola Hospital del Computador, necesito formateo, instalación de software o desinfección de virus.',
  },
];

export const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'fachada',
    title: 'Fachada y Acceso Principal',
    category: 'exterior',
    categoryLabel: 'Exterior',
    description: 'Nuestra ubicación en Riobamba, con fácil acceso y zona comercial segura.',
    image: '/images/web-publica/fachada-hospital-del-computador.webp',
    featured: true,
  },
  {
    id: 'entrada',
    title: 'Entrada al Establecimiento',
    category: 'exterior',
    categoryLabel: 'Exterior',
    description: 'Puerta de ingreso al taller y área de exhibición de repuestos y accesorios.',
    image: '/images/web-publica/entrada-establecimiento.webp',
  },
  {
    id: 'recepcion-principal',
    title: 'Área de Recepción y Atención',
    category: 'recepcion',
    categoryLabel: 'Recepción',
    description: 'Punto de recepción donde se perita tu equipo y se emite tu Acta de Entrega con número de ODS.',
    image: '/images/web-publica/recepcion-principal.webp',
    featured: true,
  },
  {
    id: 'recepcion-2',
    title: 'Mostrador de Servicio al Cliente',
    category: 'recepcion',
    categoryLabel: 'Recepción',
    description: 'Espacio dedicado para asesorarte, revisar accesorios y responder tus inquietudes técnicas.',
    image: '/images/web-publica/mostrador-recepcion-atencion.webp',
  },
  {
    id: 'recepcion-3',
    title: 'Vista de Recepción desde el Exterior',
    category: 'recepcion',
    categoryLabel: 'Recepción',
    description: 'Visión panorámica de las instalaciones de atención al cliente.',
    image: '/images/web-publica/vista-recepcion-exterior.webp',
  },
  {
    id: 'lab-microelectronica',
    title: 'Laboratorio de Microelectrónica',
    category: 'taller',
    categoryLabel: 'Taller Especializado',
    description: 'Estación equipada para soldadura SMD, diagnóstico con microscopio y reparación de circuitos.',
    image: '/images/web-publica/laboratorio-microelectronica.webp',
    featured: true,
  },
  {
    id: 'puestos-trabajo',
    title: 'Banco de Trabajo y Diagnóstico',
    category: 'taller',
    categoryLabel: 'Taller Especializado',
    description: 'Puestos técnicos acondicionados para pruebas de hardware, monitores y peritajes térmicos.',
    image: '/images/web-publica/puestos-trabajo-taller.webp',
    featured: true,
  },
  {
    id: 'puesto-trabajo-individual',
    title: 'Estación de Ensamblaje y Ajuste',
    category: 'taller',
    categoryLabel: 'Taller Especializado',
    description: 'Mesa técnica para reconstrucción de bisagras, cambio de pantallas y ensambles minuciosos.',
    image: '/images/web-publica/puesto-trabajo-individual.webp',
  },
  {
    id: 'impresoras-taller',
    title: 'Área de Servicio de Impresoras',
    category: 'taller',
    categoryLabel: 'Taller Especializado',
    description: 'Zona destinada al mantenimiento de sistemas de tinta continua, cabezales y pruebas de impresión.',
    image: '/images/web-publica/servicio-tecnico-impresoras.webp',
  },
  {
    id: 'vitrina-laptops-redes',
    title: 'Exhibición de Laptops y Equipos de Red',
    category: 'equipamiento',
    categoryLabel: 'Equipamiento',
    description: 'Variedad de componentes, routers, cables de red, cargadores y repuestos originales.',
    image: '/images/web-publica/vitrina-laptops-redes.webp',
  },
  {
    id: 'vitrina-tintas',
    title: 'Insumos y Tintas Originales',
    category: 'equipamiento',
    categoryLabel: 'Equipamiento',
    description: 'Tintas específicas para recarga de marcas líderes, garantizando la vida de tus cabezales.',
    image: '/images/web-publica/vitrina-tintas-originales.webp',
  },
  {
    id: 'vitrina-camaras',
    title: 'Sistemas de Seguridad y Periféricos',
    category: 'equipamiento',
    categoryLabel: 'Equipamiento',
    description: 'Dispositivos de videovigilancia, cámaras de seguridad, periféricos y accesorios de cómputo.',
    image: '/images/web-publica/vitrina-seguridad-camaras.webp',
  },
  {
    id: 'vitrina-impresion',
    title: 'Suministros y Soluciones de Oficina',
    category: 'equipamiento',
    categoryLabel: 'Equipamiento',
    description: 'Accesorios y repuestos disponibles inmediatamente para soporte ágil en taller.',
    image: '/images/web-publica/vitrina-insumos-impresion.webp',
  },
];

export const WORK_PROCESS: ProcessStep[] = [
  {
    stepNumber: '01',
    title: 'Recepción y Peritaje Físico',
    badge: 'Ingreso Formal',
    description: 'Al entregar tu equipo en nuestro local, registramos el número de serie, tomamos fotografías de su estado físico y detallamos los accesorios recibidos.',
    detail: 'Generamos un Acta de Recepción con tu número de Orden de Servicio (ODS) y clave única.',
    icon: 'DocumentTextIcon',
  },
  {
    stepNumber: '02',
    title: 'Diagnóstico en Taller',
    badge: 'Express o Completa',
    description: 'Según la falla, tu orden se clasifica como Express (mantenimientos ágiles de 2 a 4 horas) o Completa (diagnóstico profundo de laboratorio en 24 a 48 horas).',
    detail: 'Pruebas de estrés térmico, inspección de placa y diagnóstico real sin suposiciones.',
    icon: 'CpuChipIcon',
  },
  {
    stepNumber: '03',
    title: 'Notificación y Presupuesto',
    badge: 'Aprobación del Cliente',
    description: 'Si tu equipo requiere repuestos nuevos (pantalla, teclado, batería, integrados), emitimos una cotización transparente con desglose de repuestos y mano de obra.',
    detail: 'No cambiamos ningún componente sin tu previa autorización por escrito o WhatsApp.',
    icon: 'CheckCircleIcon',
  },
  {
    stepNumber: '04',
    title: 'Reparación y Control de Calidad',
    badge: 'Técnicos Calificados',
    description: 'Ejecutamos la reparación con repuestos verificados y herramientas electroestáticas. Realizamos un checklist riguroso antes de autorizar el cierre de la orden.',
    detail: 'Verificación exhaustiva de temperaturas, puertos, pantalla y estabilidad del sistema.',
    icon: 'WrenchScrewdriverIcon',
  },
  {
    stepNumber: '05',
    title: 'Notificación y Retiro Seguro',
    badge: 'Entrega con Garantía',
    description: 'Recibes una notificación automática por WhatsApp informándote que tu equipo está listo. En el taller, pruebas tu equipo funcionando y firmas el Acta de Entrega.',
    detail: 'Cada servicio técnico incluye garantía sobre la mano de obra realizada.',
    icon: 'ShieldCheckIcon',
  },
];

export const FAQS: FAQItem[] = [
  {
    question: '¿Cómo puedo saber en qué estado se encuentra mi reparación?',
    answer: 'Puedes ingresar en cualquier momento a la sección "Consultar mi reparación" en este sitio web. Solo necesitas ingresar tu número de Orden de Servicio (ODS) y tu número de cédula para ver el estado en vivo, el técnico asignado, las fotografías de evidencia y el presupuesto aprobado.',
  },
  {
    question: '¿Cuánto tiempo toma el diagnóstico de una computadora?',
    answer: 'Para órdenes Express (mantenimiento preventivo, reinstalación de software básico o cambio de pasta térmica), el tiempo es de 2 a 4 horas. Para diagnósticos complejos de electrónica o fallas intermitentes, el peritaje toma de 24 a 48 horas laborables.',
  },
  {
    question: '¿Qué sucede si no apruebo el presupuesto de un repuesto?',
    answer: 'Si tras el diagnóstico no deseas adquirir el repuesto sugerido, la orden se cierra sin ningún cargo por el componente y tu equipo se te devuelve en las condiciones exactas en que ingresó.',
  },
  {
    question: '¿Qué documentos recibo al dejar y retirar mi equipo?',
    answer: 'Al ingresar recibes el Acta de Recepción con la descripción física, accesorios y número de ODS. Al retirar, tras verificar tu equipo encendido y funcional, se emite el Acta de Entrega con los términos y período de garantía de la reparación.',
  },
  {
    question: '¿Qué formas de contacto tienen para emergencias o dudas técnicas?',
    answer: 'Nuestro canal principal y más rápido es WhatsApp (0969620222), donde te atenderemos en nuestro horario habitual. También puedes visitarnos directamente en nuestro local en Riobamba o llamarnos a nuestro teléfono fijo.',
  },
];
