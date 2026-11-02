import Link from "next/link";
import React from "react";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  pageTitle: string;
  items?: BreadcrumbItem[];
  homeHref?: string;
  homeLabel?: string;
  hideBreadcrumbNav?: boolean;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle,
  items,
  homeHref = "/dashboard",
  homeLabel = "Inicio",
  hideBreadcrumbNav = false,
}) => {
  const isDashboard =
    pageTitle.toLowerCase().includes("dashboard") ||
    pageTitle.toLowerCase().includes("panel administrativo");

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-2.5 border-b border-gray-100 dark:border-gray-800/60">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        {pageTitle}
      </h1>
      {!hideBreadcrumbNav && !isDashboard && (
        <nav aria-label="Ruta de navegación">
          <ol className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <li>
              <Link
                className="inline-flex items-center gap-1 text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400 transition-colors font-medium"
                href={homeHref}
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span>{homeLabel}</span>
              </Link>
            </li>
            {items && items.length > 0 ? (
              items.map((item, idx) => (
                <React.Fragment key={idx}>
                  <li className="text-gray-300 dark:text-gray-600">
                    <ChevronRightIcon className="w-3 h-3" />
                  </li>
                  <li>
                    {item.href ? (
                      <Link
                        href={item.href}
                        className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                      >
                        {item.label}
                      </Link>
                    ) : (
                      <span className="font-semibold text-gray-800 dark:text-white">
                        {item.label}
                      </span>
                    )}
                  </li>
                </React.Fragment>
              ))
            ) : (
              <>
                <li className="text-gray-300 dark:text-gray-600">
                  <ChevronRightIcon className="w-3 h-3" />
                </li>
                <li className="font-semibold text-gray-800 dark:text-white truncate max-w-[200px] sm:max-w-xs">
                  {pageTitle}
                </li>
              </>
            )}
          </ol>
        </nav>
      )}
    </div>
  );
};

export default PageBreadcrumb;
