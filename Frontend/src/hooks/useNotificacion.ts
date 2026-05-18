'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { apiRequest } from '@/lib/api';

export interface Notificacion {
  id: number;
  mensaje: string;
  leido: boolean;
  fechaEnvio: string;
  usuarioId: number;
  ordenServicioId?: number;
  tipo?: {
    id: number;
    nombre: string;
    descripcion?: string | null;
  };
}

export function useNotificacion() {
  const { data: session, status } = useSession();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const socketRef = useRef<Socket | null>(null);

  const usuarioId = session?.user?.id;

  // Cargar notificaciones mediante REST API
  const fetchNotificaciones = useCallback(async () => {
    if (!usuarioId || !session?.accessToken) return;
    try {
      setLoading(true);
      const data = await apiRequest<Notificacion[]>(`/notificaciones/usuario/${usuarioId}`, {}, session);
      setNotificaciones(data || []);
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setLoading(false);
    }
  }, [usuarioId, session]);

  // Marcar una notificación como leída
  const marcarLeida = useCallback(async (id: number) => {
    if (!session) return;
    try {
      // Optimistic update
      setNotificaciones((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, leido: true } : notif))
      );
      await apiRequest<Notificacion>(`/notificaciones/${id}/leida`, { method: 'PATCH' }, session);
    } catch (error) {
      console.error('Error al marcar como leída:', error);
      // Revertir en caso de error
      fetchNotificaciones();
    }
  }, [session, fetchNotificaciones]);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = useCallback(async () => {
    if (!usuarioId || !session) return;
    try {
      // Optimistic update
      setNotificaciones((prev) => prev.map((notif) => ({ ...notif, leido: true })));
      await apiRequest<void>(`/notificaciones/usuario/${usuarioId}/leidas`, { method: 'PATCH' }, session);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar todas como leídas:', error);
      fetchNotificaciones();
    }
  }, [usuarioId, session, fetchNotificaciones]);

  // Eliminar una notificación (soft delete)
  const eliminarNotificacion = useCallback(async (id: number) => {
    if (!session) return;
    try {
      // Optimistic update
      setNotificaciones((prev) => prev.filter((notif) => notif.id !== id));
      await apiRequest<void>(`/notificaciones/${id}`, { method: 'DELETE' }, session);
      toast.success('Notificación eliminada');
    } catch (error) {
      console.error('Error al eliminar notificación:', error);
      fetchNotificaciones();
    }
  }, [session, fetchNotificaciones]);

  // Conectar WebSocket y escuchar eventos en tiempo real
  useEffect(() => {
    if (status !== 'authenticated' || !usuarioId) return;

    // Cargar inicialmente
    fetchNotificaciones();

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
    
    // Configurar Socket.io client
    const socket = io(backendUrl, {
      transports: ['websocket'],
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Conectado a WebSocket de notificaciones con ID:', socket.id);
      // Unirse a la sala privada del usuario
      socket.emit('join', { usuarioId: Number(usuarioId) });
    });

    socket.on('nueva-notificacion', (nueva: Notificacion) => {
      console.log('Recibida nueva notificación en tiempo real:', nueva);
      
      // Agregar al estado local al inicio
      setNotificaciones((prev) => {
        // Evitar duplicados si por casualidad se recibe doble
        if (prev.some((n) => n.id === nueva.id)) return prev;
        return [nueva, ...prev];
      });

      // Mostrar toast elegante con el mensaje de la notificación
      toast.info(nueva.mensaje, {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      // Intentar reproducir un sonido de notificación sutil
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.4;
        audio.play().catch(() => {
          // Algunos navegadores bloquean el autoplay de audio
        });
      } catch (err) {
        // Silenciar errores de audio
      }
    });

    socket.on('disconnect', () => {
      console.log('Desconectado del WebSocket de notificaciones');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [status, usuarioId, fetchNotificaciones]);

  const unreadCount = notificaciones.filter((n) => !n.leido).length;

  return {
    notificaciones,
    unreadCount,
    loading,
    marcarLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    fetchNotificaciones,
  };
}
