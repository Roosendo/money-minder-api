import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { createHash } from "crypto";
import { Reflector } from "@nestjs/core";
import { fromNodeHeaders } from "better-auth/node";
import { IS_PUBLIC_KEY } from "@/common/decorators/public.decorator";
import { PrismaService } from "@/prisma.service";
import { getBetterAuthInstance } from "./auth";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7).trim();
    }

    // 1. Try resolving via Better Auth session API
    try {
      const auth = getBetterAuthInstance();
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      });

      if (session && session.user) {
        let dbUser = await this.prisma.users.findUnique({
          where: { email: session.user.email },
        });

        if (!dbUser) {
          dbUser = await this.prisma.users.create({
            data: {
              email: session.user.email,
              name: session.user.name || session.user.email.split("@")[0],
              avatar_url: session.user.image,
            },
          });
        }

        request.user = dbUser;
        request.session = session.session;
        return true;
      }
    } catch {
      // Better auth session lookup failed or threw, fall through to direct token check
    }

    // 2. Fall back to the application sessions table. The table stores a hash of
    // the bearer token, so hash the presented token before comparing it.
    if (token) {
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const sessionRecord = await this.prisma.sessions.findFirst({
        where: {
          token_hash: tokenHash,
          expires_at: { gt: new Date() },
        },
        include: {
          users: true,
        },
      });

      if (sessionRecord && sessionRecord.users) {
        request.user = sessionRecord.users;
        request.session = sessionRecord;
        return true;
      }
    }

    throw new UnauthorizedException("Unauthorized: Valid session or Bearer token required");
  }
}
