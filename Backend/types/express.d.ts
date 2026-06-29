import type { IUser } from "../schema/User.ts";

declare global {
    namespace Express {
        interface User extends IUser {
            _id?: unknown;
            id?: string;
            googleCalendarTokens?: {
                accessToken: string;
                refreshToken?: string;
            };
        }
    }
}

export {};
