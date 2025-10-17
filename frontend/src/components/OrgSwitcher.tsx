import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { adminService, type OrgItem } from '../services/adminService';
import { Button } from './ui/Button';

interface OrgSwitcherProps {
  onOrgSelected?: (org: string) => void;
}

export const OrgSwitcher: React.FC<OrgSwitcherProps> = ({ onOrgSelected }) => {
  const [orgs, setOrgs] = React.useState<OrgItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminService.listOrganizations();
  setOrgs(res.organizations || []);
    } catch (e) {
      console.error('Failed to load organizations', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const addOrg = async () => {
    const name = prompt('Organization name');
    if (!name) return;
    setCreating(true);
    try {
      const res = await adminService.createOrganization(name);
      await load();
      if (onOrgSelected) onOrgSelected(res.organization);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative">
      <Button variant="ghost" className="flex items-center gap-2" onClick={() => setOpen(o => !o)}>
        Organizations
        <ChevronDown className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 min-w-[220px] rounded-lg bg-card border border-border shadow-lg z-50">
          <div className="flex items-center justify-between p-2 border-b border-border">
            <div className="text-sm font-medium">Your Organizations</div>
            <Button size="sm" variant="ghost" onClick={addOrg} disabled={creating}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-64 overflow-auto p-1">
            {loading ? (
              <div className="p-2 text-sm text-muted-foreground">Loading...</div>
            ) : orgs.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground">No organizations</div>
            ) : (
              orgs.map((org) => (
                <button
                  key={org.slug}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded"
                  onClick={() => {
                    if (onOrgSelected) onOrgSelected(org.slug);
                    setOpen(false);
                  }}
                >
                  {org.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
