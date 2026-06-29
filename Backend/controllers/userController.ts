import type { Request, Response } from "express";
import User from "../schema/User.ts";

const avatarPresets = new Set(["preset:focus", "preset:bloom", "preset:spark", "preset:calm", "preset:vision", "preset:momentum"]);

export const getCurrentUser = (req: Request, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ user: null });
    }

    return res.json({
        user: {
            _id: String(req.user._id || req.user.id),
            email: req.user.email,
            displayName: req.user.displayName,
            avatar: req.user.avatar,
            emailVerified: req.user.emailVerified,
        },
    });
};

export const updateProfile = async (req: Request, res: Response) => {
    if (!req.user) return res.status(401).json({ message: "Please sign in to continue." });
    const displayName = String(req.body.displayName || "").trim();
    const avatar = String(req.body.avatar || "").trim();
    if (displayName.length < 2 || displayName.length > 80) {
        return res.status(400).json({ message: "Name must contain between 2 and 80 characters." });
    }
    if (avatar && !avatarPresets.has(avatar) && !avatar.startsWith("https://") && !avatar.startsWith("/avatars/")) {
        return res.status(400).json({ message: "Choose one of the available avatars." });
    }

    try {
        const user = await User.findByIdAndUpdate(
            String(req.user._id || req.user.id),
            { displayName, avatar: avatar || undefined },
            { returnDocument: 'after', runValidators: true }
        );
        if (!user) return res.status(404).json({ message: "User not found." });
        return res.json({
            user: {
                _id: user.id,
                email: user.email,
                displayName: user.displayName,
                avatar: user.avatar,
                emailVerified: user.emailVerified,
            },
        });
    } catch (error) {
        console.error("Unable to update profile:", error);
        return res.status(500).json({ message: "Unable to update profile." });
    }
};

export const logoutUser = (req: Request, res: Response) => {
    req.logout((error) => {
        if (error) {
            return res.status(500).json({ message: "Unable to log out." });
        }

        req.session.destroy((sessionError) => {
            if (sessionError) {
                return res.status(500).json({ message: "Unable to clear session." });
            }

            res.clearCookie("connect.sid");
            res.clearCookie("auth_token");
            return res.json({ message: "Logged out successfully." });
        });
    });
};
