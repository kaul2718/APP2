import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Request, UseGuards, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { EnviarInvitacionDto } from './dto/enviar-invitacion.dto';
import { GuardarNuevaClaveDto } from './dto/guardar-nueva-clave.dto';
import { AuthGuard } from './guard/auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

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
    profile(@ActiveUser() user: UserActiveInterface) {
        return this.authService.profile(user);
    }

    // ✅ Nueva ruta para enviar invitación al correo
    @Post('enviar-invitacion')
    enviarInvitacion(@Body() dto: EnviarInvitacionDto) {
        return this.authService.enviarInvitacion(dto);
    }

    // ✅ Nueva ruta para guardar la contraseña desde el enlace
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
