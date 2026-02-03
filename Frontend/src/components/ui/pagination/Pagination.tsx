"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-100 dark:border-white/[0.05]">
      <div className="mb-4 sm:mb-0">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Página {currentPage} de {totalPages}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || disabled}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          aria-label="Página anterior"
        >
          Anterior
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            disabled={disabled}
            className={`px-3 py-1 border rounded-md text-sm font-medium ${
              currentPage === page
                ? "bg-blue-500 text-white border-blue-500"
                : "border-gray-300 text-gray-700 dark:text-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={`Ir a página ${page}`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || disabled}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
          aria-label="Página siguiente"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
