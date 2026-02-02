import { IsNumber, IsNotEmpty } from 'class-validator';

export class CreateUsuarioRolDto {
  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  roleId: number;
}
