import {registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments,} from 'class-validator';

  @ValidatorConstraint({ async: false })
  export class CedulaEcuatorianaConstraint implements ValidatorConstraintInterface {
    validate(cedula: string, args: ValidationArguments) {
      if (!cedula || cedula.length !== 10) return false;
  
      const digitos = cedula.split('').map(Number);
      const digitoVerificador = digitos.pop()!;
      const suma = digitos.reduce((acc, val, idx) => {
        const multiplicador = idx % 2 === 0 ? 2 : 1;
        const resultado = val * multiplicador;
        return acc + (resultado > 9 ? resultado - 9 : resultado);
      }, 0);
  
      const digitoCalculado = (10 - (suma % 10)) % 10;
      return digitoCalculado === digitoVerificador;
    }
  
    defaultMessage(args: ValidationArguments) {
      return 'La cédula no es válida.';
    }
  }
  
  export function IsCedulaEcuatoriana(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
      registerDecorator({
        target: object.constructor,
        propertyName: propertyName,
        options: validationOptions,
        constraints: [],
        validator: CedulaEcuatorianaConstraint,
      });
    };
  }
  