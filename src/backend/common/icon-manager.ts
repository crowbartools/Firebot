import frontendCommunicator from "./frontend-communicator";
import { FontAwesomeIcon } from "../../shared/types";

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
    [iconName: string]: FontAwesomeIconDefinition
}

class IconManager {
    icons: FontAwesomeIcon[] = [];

    constructor() {
        frontendCommunicator.on("all-font-awesome-icons", () => this.icons);
    }

    async loadFontAwesomeIcons(): Promise<void> {
        const fontAwesomeIcons: FontAwesomeIconDefinitions = await (await fetch("https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/metadata/icons.json")).json();

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