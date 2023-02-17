import { SelectItem, SelectMenu } from "@/components/SelectMenu";
import { useStores } from "@/stores";
import { FirebotTheme } from "@/stores/settings-store";
import { observer } from "mobx-react-lite";

const themes: SelectItem<FirebotTheme>[] = [
    { name: "Shadow", value: "shadow"},
    { name: "Slate", value: "slate"},
    { name: "Snow", value: "snow"},
]

export const SettingsPage: React.FC = observer(() => {
    const { settingsStore } = useStores();
    return <div>
        <SelectMenu 
            label="Theme"
            items={themes} 
            selected={settingsStore.theme} 
            setSelected={settingsStore.setTheme} 
        />
    </div>
})

export default SettingsPage;