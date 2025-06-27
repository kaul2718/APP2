import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/rol.enum';
import { UserActiveInterface } from 'src/common/interfaces/user-active.interface';
import { ActiveUser } from 'src/common/decorators/active-user.decorator';
import { Auth } from './decorators/auth.decorator';


interface RequestWithUser extends Request {
    user: {
        correo: string;
        role: string;
    };
}

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("register")
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        console.log('📥 Petición de login recibida:', loginDto);

        return this.authService.login(loginDto);
    }

    @Get('profile')
    @Auth(Role.CLIENT)
    profile(@ActiveUser() user: UserActiveInterface) {
        return this.authService.profile(user);
    }
}
