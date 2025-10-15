import { Router } from 'express';

const router = Router();

router.post('/add-salary', async (req, res) => {
    const supabase = getSupabase(req);
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
        .from('Personal Förening X')
        .select('*')
        .eq('id', req.body.id);

}
);
