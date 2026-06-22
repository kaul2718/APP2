# GUÍA Y GUION DE PRE-DEFENSA: CAPÍTULO III (MARCO METODOLÓGICO)
**Proyecto:** Aplicación Web de Gestión de Servicios para "Hospital del Computador"

Este documento contiene el guion y los puntos clave que debes exponer durante tu pre-defensa para el **Capítulo III**. Está estructurado para que demuestres al tribunal cómo cada sección metodológica responde directamente a un objetivo específico de tu tesis, y cómo se apoya en el **Manual Técnico** para los detalles de ingeniería.

---

## 1. INTRODUCCIÓN GENERAL AL CAPÍTULO III
*   **Qué debes transmitir:** Ubicar al tribunal en el tipo de estudio y las tecnologías utilizadas.
*   **Palabras clave:** Proyecto técnico aplicativo, arquitectura desacoplada, Next.js, NestJS, PostgreSQL.

### 🗣️ Guion de Introducción:
> *"Estimados miembros del tribunal, el Capítulo III describe el Marco Metodológico que guió el desarrollo de este proyecto técnico de carácter aplicativo. El sistema se diseñó bajo una arquitectura cliente-servidor desacoplada utilizando Next.js en el frontend, NestJS en el backend y PostgreSQL como base de datos. Para asegurar la claridad de la exposición, la metodología se estructuró de tal manera que cada sección del capítulo responde directamente a uno de los objetivos específicos planteados en la investigación."*

---

## 2. SECCIÓN 3.2: DIAGNÓSTICO DEL PROCESO ACTUAL
*   **Objetivo que resuelve:** **Objetivo Específico 1:** *"Identificar el proceso de la gestión de servicios de la empresa Hospital del Computador para conocer su funcionamiento."*
*   **Puntos clave a destacar:** 
    *   Método Cualitativo y aplicación de la entrevista semiestructurada (Anexo A de la tesis).
    *   Levantamiento del proceso tradicional (*AS-IS*): lentitud, monousuario, dependencia de WhatsApp.
    *   Definición del nuevo proceso automatizado (*TO-BE*) mediante diagramas de procesos BPMN.

### 🗣️ Guion de la Sección 3.2:
> *"Para resolver el **primer objetivo específico**, realizamos un diagnóstico operativo de la empresa Hospital del Computador utilizando un enfoque cualitativo. Aplicamos una entrevista semiestructurada al personal administrativo y técnico (detallada en el Anexo A de la tesis) y realizamos observación directa en el taller.*
> 
> *Este análisis nos permitió levantar el flujo de trabajo tradicional (proceso AS-IS), identificando como principales limitaciones la dependencia de un sistema local instalado en una sola computadora (lo que impedía el acceso simultáneo) y el seguimiento informal de reparaciones a través de mensajes de WhatsApp.*
> 
> *Con base en este diagnóstico, diseñamos el nuevo modelo operativo multiusuario representado mediante diagramas de procesos en notación **BPMN** (proceso TO-BE), sentando las bases funcionales de la aplicación."*

---

## 3. SECCIÓN 3.3: CARACTERÍSTICAS UX/UI Y ACCESIBILIDAD
*   **Objetivo que resuelve:** **Objetivo Específico 2:** *"Identificar las características de UX/UI para mejorar la accesibilidad de la aplicación web."*
*   **Puntos clave a destacar:**
    *   Método Analítico-Descriptivo y revisión de literatura.
    *   Estándar de accesibilidad internacional **WCAG 2.1 (Nivel AA)**.
    *   Uso de directrices de Diseño Centrado en el Usuario (DCU) para mitigar la fatiga visual en entornos de taller.

### 🗣️ Guion de la Sección 3.3:
> *"En respuesta al **segundo objetivo específico**, llevamos a cabo un análisis de las características de usabilidad y accesibilidad aplicables a nuestro contexto. Mediante una revisión bibliográfica y documental de normas de usabilidad y de las pautas internacionales **WCAG 2.1 (en su Nivel de Conformidad AA)**, definimos las especificaciones visuales de la interfaz.*
> 
> *Establecimos criterios estrictos para el uso del contraste cromático, fuentes tipográficas altamente legibles para pantallas de taller y navegación accesible por teclado. De este modo, justificamos científicamente el uso de componentes accesibles para mitigar la carga cognitiva de los operarios."*

---

## 4. SECCIÓN 3.4: DESARROLLO DE LOS MÓDULOS (SCRUM)
*   **Objetivo que resuelve:** **Objetivo Específico 3:** *"Desarrollar los módulos para la aplicación web utilizando las características presentadas en el diseño UX/UI."*
*   **Puntos clave a destacar:**
    *   Uso de la metodología ágil **Scrum** y su división en 5 fases de ingeniería.
    *   Factibilidad técnica/operativa/económica y análisis cualitativo de riesgos ( NR = P * I ).
    *   Estructura iterativa de **8 Sprints** (de base de datos a WebSockets y reportería).
    *   **VINCULACIÓN CLAVE:** La tesis describe el marco metodológico; la especificación física y de código se deriva al **Manual Técnico**.

### 🗣️ Guion de la Sección 3.4:
> *"Para cumplir con el **tercer objetivo específico**, correspondiente al desarrollo del sistema, adoptamos la metodología ágil **Scrum** dividida en cinco fases de ingeniería:*
> 
> * En la **Fase de Análisis y Planificación**, definimos los roles del equipo, analizamos la factibilidad técnica, operativa y económica, y realizamos una matriz cualitativa de riesgos (calculados como Probabilidad por Impacto). Esta fase se detalla en las **Secciones 4 y 5 del Manual Técnico**.*
> * En la **Fase de Planeación y Estimación**, conformamos el Product Backlog. Las fichas de historias de usuario bajo el formato BDD (Dado que/Cuando/Entonces) se derivaron a la **Sección 7 del Manual Técnico**.*
> * En la **Fase de Implementación**, estructuramos el desarrollo en **8 Sprints**. Iniciamos con el modelado de la base de datos (Sprint 1), implementamos la seguridad NextAuth y guards de NestJS (Sprints 2-3), el peritaje dinámico por JSONB y presupuestos (Sprints 4-5), control de compras y stock (Sprint 6), WebSockets en tiempo real (Sprint 7) y paneles de reportería final (Sprint 8).*
> 
> *El tribunal podrá verificar que las especificaciones físicas de este desarrollo, incluyendo los diagramas UML de componentes y despliegue, wireframes y el diccionario de datos físico de **29 tablas**, se consolidaron y detallaron en las **Secciones 8, 9 y 10 del Manual Técnico**."*

---

## 5. SECCIÓN 3.5: EVALUACIÓN DE ACCESIBILIDAD
*   **Objetivo que resuelve:** **Objetivo Específico 4:** *"Evaluar la accesibilidad de la aplicación web mediante el estándar Web Content Accessibility Guidelines."*
*   **Puntos clave a destacar:**
    *   Método Evaluativo de accesibilidad.
    *   Selección de interfaces críticas (Recepción, Panel Técnico, Portal Público).
    *   Evaluación automática mediante WAVE y Lighthouse, combinada con pruebas manuales de navegación por teclado.

### 🗣️ Guion de la Sección 3.5:
> *"Por último, para resolver el **cuarto objetivo específico**, planteamos el marco metodológico para evaluar la accesibilidad de la aplicación. Para ello, seleccionamos las tres interfaces con mayor interacción del sistema: Recepción, Panel Técnico y el Portal Público del cliente.*
> 
> *La validación se diseñó combinando auditorías automáticas (utilizando las herramientas compatibles **WAVE** y **Lighthouse**) junto con pruebas manuales de navegación por teclado para validar el contraste y los anillos de foco. Esto nos permitió generar reportes objetivos de cumplimiento de los cuatro principios POUR de las pautas WCAG 2.1, cuyos resultados cuantitativos se exponen detalladamente en el Capítulo IV."*

---

## 6. CIERRE DE LA EXPOSICIÓN
*   **Qué transmitir:** Seguridad, orden y apertura a preguntas.

### 🗣️ Guion de Cierre:
> *"De esta manera, el Capítulo III justifica metodológicamente la transición operativa del taller hacia un entorno web ágil, seguro e inclusivo. Quedo a su entera disposición para solventar cualquier inquietud que tengan respecto al marco metodológico aplicado. Muchas gracias."*
