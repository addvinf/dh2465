const API_BASE_URL = import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000';

export interface OrgItem { name: string; slug: string }

export const adminService = {
  async listOrganizations(): Promise<{ organizations: OrgItem[] }> {
    const res = await fetch(`${API_BASE_URL}/admin/organizations`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch organizations');
    return res.json();
  },

  async createOrganization(name: string): Promise<{ organization: string }> {
    const res = await fetch(`${API_BASE_URL}/admin/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create organization');
    }
    return res.json();
  },

  async addOrgAdmin(org: string, email: string): Promise<{ user: { id: string; email: string; role: string; organizations: string[] } }> {
    const res = await fetch(`${API_BASE_URL}/admin/organizations/${encodeURIComponent(org)}/admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add org admin');
    }
    return res.json();
  },
};
