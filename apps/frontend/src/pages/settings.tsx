import { SelectItem, SelectMenu } from "@/components/SelectMenu";
import useAppStore, { FirebotTheme } from "@/stores/app-store";

const themes: SelectItem<FirebotTheme>[] = [
  { name: "Shadow", value: "shadow" },
  { name: "Slate", value: "slate" },
  { name: "Storm", value: "storm" },
  { name: "Snow", value: "snow" },
];

export function SettingsPage() {
  const theme = useAppStore((state) => state.theme);
  const setTheme = useAppStore((state) => state.setTheme);
  return (
    <div className="w-1/4">
      <SelectMenu
        label="Theme"
        items={themes}
        selected={theme}
        setSelected={setTheme}
      />
    </div>
  );
}

export default SettingsPage;
