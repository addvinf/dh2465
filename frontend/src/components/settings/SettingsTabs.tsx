import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { GeneralTab } from "./general/GeneralTab.js";
import { OrganizationTab } from "./organisation/OrganizationTab.js";
import { SalaryTypesTab } from "./salary_types/SalaryTypesTab.js";
import { IntegrationTab } from "./integration/IntegrationTab.js";

export function SettingsTabs() {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-muted">
        <TabsTrigger value="general">Allmänt</TabsTrigger>
        <TabsTrigger value="organization">Organisation</TabsTrigger>
        <TabsTrigger value="salary-types">Lönearter</TabsTrigger>
        <TabsTrigger value="integration">Integrationer</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <GeneralTab />
      </TabsContent>

      <TabsContent value="organization" className="space-y-6">
        <OrganizationTab />
      </TabsContent>

      <TabsContent value="salary-types" className="space-y-6">
        <SalaryTypesTab />
      </TabsContent>

      <TabsContent value="integration" className="space-y-6">
        <IntegrationTab />
      </TabsContent>
    </Tabs>
  );
}
