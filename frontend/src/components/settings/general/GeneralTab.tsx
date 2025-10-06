import { EmployerFeesCard } from "./EmployerFeesCard.js";
import { AgeBasedFeesCard } from "./AgeBasedFeesCard.js";

export function GeneralTab() {
  return (
    <>
      <EmployerFeesCard />
      <AgeBasedFeesCard />
    </>
  );
}
