import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import { createSupabaseClientFromEnv } from "./supabase.js";
import helloWorldRouter from "./routers/helloWorld.js";
import supabaseExampleRouter from "./routers/supabaseExample.js";
import orgDataRouter from "./routers/orgData.js";
import settingsRouter from "./routers/settings.js";
import fortnoxEmployeesRouter from "./routers/fortnoxEmployees.js";
import fortnoxAuthRouter from "./routers/fortnoxAuth.js";
import cors from "cors";
import session from 'express-session';

dotenv.config();
dotenv.config({
  path: path.resolve(path.dirname(new URL(import.meta.url).pathname), ".env"),
});

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
// Sessions (required for session-only Fortnox auth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax',
    maxAge: 8 * 60 * 60 * 1000,
  },
}));

createSupabaseClientFromEnv()
  .then((client) => {
    if (!client) {
      console.warn(
        "Supabase not configured. Set SUPABASE_URL and a key (SERVICE or ANON)."
      );
      return;
    }
    app.locals.supabase = client;
  })
  .catch((err) => {
    console.error(
      "Failed to initialize Supabase client:",
      err && err.message ? err.message : err
    );
  });

// TODO REMOVE IN PRODUCTION
app.use(
  cors({
    origin: "http://localhost:5173", // allow frontend to access the backend
    credentials: true,
  })
);

app.use(express.json());

app.use("/", helloWorldRouter);
app.use("/supabase-example", supabaseExampleRouter);
app.use("/api", orgDataRouter);
app.use("/api", settingsRouter);
app.use("/fortnox-employees", fortnoxEmployeesRouter);
app.use("/fortnox-auth", fortnoxAuthRouter);

// Simple config status endpoint
app.get("/supabase/health", (req, res) => {
  const configured = Boolean(app.locals.supabase);
  res.json({ configured });
});

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
