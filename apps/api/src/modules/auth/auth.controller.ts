import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { LoginSchema, RegisterSchema, SignupSchema } from "@ca-saas/shared-types";

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = LoginSchema.parse(req.body);
      const { auth, refreshToken } = await AuthService.login(dto, req.headers["user-agent"], req.ip);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json(auth);
    } catch (err) {
      next(err);
    }
  }

  public static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = SignupSchema.parse(req.body);
      const { auth, refreshToken } = await AuthService.signup(dto, req.headers["user-agent"], req.ip);

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.status(201).json(auth);
    } catch (err) {
      next(err);
    }
  }

  public static async registerInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = RegisterSchema.parse(req.body);
      const user = await AuthService.registerInvite(dto, req.user!.id);
      return res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const result = await AuthService.refreshTokenRotation(refreshToken);

      res.cookie("refreshToken", result.newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({ accessToken: result.accessToken });
    } catch (err) {
      next(err);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      await AuthService.logout(refreshToken, req.user?.id || "");
      res.clearCookie("refreshToken");
      return res.json({ message: "Logged out successfully" });
    } catch (err) {
      next(err);
    }
  }

  public static async getMe(req: Request, res: Response) {
    return res.json({ user: req.user });
  }
}
