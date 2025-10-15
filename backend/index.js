import path from "node:path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import session from 'express-session';
import cookieParser from 'cookie-parser';

// Application imports
import { createSupabaseClientFromEnv } from "./supabase.js";
import helloWorldRouter from "./routers/helloWorld.js";
import supabaseExampleRouter from "./routers/supabaseExample.js";
import orgDataRouter from "./routers/orgData.js";
import settingsRouter from "./routers/settings.js";
import fortnoxEmployeesRouter from "./routers/fortnoxEmployees.js";
import fortnoxAuthRouter from "./routers/fortnoxAuth.js";
import authRouter from "./routers/auth.js";
import { authenticateToken, requireRole } from "./middleware/auth.js";

// Security and configuration imports
import { 
  securityHeaders, 
  httpsEnforcement, 
  corsOptions, 
  errorHandler, 
  notFoundHandler 
} from "./middleware/security.js";

// Load environment variables
dotenv.config();
dotenv.config({
  path: path.resolve(path.dirname(new URL(import.meta.url).pathname), ".env"),
});

// Simple environment check
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Express application
const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// Apply security middleware
app.use(securityHeaders);
app.use(httpsEnforcement);

// Configure sessions
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  }
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

// Configure CORS
app.use(cors(corsOptions));

// Parse cookies
app.use(cookieParser());

app.use(express.json());

// Public routes
app.use("/", helloWorldRouter);
app.use("/auth", authRouter);

// Fortnox auth routes - require authentication and admin role
app.use("/fortnox-auth", authenticateToken, requireRole(['admin']), fortnoxAuthRouter);

// Protected routes - require authentication and admin role
app.use("/supabase-example", authenticateToken, requireRole(['admin']), supabaseExampleRouter);
app.use("/api", authenticateToken, requireRole(['admin']), orgDataRouter);
app.use("/api", authenticateToken, requireRole(['admin']), settingsRouter);
app.use("/fortnox-employees", authenticateToken, requireRole(['admin']), fortnoxEmployeesRouter);

// Simple config status endpoint
app.get("/supabase/health", (req, res) => {
  const configured = Boolean(app.locals.supabase);
  res.json({ configured });
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});
