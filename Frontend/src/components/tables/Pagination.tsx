type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const pagesAroundCurrent = Array.from(
    { length: Math.min(3, totalPages) },
    (_, i) => i + Math.max(currentPage - 1, 1)
  );

  return (
    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-1.5 sm:gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Página anterior"
        className="flex items-center h-9 sm:h-10 justify-center rounded-lg border border-gray-300 bg-white px-2.5 sm:px-3.5 py-2 text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] text-xs sm:text-sm"
      >
        Anterior
      </button>
      <div className="flex items-center gap-1 sm:gap-2">
        {currentPage > 3 && <span className="px-1 sm:px-2 text-gray-500 dark:text-gray-400">...</span>}
        {pagesAroundCurrent.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            aria-label={`Página ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded ${
              currentPage === page
                ? "bg-brand-500 text-white"
                : "text-gray-700 dark:text-gray-400"
            } flex w-8 sm:w-10 items-center justify-center h-9 sm:h-10 rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-500/[0.08] hover:text-brand-500 dark:hover:text-brand-500`}
          >
            {page}
          </button>
        ))}
        {currentPage < totalPages - 2 && <span className="px-1 sm:px-2 text-gray-500 dark:text-gray-400">...</span>}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Página siguiente"
        className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-2.5 sm:px-3.5 py-2 text-gray-700 shadow-theme-xs text-xs sm:text-sm hover:bg-gray-50 h-9 sm:h-10 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
      >
        Siguiente
      </button>
    </div>
  );
};

export default Pagination;
