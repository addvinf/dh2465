require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const express = require('express');
const { createSupabaseClientFromEnv } = require('./supabase');
const helloWorldRouter = require('./routers/helloWorld');
const supabaseExampleRouter = require('./routers/supabaseExample');

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


