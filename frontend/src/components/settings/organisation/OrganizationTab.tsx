import { OrganizationInfoCard } from "./OrganizationInfoCard.js";
import { AccountsCard } from "./AccountsCard.js";
import { CostCentersCard } from "./CostCentersCard.js";

export function OrganizationTab() {
  return (
    <>
      <OrganizationInfoCard />
      <AccountsCard />
      <CostCentersCard />
    </>
  );
}
