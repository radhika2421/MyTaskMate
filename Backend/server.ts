import express from "express";
import session from "express-session";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import passport from "./auth/auth.ts";
import userRoutes from "./routes/userRoutes.ts";
import calendarRoutes from "./routes/calenderRoutes.ts";
import aiRoutes from "./routes/aiprodRoutes.ts";
import taskRoutes from "./routes/taskRoutes.ts";
import habitRoutes from "./routes/habitRoutes.ts";
import goalRoutes from "./routes/goalRoutes.ts";
import { optionalJwt } from "./middleware/optionalJwt.ts";
import User from "./schema/User.ts";
import focusSessionRoutes from "./routes/focusSessionRoutes.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";

dotenv.config();
const app=express();
const PORT=process.env.PORT || 5000;
const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:5173";

app.use(express.json());
if (process.env.NODE_ENV !== "production") {
    app.use(cors({ origin: frontendUrl, credentials: true }));
} else {
    app.set("trust proxy", 1);
}

// Express Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'ai-productivity-companion-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 3600 * 1000,
    },
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(optionalJwt);

app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/api/auth", userRoutes);
app.use("/api/calendar", calendarRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/focus-sessions", focusSessionRoutes);

if (process.env.NODE_ENV === "production") {
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const frontendDist = path.resolve(currentDir, "../Frontend/dist");
    app.use(express.static(frontendDist));
    app.use((req, res, next) => {
        if (req.method === "GET" && req.accepts("html")) {
            return res.sendFile(path.join(frontendDist, "index.html"));
        }
        next();
    });
}

const connectDatabase = async () => {
    if (!process.env.MONGODB_URI) {
        console.warn("MONGODB_URI is not set. Google auth user persistence will not work.");
        return;
    }

    await mongoose.connect(process.env.MONGODB_URI);
    await User.syncIndexes();
    console.log("MongoDB connected");
};

connectDatabase().catch((error) => {
    console.error("MongoDB connection failed:", error);
});

app.listen(PORT,()=>{
    console.log(`App running live at http://localhost:${PORT}`)
})
