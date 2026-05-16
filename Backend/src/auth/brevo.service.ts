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
    this.API_KEY = this.validateEnvVariable(process.env.BREVO_API_KEY, 'BREVO_API_KEY').trim();
    this.senderEmail = this.validateEnvVariable(process.env.BREVO_SENDER_EMAIL, 'BREVO_SENDER_EMAIL').trim();

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
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #1a202c; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Hospital del Computador</h1>
        </div>
        <div style="padding: 40px 30px; color: #2d3748; line-height: 1.6;">
          <h2 style="color: #1a202c; margin-top: 0;">¡Bienvenido, ${nombre}!</h2>
          <p style="font-size: 16px;">
            Has sido registrado exitosamente en nuestro sistema de gestión. Para completar tu registro y poder acceder a tus servicios, es necesario que establezcas una contraseña de seguridad.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${enlace}" 
               target="_blank" 
               style="display: inline-block; padding: 14px 30px; 
                      background-color: #3182ce; color: #ffffff; 
                      text-decoration: none; border-radius: 8px; 
                      font-weight: bold; font-size: 16px;
                      box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              CREAR MI CONTRASEÑA
            </a>
          </div>
          <p style="font-size: 14px; color: #718096; text-align: center;">
            Este enlace es válido por 7 días. Si no puedes hacer clic en el botón, copia y pega el siguiente enlace en tu navegador:
          </p>
          <p style="font-size: 12px; color: #3182ce; word-break: break-all; text-align: center;">
            ${enlace}
          </p>
        </div>
        <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed;">
          <p style="margin: 0; font-size: 12px; color: #a0aec0;">
            © ${new Date().getFullYear()} Hospital del Computador. Todos los derechos reservados.
          </p>
          <p style="margin: 5px 0 0 0; font-size: 12px; color: #a0aec0;">
            Veloz, entre Diego de Ibarra y Uruguay | Riobamba, Ecuador
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Contenido del correo para restablecer contraseña
   */
  private generateResetContent(nombre: string, enlace: string): string {
    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e1e8ed; border-radius: 12px; overflow: hidden; background-color: #ffffff;">
        <div style="background-color: #1a202c; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; text-transform: uppercase;">Hospital del Computador</h1>
        </div>
        <div style="padding: 40px 30px; color: #2d3748; line-height: 1.6;">
          <h2 style="color: #1a202c; margin-top: 0;">Hola ${nombre},</h2>
          <p style="font-size: 16px;">
            Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Si tú no realizaste esta solicitud, puedes ignorar este mensaje con seguridad.
          </p>
          <div style="text-align: center; margin: 35px 0;">
            <a href="${enlace}" 
               target="_blank" 
               style="display: inline-block; padding: 14px 30px; 
                      background-color: #e67e22; color: #ffffff; 
                      text-decoration: none; border-radius: 8px; 
                      font-weight: bold; font-size: 16px;
                      box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              RESTABLECER MI CONTRASEÑA
            </a>
          </div>
          <p style="font-size: 14px; color: #718096; text-align: center;">
            Por seguridad, este enlace expirará en breve.
          </p>
        </div>
        <div style="background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e1e8ed;">
          <p style="margin: 0; font-size: 12px; color: #a0aec0;">
            © ${new Date().getFullYear()} Hospital del Computador. Todos los derechos reservados.
          </p>
        </div>
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

    // Log detallado para el desarrollador en la consola del backend
    console.error('--- ERROR DE BREVO DETECTADO ---');
    console.error('Status:', error.response?.status);
    console.error('Data:', JSON.stringify(errorData, null, 2));
    console.error('--------------------------------');

    this.logger.error('❌ Error al enviar correo con Brevo:', errorData);

    const detailMessage = typeof errorData === 'object' && errorData !== null
      ? (errorData as any).message || JSON.stringify(errorData)
      : String(errorData);

    throw new InternalServerErrorException(
      `Brevo rechazó el envío: ${detailMessage}`
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
