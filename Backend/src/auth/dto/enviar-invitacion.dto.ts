import { IsEmail, IsNotEmpty } from 'class-validator';

export class EnviarInvitacionDto {
    @IsEmail()
    @IsNotEmpty()
    correo: string;
}
