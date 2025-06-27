// components/AccessDenied.tsx
export default function AccessDenied({ message = "No tienes acceso." }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <svg
        className="w-16 h-16 text-red-500 mb-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414-1.414M7.05 7.05l9.9 9.9m0-9.9l-9.9 9.9"
        />
      </svg>
      <h2 className="text-xl font-bold text-red-600">Acceso denegado</h2>
      <p className="text-gray-600 mt-2">{message}</p>
    </div>
  );
}
