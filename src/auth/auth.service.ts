import { Injectable, UnauthorizedException } from "@nestjs/common";
import { fromNodeHeaders } from "better-auth/node";
import type { Request } from "express";
import { PrismaService } from "@/prisma.service";
import { getBetterAuthInstance } from "./auth";

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async getSession(req: Request) {
    const auth = getBetterAuthInstance();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      throw new UnauthorizedException("Session not found or expired");
    }

    return session;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId },
      include: {
        oauth_accounts: {
          select: {
            provider: true,
            provider_user_id: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User profile not found");
    }

    return user;
  }
}
