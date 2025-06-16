import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// Este decorador obtiene el usuario del request (suponiendo que el usuario está en la request)
export const User = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.user; // El usuario autenticado estará en request.user
    },
);
