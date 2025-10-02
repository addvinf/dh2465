export function SettingsHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-3xl font-semibold text-foreground">
          Inställningar
        </h2>
        <p className="text-muted-foreground">
          Konfigurera systemets grund- och organisationsinställningar
        </p>
      </div>
    </div>
  );
}
