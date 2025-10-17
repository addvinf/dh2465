import express from 'express';
import { requireRole, authenticateToken } from '../middleware/auth.js';
import { AdminService } from '../services/adminService.js';

const router = express.Router();

// All routes here require global_admin
router.use(authenticateToken, requireRole(['global_admin']));

// GET /admin/organizations
router.get('/organizations', async (req, res) => {
  try {
    const supabase = req.app.locals.supabase;
    if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });
    // Prefer new organizations table
    let orgs = [];
    let { data, error } = await supabase
      .from('organizations')
      .select('name, slug')
      .order('name');
    if (error) {
      console.warn('organizations query failed, falling back:', error.message);
      // fallback to organization_settings
      const fb = await supabase
        .from('organization_settings')
        .select('organization')
        .order('organization');
      if (fb.error) return res.status(500).json({ error: fb.error.message });
      orgs = (fb.data || []).map((r) => ({ name: r.organization, slug: r.organization }));
    } else {
      orgs = (data || []).map((r) => ({ name: r.name, slug: r.slug }));
    }
    res.json({ organizations: orgs });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /admin/organizations { name }
router.post('/organizations', async (req, res) => {
  try {
    const { name } = req.body || {};
    const result = await AdminService.createOrganization(name);
    res.status(201).json({ message: 'Organization created', ...result });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

// POST /admin/organizations/:org/admins { email }
router.post('/organizations/:org/admins', async (req, res) => {
  try {
    const { email } = req.body || {};
    const { org } = req.params;
    const result = await AdminService.assignOrgAdminByEmail(email, org);
    res.status(200).json({ message: 'User assigned as org admin', user: result });
  } catch (err) {
    res.status(400).json({ error: err.message || String(err) });
  }
});

export default router;
