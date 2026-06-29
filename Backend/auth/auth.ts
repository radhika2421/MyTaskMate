import passport from "passport";
import {Strategy as GoogleStrategy, Profile} from "passport-google-oauth20";
import { Strategy as JwtStrategy } from "passport-jwt";
import type { Request } from "express";
import User from "../schema/User.ts";
import dotenv from "dotenv"

dotenv.config();

const getCallbackUrl = () => {
    if (process.env.GOOGLE_CALLBACK_URL) {
        return process.env.GOOGLE_CALLBACK_URL;
    }

    const port = process.env.PORT || 5000;
    return `http://localhost:${port}/api/auth/google/callback`;
};

passport.serializeUser((user: Express.User, done) => {
    done(null, (user as { id: string }).id);
});

passport.deserializeUser(async (id: string, done) => {
    try {
        const user = await User.findById(id).lean();
        done(null, user as Express.User);
    } catch (error) {
        done(error);
    }
});

const cookieJwtExtractor = (req: Request) => {
    const tokenCookie = req.headers.cookie
        ?.split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith("auth_token="));
    return tokenCookie ? decodeURIComponent(tokenCookie.slice("auth_token=".length)) : null;
};

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: cookieJwtExtractor,
            secretOrKey: process.env.JWT_SECRET || process.env.SESSION_SECRET || "development-jwt-secret",
        },
        async (payload: { sub?: string; av?: number }, done) => {
            try {
                if (!payload.sub) return done(null, false);
                const user = await User.findById(payload.sub).select("+authVersion").lean();
                if (user && Number(payload.av ?? 0) !== Number(user.authVersion ?? 0)) {
                    return done(null, false);
                }
                if (!user) return done(null, false);
                const { authVersion: _authVersion, ...authenticatedUser } = user;
                return done(null, authenticatedUser);
            } catch (error) {
                return done(error, false);
            }
        }
    )
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            callbackURL: getCallbackUrl(),
            passReqToCallback: true,
        },
        async (req: Request, accessToken: string, refreshToken: string, profile: Profile, done) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(new Error("Google account did not provide an email address."));
                }

                let user = await User.findOne({ $or: [{ googleId: profile.id }, { email: email.toLowerCase() }] });
                if (user) {
                    user.googleId = profile.id;
                    user.displayName = profile.displayName || user.displayName || email;
                    user.avatar = profile.photos?.[0]?.value || user.avatar;
                    user.emailVerified = true;
                    await user.save();
                } else {
                    user = await User.create({
                        googleId: profile.id,
                        email,
                        displayName: profile.displayName || email,
                        avatar: profile.photos?.[0]?.value,
                        emailVerified: true,
                    });
                }

                (user as any).googleCalendarTokens = {
                    accessToken,
                    refreshToken,
                };

                return done(null, user);
            } catch (error) {
                return done(error as Error);
            }
        }
    )
);

export default passport;
