import { mdiCash, mdiCog, mdiDiceMultiple, mdiExclamationThick, mdiFormatListText, mdiKeyboard, mdiSquareEditOutline, mdiTimer, mdiViewDashboard } from "@mdi/js";

export interface MenuItem {
    className?: string;
    disabled?: boolean;
    icon: string;
    iconClassName: string;
    title: string;
    route: string;
}

export const menuItems: Record<string, MenuItem[]> = {
    [""]: [
        {
            icon: mdiViewDashboard,
            iconClassName: "",
            title: "Dashboard",
            route: "/"
        },
    ],
    Automation: [
        {
            icon: mdiExclamationThick,
            iconClassName: "",
            title: "Commands",
            route: "/commands",
        },
        {
            icon: mdiFormatListText,
            iconClassName: "",
            title: "Events",
            route: "/events",
        },
        {
            icon: mdiTimer,
            iconClassName: "",
            title: "Timers",
            route: "/timer",
        },
        {
            icon: mdiSquareEditOutline,
            iconClassName: "",
            title: "Preset Actions",
            route: "/preset-actions",
        },
        {
            icon: mdiKeyboard,
            iconClassName: "",
            title: "Hotkeys",
            route: "/hotkeys",
        },
    ],
    Engagement: [
        {
            icon: mdiDiceMultiple,
            iconClassName: "",
            title: "Games",
            route: "/games",
        },
        {
            icon: mdiCash,
            iconClassName: "",
            title: "Currency",
            route: "/currency",
        },
    ],
    Management: [
        {
            icon: mdiCog,
            iconClassName: "",
            title: "Settings",
            route: "/settings",
        },
    ],
};