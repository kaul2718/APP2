// src/types/express.d.ts
import { User } from '../users/entities/user.entity'; // Asegúrate de que la ruta sea correcta

declare global {
  namespace Express {
    interface Request {
      user: User; // Aquí defines la propiedad 'user'
    }
  }
}
