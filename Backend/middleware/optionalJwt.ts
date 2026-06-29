import type { NextFunction, Request, Response } from "express";
import passport from "../auth/auth.ts";

export const optionalJwt = (req: Request, res: Response, next: NextFunction) => {
    if (req.user || !req.headers.cookie?.includes("auth_token=")) return next();

    passport.authenticate("jwt", { session: false }, (error: Error | null, user: Express.User | false) => {
        if (!error && user) req.user = user;
        return next();
    })(req, res, next);
};
