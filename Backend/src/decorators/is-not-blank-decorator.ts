import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsNotBlank(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsNotBlank',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: any) {
                    if (typeof value !== 'string') return false;
                    // Aplicar trim antes de la validación
                    const valueTrim = value.trim();
                    if (valueTrim === '') return false;
                    return true;
                },
            },
        });
    };
}
