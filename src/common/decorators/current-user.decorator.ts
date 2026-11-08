import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { users } from "@prisma/client";

export type CurrentUserData = users;

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
