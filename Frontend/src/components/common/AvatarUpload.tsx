'use client';

import React, { useRef, useState, useEffect } from 'react';
import { CameraIcon, TrashIcon, UserIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';

interface AvatarUploadProps {
  currentPhotoUrl?: string | null;
  nombre?: string;
  apellido?: string;
  onFileSelect: (file: File | null) => void;
  size?: 'md' | 'lg' | 'xl';
  disabled?: boolean;
}

export default function AvatarUpload({
  currentPhotoUrl,
  nombre = '',
  apellido = '',
  onFileSelect,
  size = 'lg',
  disabled = false,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);
  const [hasNewFile, setHasNewFile] = useState(false);

  useEffect(() => {
    setPreviewUrl(currentPhotoUrl || null);
    setHasNewFile(false);
  }, [currentPhotoUrl]);

  const initials = (() => {
    const n = nombre.trim().charAt(0).toUpperCase();
    const a = apellido.trim().charAt(0).toUpperCase();
    return `${n}${a}` || 'U';
  })();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen (JPG, PNG o WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5 MB');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setHasNewFile(true);
    onFileSelect(file);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setHasNewFile(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onFileSelect(null);
  };

  const sizeClasses = {
    md: 'w-16 h-16 text-lg',
    lg: 'w-24 h-24 text-2xl',
    xl: 'w-28 h-28 text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-brand-500/20 dark:border-brand-500/30 shadow-md bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center cursor-pointer transition-all duration-200 group-hover:border-brand-500 group-hover:shadow-lg`}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={`${nombre} ${apellido}`}
              className="w-full h-full object-cover"
            />
          ) : nombre ? (
            <span className="font-bold text-gray-700 dark:text-gray-200 tracking-wider">
              {initials}
            </span>
          ) : (
            <UserIcon className="w-1/2 h-1/2 text-gray-400 dark:text-gray-300" />
          )}

          {/* Hover Overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <CameraIcon className="w-6 h-6 mb-0.5" />
              <span className="text-[10px] font-semibold tracking-wide">Cambiar</span>
            </div>
          )}
        </div>

        {/* Botón flotante para cambiar/añadir */}
        {!disabled && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 p-1.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white shadow-md transition-transform duration-150 hover:scale-110"
            title="Subir foto de perfil"
          >
            <CameraIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Acciones y feedback */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          disabled={disabled}
        >
          {previewUrl ? 'Cambiar foto' : 'Subir foto'}
        </button>

        {previewUrl && !disabled && (
          <>
            <span className="text-gray-300 dark:text-gray-600">•</span>
            <button
              type="button"
              onClick={handleRemove}
              className="text-xs font-semibold text-error-500 hover:text-error-600 hover:underline flex items-center gap-1"
            >
              <TrashIcon className="w-3.5 h-3.5" />
              Quitar
            </button>
          </>
        )}
      </div>

      {hasNewFile && (
        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          • Pendiente de guardar
        </span>
      )}
    </div>
  );
}
