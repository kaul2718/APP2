// src/auth/brevo.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class BrevoService {
    private readonly logger = new Logger(BrevoService.name);
    private readonly BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
    private readonly API_KEY: string;
    private readonly senderEmail: string;

    constructor() {
        this.API_KEY = this.validateEnvVariable(process.env.BREVO_API_KEY, 'BREVO_API_KEY');
        this.senderEmail = this.validateEnvVariable(process.env.BREVO_SENDER_EMAIL, 'BREVO_SENDER_EMAIL');

        this.logEnvVariables();
    }

    /**
     * Envía una invitación por correo electrónico para crear una contraseña
     */
    async enviarInvitacion(nombre: string, correo: string, enlace: string): Promise<void> {
        try {
            const emailData = this.buildEmailData(nombre, correo, enlace, 'invitacion');
            const config = this.getRequestConfig();

            await axios.post(this.BREVO_API_URL, emailData, config);
            this.logger.log(`✉️ Correo de invitación enviado a ${correo}`);
        } catch (error) {
            this.handleError(error as AxiosError);
        }
    }

    /**
     * Envía un correo para restablecer la contraseña
     */
    async enviarResetPassword(nombre: string, correo: string, enlace: string): Promise<void> {
        try {
            const emailData = this.buildEmailData(nombre, correo, enlace, 'reset');
            const config = this.getRequestConfig();

            await axios.post(this.BREVO_API_URL, emailData, config);
            this.logger.log(`🔁 Correo de restablecimiento de contraseña enviado a ${correo}`);
        } catch (error) {
            this.handleError(error as AxiosError);
        }
    }

    /**
     * Construye el objeto de datos para el correo electrónico
     */
    private buildEmailData(
        nombre: string,
        correo: string,
        enlace: string,
        tipo: 'invitacion' | 'reset'
    ) {
        const subject =
            tipo === 'invitacion'
                ? 'Invitación para crear tu contraseña'
                : 'Restablece tu contraseña';

        const htmlContent =
            tipo === 'invitacion'
                ? this.generateInvitacionContent(nombre, enlace)
                : this.generateResetContent(nombre, enlace);

        return {
            sender: {
                name: 'Hospital del Computador',
                email: this.senderEmail
            },
            to: [{
                email: correo,
                name: nombre
            }],
            subject,
            htmlContent
        };
    }

    /**
     * Contenido del correo para invitación
     */
    private generateInvitacionContent(nombre: string, enlace: string): string {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hola ${nombre},</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Has sido registrado en nuestro sistema. Por favor, haz clic en el siguiente 
          enlace para establecer tu contraseña:
        </p>
        <a href="${enlace}" 
           target="_blank" 
           style="display: inline-block; padding: 10px 20px; 
                  background-color: #3498db; color: white; 
                  text-decoration: none; border-radius: 5px; margin: 15px 0;">
          Crear contraseña
        </a>
        <p style="font-size: 14px; color: #7f8c8d;">
          Si no solicitaste esto, ignora este mensaje.
        </p>
      </div>
    `;
    }

    /**
     * Contenido del correo para restablecer contraseña
     */
    private generateResetContent(nombre: string, enlace: string): string {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Hola ${nombre},</h2>
        <p style="font-size: 16px; line-height: 1.6;">
          Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el siguiente enlace para continuar:
        </p>
        <a href="${enlace}" 
           target="_blank" 
           style="display: inline-block; padding: 10px 20px; 
                  background-color: #e67e22; color: white; 
                  text-decoration: none; border-radius: 5px; margin: 15px 0;">
          Restablecer contraseña
        </a>
        <p style="font-size: 14px; color: #7f8c8d;">
          Si no realizaste esta solicitud, puedes ignorar este mensaje.
        </p>
      </div>
    `;
    }

    /**
     * Obtiene la configuración para la petición HTTP
     */
    private getRequestConfig() {
        return {
            headers: {
                'api-key': this.API_KEY,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };
    }

    /**
     * Maneja errores de la petición HTTP
     */
    private handleError(error: AxiosError): void {
        const errorData = error.response?.data || error.message;
        this.logger.error('❌ Error al enviar correo con Brevo:', errorData);

        throw new InternalServerErrorException(
            'No se pudo enviar el correo de invitación'
        );
    }

    /**
     * Valida que una variable de entorno exista
     */
    private validateEnvVariable(value: string | undefined, name: string): string {
        if (!value) {
            throw new Error(`Variable de entorno ${name} no definida`);
        }
        return value;
    }

    /**
     * Registra las variables de entorno para depuración
     */
    private logEnvVariables(): void {
        this.logger.debug(`🔑 API_KEY: ${this.API_KEY ? '*** (oculto por seguridad)' : 'No definido'}`);
        this.logger.debug(`📨 SENDER_EMAIL: ${this.senderEmail}`);
    }
}
