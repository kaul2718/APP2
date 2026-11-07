import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidChecklistItems', async: false })
export class IsValidChecklistItemsConstraint implements ValidatorConstraintInterface {
  validate(items: any, _args: ValidationArguments) {
    if (!items) return false;

    // Caso 1: Array de strings (formato legado)
    if (Array.isArray(items)) {
      return (
        items.length > 0 &&
        items.every((it) => typeof it === 'string' && it.trim().length > 0)
      );
    }

    // Caso 2: Objeto estructurado { fisica?: string[], funcional?: string[] }
    if (typeof items === 'object' && items !== null) {
      const fisica = items.fisica;
      const funcional = items.funcional;

      const isValidArray = (arr: any) =>
        Array.isArray(arr) &&
        arr.every((it) => typeof it === 'string' && it.trim().length > 0);

      const hasFisica = fisica !== undefined && isValidArray(fisica);
      const hasFuncional = funcional !== undefined && isValidArray(funcional);

      // Debe tener al menos uno de los dos arreglos válidos y al menos un ítem en total
      if (!hasFisica && !hasFuncional) {
        return false;
      }

      const totalItems =
        (hasFisica ? (fisica as string[]).length : 0) +
        (hasFuncional ? (funcional as string[]).length : 0);
      return totalItems > 0;
    }

    return false;
  }

  defaultMessage(_args: ValidationArguments) {
    return 'Los items del checklist deben ser un array de strings o un objeto estructurado { fisica?: string[], funcional?: string[] } con al menos un punto de revisión';
  }
}

export class CreateChecklistTemplateDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre de la plantilla es requerido' })
  nombre: string;

  @IsNumber({}, { message: 'El ID del tipo de equipo debe ser un número válido' })
  @IsNotEmpty({ message: 'El tipo de equipo es requerido' })
  tipoEquipoId: number;

  @Validate(IsValidChecklistItemsConstraint)
  @IsNotEmpty({ message: 'Los items del checklist son requeridos' })
  items: string[] | { fisica?: string[]; funcional?: string[] };

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}

export class UpdateChecklistTemplateDto {
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsNumber({}, { message: 'El ID del tipo de equipo debe ser un número válido' })
  @IsOptional()
  tipoEquipoId?: number;

  @Validate(IsValidChecklistItemsConstraint)
  @IsOptional()
  items?: string[] | { fisica?: string[]; funcional?: string[] };

  @IsBoolean()
  @IsOptional()
  estado?: boolean;
}
