import { Router } from "express";
import passport from "../auth/auth.ts";
import { getCurrentUser, logoutUser, updateProfile } from "../controllers/userController.ts";
import {
    loginWithEmail,
    requestPasswordReset,
    resendEmailOtp,
    resetPassword,
    signupWithEmail,
    verifyEmailOtp,
} from "../controllers/emailAuthController.ts";
import { rateLimit } from "express-rate-limit";
import { requireAuth } from "../middleware/requireAuth.ts";

const router = Router();

const frontendUrl = process.env.NODE_ENV === "production"
    ? ""
    : process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";
const emailAuthLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post("/email/signup", emailAuthLimiter, signupWithEmail);
router.post("/email/verify-otp", emailAuthLimiter, verifyEmailOtp);
router.post("/email/resend-otp", emailAuthLimiter, resendEmailOtp);
router.post("/email/login", emailAuthLimiter, loginWithEmail);
router.post("/email/forgot-password", emailAuthLimiter, requestPasswordReset);
router.post("/email/reset-password", emailAuthLimiter, resetPassword);

router.get(
    "/google",
    passport.authenticate("google", {
        scope: [
            "profile",
            "email",
            "https://www.googleapis.com/auth/calendar.events",
        ],
        accessType: "offline",
        prompt: "consent",
    })
);
router.get("/google/callback", (req, res, next) => {
    passport.authenticate("google", (error: Error, user: any) => {
        if (error || !user) {
            return res.redirect(`${frontendUrl}/login?error=google-auth-failed`);
        }

        req.logIn(user, (loginError) => {
            if (loginError) {
                return next(loginError);
            }

            if (user.googleCalendarTokens?.accessToken) {
                (req.session as any).googleCalendarTokens = user.googleCalendarTokens;
            }

            req.session.save(() => {
                res.redirect(`${frontendUrl}/dashboard`);
            });
        });
    })(req, res, next);
});

router.get("/me", getCurrentUser);
router.patch("/profile", requireAuth, updateProfile);
router.post("/logout", logoutUser);

export default router;
