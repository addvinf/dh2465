import { OrganizationInfoCard } from "./OrganizationInfoCard.js";
import { PositionsCard } from "./PositionsCard.js";
import { AccountsCard } from "./AccountsCard.js";
import { CostCentersCard } from "./CostCentersCard.js";

export function OrganizationTab() {
  return (
    <>
      <OrganizationInfoCard />
      <PositionsCard />
      <AccountsCard />
      <CostCentersCard />
    </>
  );
}
