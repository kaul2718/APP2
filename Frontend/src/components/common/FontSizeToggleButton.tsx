"use client";

import React, { useState } from "react";
import { useFontSize, FontSize } from "../../context/FontSizeContext";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

export const FontSizeToggleButton: React.FC = () => {
  const { fontSize, setFontSize } = useFontSize();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdown = () => {
    setIsOpen(false);
  };

  const handleSelectSize = (size: FontSize) => {
    setFontSize(size);
    closeDropdown();
  };

  // Helper to show indicator of current state next to button
  const getIndicatorText = () => {
    if (fontSize === "large") return "+";
    if (fontSize === "xlarge") return "++";
    return "";
  };

  const sizeOptions: { value: FontSize; label: string; zoom: string }[] = [
    { value: "normal", label: "Normal", zoom: "100%" },
    { value: "large", label: "Grande", zoom: "112%" },
    { value: "xlarge", label: "Muy Grande", zoom: "125%" },
  ];

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-11 w-11 hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        title="Tamaño de letra (Accesibilidad)"
        aria-label="Seleccionar tamaño de letra"
        aria-expanded={isOpen}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Large 'A' */}
          <path
            d="M3 18L8 5L13 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4.5 14H11.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Small 'A' */}
          <path
            d="M14 18L17.5 9L21 18"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 15H20"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Visual indicator of the extra size (+ or ++) */}
        {getIndicatorText() && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[9px] font-bold text-white">
            {getIndicatorText()}
          </span>
        )}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-dark"
      >
        <div className="px-3 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800 mb-1">
          Tamaño de letra
        </div>
        <ul className="flex flex-col gap-0.5">
          {sizeOptions.map((option) => (
            <li key={option.value}>
              <DropdownItem
                onClick={() => handleSelectSize(option.value)}
                baseClassName="flex w-full items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors text-left"
                className={
                  fontSize === option.value
                    ? "bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400 font-medium"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5"
                }
              >
                <span>
                  {option.label} <span className="text-xs opacity-60">({option.zoom})</span>
                </span>
                {fontSize === option.value && (
                  <svg
                    className="w-4 h-4 text-brand-500 dark:text-brand-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </DropdownItem>
            </li>
          ))}
        </ul>
      </Dropdown>
    </div>
  );
};
