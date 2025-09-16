const express = require('express');

const router = express.Router();

function getSupabase(req) {
  return req.app.locals.supabase || null;
}

// GET /supabase-example -> list all rows from public.database_test
router.get('/', async (req, res) => {
  const supabase = getSupabase(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const { data, error } = await supabase
    .from('database_test')
    .select('*')
    .order('id', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// POST /supabase-example -> insert a new row { name }
router.post('/', async (req, res) => {
  const supabase = getSupabase(req);
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  const nameRaw = req.body && typeof req.body.name === 'string' ? req.body.name : null;
  const name = nameRaw ? nameRaw.trim() : null;

  if (!name || name.length === 0 || name.length > 256) {
    return res.status(400).json({ error: 'Invalid name. Provide 1-256 characters.' });
  }

  const { data, error } = await supabase
    .from('database_test')
    .insert([{ name }])
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ data });
});

module.exports = router;


