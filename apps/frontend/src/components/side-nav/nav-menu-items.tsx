import {
  AdjustmentsHorizontalIcon,
  BanknotesIcon,
  ChatBubbleBottomCenterIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  Cog6ToothIcon,
  ExclamationCircleIcon,
  FireIcon,
  GiftIcon,
  MegaphoneIcon,
  PuzzlePieceIcon,
  QueueListIcon,
  RectangleGroupIcon,
  Square2StackIcon,
  TagIcon,
  UserGroupIcon,
} from "@heroicons/react/16/solid";

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
      icon: <RectangleGroupIcon />,
      iconClassName: "",
      title: "Dashboard",
      route: "/",
    },
  ],
  Automation: [
    {
      icon: <ExclamationCircleIcon />,
      iconClassName: "",
      title: "Commands",
      route: "/commands",
    },
    {
      icon: <Square2StackIcon />,
      iconClassName: "",
      title: "Events",
      route: "/events",
    },
    {
      icon: <ClockIcon />,
      iconClassName: "",
      title: "Time-Based",
      route: "/time-based",
    },
    {
      icon: <ClipboardDocumentListIcon />,
      iconClassName: "",
      title: "Preset Actions",
      route: "/preset-actions",
    },
    {
      icon: <FireIcon />,
      iconClassName: "",
      title: "Hotkeys",
      route: "/hotkeys",
    },
    {
      icon: <AdjustmentsHorizontalIcon />,
      iconClassName: "",
      title: "Counters",
      route: "/counters",
    },
    {
      icon: <GiftIcon />,
      iconClassName: "",
      title: "Channel Rewards",
      route: "/channel-rewards",
    },
    {
      icon: <QueueListIcon />,
      iconClassName: "",
      title: "Queues",
      route: "/queues",
    },
  ],
  Engagement: [
    {
      icon: <PuzzlePieceIcon />,
      iconClassName: "",
      title: "Games",
      route: "/games",
    },
    {
      icon: <BanknotesIcon />,
      iconClassName: "",
      title: "Currency",
      route: "/currency",
    },
    {
      icon: <ChatBubbleBottomCenterIcon />,
      iconClassName: "",
      title: "Quotes",
      route: "/quotes",
    },
  ],
  Management: [
    {
      icon: <MegaphoneIcon />,
      iconClassName: "",
      title: "Moderation",
      route: "/moderation",
    },
    {
      icon: <UserGroupIcon />,
      iconClassName: "",
      title: "Viewers",
      route: "/viewers",
    },
    {
      icon: <TagIcon />,
      iconClassName: "",
      title: "Viewer Roles",
      route: "/viewer-roles",
    },
    {
      icon: <Cog6ToothIcon />,
      iconClassName: "",
      title: "Settings",
      route: "/settings",
    },
  ],
};
