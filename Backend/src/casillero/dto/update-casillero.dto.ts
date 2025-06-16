import { PartialType } from '@nestjs/mapped-types';
import { CreateCasilleroDto } from './create-casillero.dto';
import { EstadoCasillero } from 'src/common/enums/estadoCasillero.enum';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCasilleroDto extends PartialType(CreateCasilleroDto) {
    @IsString()
    @IsOptional()
    estado: EstadoCasillero;
    
    @IsString()
    @IsOptional()
    descripcion: string;
  }