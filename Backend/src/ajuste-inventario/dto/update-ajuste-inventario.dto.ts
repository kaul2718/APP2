import { PartialType } from '@nestjs/swagger';
import { CreateAjusteInventarioDto } from './create-ajuste-inventario.dto';

export class UpdateAjusteInventarioDto extends PartialType(CreateAjusteInventarioDto) {}
