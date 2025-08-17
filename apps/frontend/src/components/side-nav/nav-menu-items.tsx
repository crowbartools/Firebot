import {
  ClipboardList,
  Coins,
  Copy,
  Dices,
  Flame,
  Gift,
  LayoutDashboard,
  ListOrdered,
  Megaphone,
  MessageCircleWarning,
  Quote,
  Settings,
  SlidersHorizontal,
  Tags,
  Timer,
  UsersRound,
} from "lucide-react";

export interface MenuItem {
  className?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  route: string;
}

export const menuItems: Record<string, MenuItem[]> = {
  [""]: [
    {
      icon: <LayoutDashboard data-slot="icon" />,
      iconClassName: "",
      title: "Dashboard",
      route: "/",
    },
  ],
  Automation: [
    {
      icon: <MessageCircleWarning data-slot="icon" />,
      iconClassName: "",
      title: "Commands",
      route: "/commands",
    },
    {
      icon: <Copy data-slot="icon" />,
      iconClassName: "",
      title: "Events",
      route: "/events",
    },
    {
      icon: <Timer data-slot="icon" />,
      iconClassName: "",
      title: "Time-Based",
      route: "/time-based",
    },
    {
      icon: <ClipboardList data-slot="icon" />,
      iconClassName: "",
      title: "Preset Actions",
      route: "/preset-actions",
    },
    {
      icon: <Flame data-slot="icon" />,
      iconClassName: "",
      title: "Hotkeys",
      route: "/hotkeys",
    },
    {
      icon: <SlidersHorizontal data-slot="icon" />,
      iconClassName: "",
      title: "Counters",
      route: "/counters",
    },
    {
      icon: <Gift data-slot="icon" />,
      iconClassName: "",
      title: "Channel Rewards",
      route: "/channel-rewards",
    },
    {
      icon: <ListOrdered data-slot="icon" />,
      iconClassName: "",
      title: "Queues",
      route: "/queues",
    },
  ],
  Engagement: [
    {
      icon: <Dices data-slot="icon" />,
      iconClassName: "",
      title: "Games",
      route: "/games",
    },
    {
      icon: <Coins data-slot="icon" />,
      iconClassName: "",
      title: "Currency",
      route: "/currency",
    },
    {
      icon: <Quote data-slot="icon" />,
      iconClassName: "",
      title: "Quotes",
      route: "/quotes",
    },
  ],
  Management: [
    {
      icon: <Megaphone data-slot="icon" />,
      iconClassName: "",
      title: "Moderation",
      route: "/moderation",
    },
    {
      icon: <UsersRound data-slot="icon" />,
      iconClassName: "",
      title: "Viewers",
      route: "/viewers",
    },
    {
      icon: <Tags data-slot="icon" />,
      iconClassName: "",
      title: "Viewer Roles",
      route: "/viewer-roles",
    },
    {
      icon: <Settings data-slot="icon" />,
      iconClassName: "",
      title: "Settings",
      route: "/settings",
    },
  ],
};
