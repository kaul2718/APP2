import React, { ReactNode } from "react";

interface ComponentCardProps {
  title: string | ReactNode; // ✅ <-- aquí permitimos ReactNode
  children: React.ReactNode;
  className?: string; // Additional custom classes for styling
  desc?: string; // Description text
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
}) => {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] min-w-0 max-w-full ${className}`}
    >
      {/* Card Header */}
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {typeof title === "string" ? (
          <h2 className="text-base font-medium text-gray-800 dark:text-white/90 break-words">
            {title}
          </h2>
        ) : (
          <div className="text-base font-medium text-gray-800 dark:text-white/90 min-w-0">
            {title}
          </div>
        )}
        {desc && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 break-words">
            {desc}
          </p>
        )}
      </div>

      {/* Card Body */}
      <div className="p-3.5 border-t border-gray-100 dark:border-gray-800 sm:p-6 min-w-0">
        <div className="space-y-6 min-w-0">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
