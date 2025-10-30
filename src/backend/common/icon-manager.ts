import { FontAwesomeIcon } from "../../types/icons";
import frontendCommunicator from "./frontend-communicator";

enum FontAwesomeStyle {
    Brands = "brands",
    Regular = "regular",
    Solid = "solid",
    Light = "light",
    Duotone = "duotone"
}

interface FontAwesomeIconSVG {
    last_modified: number;
    raw: string;
    viewBox: string[];
    width: number;
    height: number;
    path: string;
}

interface FontAwesomeIconDefinition {
    changes: string[];
    ligatures: string[];
    search: {
        terms: string[];
    };
    styles: FontAwesomeStyle[];
    unicode: string;
    label: string;
    voted?: boolean;
    svg: Record<keyof FontAwesomeStyle, FontAwesomeIconSVG>;
    free: FontAwesomeStyle[];
    private?: boolean;
}

type FontAwesomeIconDefinitions = {
    [iconName: string]: FontAwesomeIconDefinition;
};

const ICON_DEFINITION_URL = "https://cdn.jsdelivr.net/gh/FortAwesome/Font-Awesome@master/metadata/icons.json";

class IconManager {
    icons: FontAwesomeIcon[] = [];

    constructor() {
        frontendCommunicator.on("all-font-awesome-icons", () => this.icons);
    }

    async loadFontAwesomeIcons(): Promise<void> {
        const fontAwesomeIcons = await (await fetch(ICON_DEFINITION_URL)).json() as FontAwesomeIconDefinitions;

        for (const iconName in fontAwesomeIcons) {
            if (fontAwesomeIcons[iconName].private) {
                delete fontAwesomeIcons[iconName];
            }
        }

        this.icons = [];

        const styles = ["Solid", "Regular", "Light", "Duotone"];

        Object.entries(fontAwesomeIcons).forEach(([name, data]) => {
            if (data.free.includes(FontAwesomeStyle.Brands)) {
                this.icons.push({
                    name: `${name.replace("-", " ")}`,
                    className: `fab fa-${name}`,
                    style: "Brands",
                    searchTerms: data.search.terms
                });
            } else {
                this.icons.push(...styles.map((style) => {
                    return {
                        name: `${name.replace("-", " ")}`,
                        className: `fa${style.charAt(0).toLowerCase()} fa-${name}`,
                        style: style,
                        searchTerms: data.search.terms
                    };
                }));
            }
        });
    }
}

const iconManager = new IconManager();

export { iconManager as IconManager };