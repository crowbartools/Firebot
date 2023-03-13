import { mdiAccountGroup, mdiAccountTag, mdiCash, mdiCog, mdiDiceMultiple, mdiExclamationThick, mdiFormatListText, mdiFormatQuoteClose, mdiGavel, mdiGift, mdiKeyboard, mdiSquareEditOutline, mdiTallyMark5, mdiTimer, mdiTrayFull, mdiViewDashboard } from "@mdi/js";

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
            title: "Time-Based",
            route: "/time-based",
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
        {
            icon: mdiTallyMark5,
            iconClassName: "",
            title: "Counters",
            route: "/counters",
        },
        {
            icon: mdiGift,
            iconClassName: "",
            title: "Channel Rewards",
            route: "/channel-rewards",
        },
        {
            icon: mdiTrayFull,
            iconClassName: "",
            title: "Queues",
            route: "/queues",
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
        {
            icon: mdiFormatQuoteClose,
            iconClassName: "",
            title: "Quotes",
            route: "/quotes",
        },
    ],
    Management: [
        {
            icon: mdiGavel,
            iconClassName: "",
            title: "Moderation",
            route: "/moderation"
        },
        {
            icon: mdiAccountGroup,
            iconClassName: "",
            title: "Viewers",
            route: "/viewers"
        },
        {
            icon: mdiAccountTag,
            iconClassName: "",
            title: "Viewer Roles",
            route: "/viewer-roles"
        },
        {
            icon: mdiCog,
            iconClassName: "",
            title: "Settings",
            route: "/settings",
        },
    ],
};