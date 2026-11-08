import { All, Controller, Get, Req, Res } from "@nestjs/common";
import { isAPIError } from "better-auth/api";
import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import type { Request, Response } from "express";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Public } from "@/common/decorators/public.decorator";
import type { users } from "@prisma/client";
import { getBetterAuthInstance } from "./auth";
import { AuthService } from "./auth.service";

type OAuthProvider = "google" | "github";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get("me")
  async getMe(@CurrentUser() user: users) {
    return this.authService.getProfile(user.id);
  }

  @Public()
  @Get("google")
  async google(@Req() req: Request, @Res() res: Response) {
    return this.startOAuth("google", req, res);
  }

  @Public()
  @Get("github")
  async github(@Req() req: Request, @Res() res: Response) {
    return this.startOAuth("github", req, res);
  }

  @Public()
  @All("*")
  async handleBetterAuth(@Req() req: Request, @Res() res: Response) {
    const auth = getBetterAuthInstance();
    return toNodeHandler(auth)(req, res);
  }

  /**
   * Starts the Better Auth social flow and redirects the browser to the
   * provider. Exposed as `GET /auth/:provider` so the SPA can link straight to
   * it without a cross-origin POST.
   */
  private async startOAuth(provider: OAuthProvider, req: Request, res: Response) {
    const auth = getBetterAuthInstance();
    const callbackURL =
      typeof req.query.callbackURL === "string"
        ? req.query.callbackURL
        : process.env.FRONTEND_URL || "http://localhost:4200/login";

    // `signInSocial` runs server-side here, so Better Auth's origin middleware
    // does not see the original request. Validate the callback explicitly to
    // avoid turning this endpoint into an open redirect.
    const context = await auth.$context;
    if (!context.isTrustedOrigin(callbackURL, { allowRelativePaths: true })) {
      res.status(403).json({ message: "Invalid callback URL" });
      return;
    }

    try {
      const { headers, response } = await auth.api.signInSocial({
        body: { provider, callbackURL },
        headers: fromNodeHeaders(req.headers),
        returnHeaders: true,
      });

      // `signInSocial` persists the OAuth state in a signed cookie. Because it
      // is invoked directly (not through `toNodeHandler`), the cookie is only
      // available on the returned headers and must be forwarded manually.
      // Without it the provider callback fails with `state_mismatch`.
      const cookies = headers.getSetCookie?.() ?? [];
      if (cookies.length > 0) {
        res.setHeader("set-cookie", cookies);
      }

      if (!response?.url) {
        res.status(502).json({ message: "The OAuth provider did not return a redirect URL" });
        return;
      }

      res.redirect(response.url);
    } catch (error) {
      if (isAPIError(error)) {
        res.status(error.statusCode).json({ message: error.body?.message ?? error.message });
        return;
      }
      res.status(500).json({ message: "Unable to start the OAuth flow" });
    }
  }
}
