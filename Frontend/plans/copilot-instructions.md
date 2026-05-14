Backend (NestJS)
El backend está construido con NestJS 10 y utiliza PostgreSQL como base de datos. La arquitectura es modular con los siguientes componentes principales:

Módulos principales:

Auth: Autenticación y autorización (con JWT, integración Brevo para emails)
Orders: Gestión de órdenes técnicas
Actividad Técnica: Registro de actividades técnicas realizadas
Presupuesto: Gestión de presupuestos
Inventario: Control de repuestos y equipo
Users & Roles: Gestión de usuarios y roles
Equipos, Marcas, Modelos: Catálogos de equipos
Casillero: Sistema de casilleros
Notificaciones: Sistema de alertas
Configuración:

Puerto: 3000
Ruta API: /api/v1
Validación global con pipes
CORS habilitado
Base de datos: PostgreSQL con TypeORM
Frontend (Next.js)
El frontend está desarrollado con Next.js 15 y React 19, usando Tailwind CSS v4 para estilos.

Stack tecnológico:

Next.js 15 con App Router
React 19
TypeScript
Tailwind CSS v4
Componentes de UI (MUI Icons, Heroicons, Lucide)
Autenticación: NextAuth.js
Gráficas: ApexCharts y FullCalendar
Gestión de estado y drag-and-drop
Estructura de páginas:

Panel admin con sidebar
Sección de páginas de ancho completo
Rutas API internas
Soporte para modo oscuro
Caso de Uso
Es un Sistema de Gestión de Servicio Técnico para Computadores que permite:

Crear y gestionar órdenes de servicio
Registrar actividades técnicas
Generar presupuestos
Controlar inventario de repuestos
Notificar a clientes y técnicos
Organizar equipos y marcas