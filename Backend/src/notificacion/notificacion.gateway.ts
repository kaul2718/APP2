import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificacionGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Cliente conectado a WebSockets: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Cliente desconectado de WebSockets: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(client: Socket, payload: { usuarioId: number }) {
    if (payload && payload.usuarioId) {
      const room = `user_${payload.usuarioId}`;
      client.join(room);
      console.log(`Cliente ${client.id} se unió a la sala: ${room}`);
      return { status: 'joined', room };
    }
  }

  // Método para enviar notificaciones a un usuario específico
  enviarNotificacionAUsuario(usuarioId: number, notificacion: any) {
    const room = `user_${usuarioId}`;
    this.server.to(room).emit('nueva-notificacion', notificacion);
    console.log(`Emitido nueva-notificacion a la sala: ${room}`);
  }
}
