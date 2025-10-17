import { createSupabaseClientFromEnv } from '../supabase.js';

function normalizeName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

export class AdminService {
  static async supabase() {
    const client = await createSupabaseClientFromEnv();
    if (!client) throw new Error('Database connection failed');
    return client;
  }

  // Create organization: registry row + per-org tables via RPC
  static async createOrganization(orgName) {
    if (!orgName || !orgName.trim()) throw new Error('Organization name required');
    const supabase = await this.supabase();
    const org = normalizeName(orgName);

    // 1) Insert into organizations table (new registry)
    const { error: orgErr } = await supabase
      .from('organizations')
      .upsert({ name: orgName, slug: org }, { onConflict: 'slug' });
    if (orgErr) {
      // If organizations table is missing, continue with settings-only registry
      console.warn('organizations upsert failed (falling back to organization_settings):', orgErr.message);
    }

    // 2) Ensure a settings row exists (optional but convenient)
    const { error: upsertErr } = await supabase
      .from('organization_settings')
      .upsert({ organization: org, settings_data: {} }, { onConflict: 'organization' });
    if (upsertErr) {
      console.warn('organization_settings upsert failed:', upsertErr.message);
      // do not throw; settings can be created on first save
    }

    // 3) create per-org tables (uses defaults from SQL helpers)
    const { error: rpcErr } = await supabase.rpc('create_org_all_defaults', { org_name: org });
    if (rpcErr) throw new Error(`Failed to create organization tables: ${rpcErr.message}`);

    return { organization: org };
  }

  // Assign user as org_admin for given org: merge into app_metadata.organizations + set role if lower
  static async assignOrgAdminByEmail(email, orgName) {
    if (!email) throw new Error('Email is required');
    if (!orgName) throw new Error('Organization name is required');
    const supabase = await this.supabase();
    const org = normalizeName(orgName);

    // Find user by email using admin list (simple approach; could use filters when available)
    const { data, error: listErr } = await supabase.auth.admin.listUsers();
    if (listErr) throw new Error(`Failed to list users: ${listErr.message}`);
    const target = data.users.find(u => (u.email || '').toLowerCase() === email.toLowerCase());
    if (!target) throw new Error('User not found');

    const appMeta = target.app_metadata || {};
    const usrMeta = target.user_metadata || {};
    const currentRole = appMeta.role || usrMeta.role || 'user';
    let orgs = appMeta.organizations || usrMeta.organizations || [];
    if (!Array.isArray(orgs)) orgs = orgs ? [String(orgs)] : [];
    if (!orgs.includes(org)) orgs.push(org);

    const newRole = currentRole === 'global_admin' ? 'global_admin' : 'org_admin';

    const { error: updErr } = await supabase.auth.admin.updateUserById(target.id, {
      app_metadata: {
        role: newRole,
        organizations: orgs
      }
    });
    if (updErr) throw new Error(`Failed to update user: ${updErr.message}`);
    return { id: target.id, email: target.email, role: newRole, organizations: orgs };
  }
}
