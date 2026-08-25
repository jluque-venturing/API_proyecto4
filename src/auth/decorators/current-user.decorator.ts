import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserWithRefresh } from '../auth.types';

export const CurrentUser = createParamDecorator(
  (campo: keyof AuthUserWithRefresh | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{
      user: AuthUserWithRefresh;
    }>();
    return campo ? request.user[campo] : request.user;
  },
);
