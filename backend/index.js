import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import { createSupabaseClientFromEnv } from './supabase.js';
import helloWorldRouter from './routers/helloWorld.js';
import supabaseExampleRouter from './routers/supabaseExample.js';

dotenv.config({ path: path.resolve(path.dirname(new URL(import.meta.url).pathname), '.env') });

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

createSupabaseClientFromEnv()
  .then((client) => {
    if (!client) {
      console.warn('Supabase not configured. Set SUPABASE_URL and a key (SERVICE or ANON).');
      return;
    }
    app.locals.supabase = client;
  })
  .catch((err) => {
    console.error('Failed to initialize Supabase client:', err && err.message ? err.message : err);
  });

app.use(express.json());
app.use('/', helloWorldRouter);
app.use('/supabase-example', supabaseExampleRouter);

// Simple config status endpoint
app.get('/supabase/health', (req, res) => {
  const configured = Boolean(app.locals.supabase);
  res.json({ configured });
});


app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(port, () => {
  console.log(`Express server listening on http://localhost:${port}`);
});


