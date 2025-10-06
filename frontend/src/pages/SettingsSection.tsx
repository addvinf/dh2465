import { useSettings } from "../contexts/SettingsContext";
import { Header } from "../components/Header";
import {
  SettingsLoading,
  SettingsHeader,
  SettingsTabs,
} from "../components/settings";

export function SettingsSection() {
  const { loading } = useSettings();

  if (loading) {
    return <SettingsLoading />;
  }

  return (
    <>
      <Header />
      <div className="p-6 space-y-6">
        <SettingsHeader />
        <SettingsTabs />
      </div>
    </>
  );
}
