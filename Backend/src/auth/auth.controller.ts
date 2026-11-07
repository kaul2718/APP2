import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Header,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { ActivacionService } from './activacion.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { GenerarActivacionDto } from './dto/generar-activacion.dto';
import { ConsumirActivacionDto } from './dto/consumir-activacion.dto';
import { EnviarInvitacionDto } from './dto/enviar-invitacion.dto';
import { GuardarNuevaClaveDto } from './dto/guardar-nueva-clave.dto';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { AuthGuard } from './guard/auth.guard';
import { Auth } from './decorators/auth.decorator';
import { CurrentUser } from './decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly activacionService: ActivacionService,
  ) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  profile(@ActiveUser() user: any) {
    return this.authService.profile(user);
  }

  // ✅ Emisión presencial de código QR de activación (Recepción / Admin)
  @Auth('admin', 'recep')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Post('activacion/generar')
  generarActivacion(
    @Body() dto: GenerarActivacionDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const operadorId = user?.sub || user?.id || 1;
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip;
    return this.activacionService.generarTokenActivacion(dto, operadorId, ip);
  }

  // ✅ Validación de token de activación antes de renderizar formulario cliente
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Get('activacion/validar/:token')
  validarActivacion(@Param('token') token: string) {
    return this.activacionService.validarTokenActivacion(token);
  }

  // ✅ Consumo de credencial y establecimiento de contraseña por el cliente
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  @Post('activacion/consumir')
  consumirActivacion(
    @Body() dto: ConsumirActivacionDto,
    @Req() req: Request,
  ) {
    const ip =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      req.ip;
    return this.activacionService.consumirTokenActivacion(dto, ip);
  }

  // Invitación por correo (Brevo)
  @Post('enviar-invitacion')
  enviarInvitacion(@Body() dto: EnviarInvitacionDto) {
    return this.authService.enviarInvitacion(dto);
  }

  // Guardar clave desde enlace de correo
  @Post('guardar-clave')
  guardarClave(@Body() dto: GuardarNuevaClaveDto) {
    return this.authService.guardarNuevaClave(dto);
  }

  @Post('restablecer-contrasena')
  @HttpCode(HttpStatus.OK)
  restablecerContrasena(@Body('correo') correo: string) {
    return this.authService.restablecerContraseña(correo);
  }
}
