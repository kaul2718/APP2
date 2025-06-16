import * as express from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        // Puedes agregar otros campos que tengas en el objeto user, como role, email, etc.
      };
    }
  }
}
