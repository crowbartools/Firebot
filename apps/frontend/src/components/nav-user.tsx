"use client";

import { ArrowLeftRight, ChevronsUpDown, Pencil, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useActiveProfile } from "@/hooks/api/use-active-profile";
import { useLogins } from "@/hooks/api/use-logins";
import { useStreamingPlatforms } from "@/hooks/api/use-streaming-platforms";
import { useManageProfileSlideOver } from "./header/ManageProfileSlideOver";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export function NavUser() {
  const { isMobile } = useSidebar();

  const { data: activeProfile } = useActiveProfile();
  const { data: loginData } = useLogins();
  const { data: streamingPlatforms } = useStreamingPlatforms();

  const streamingPlatformsWithLogins = streamingPlatforms.filter((sp) => {
    if (!sp.icon) return false;
    const platformLoginData = loginData?.[sp.id];
    const activeLogin = platformLoginData?.loginConfigs.find(
      (l) => l.id === platformLoginData.activeLoginConfigId
    );
    return activeLogin?.streamer != null;
  });

  const loginWithAvatarUrl = Object.values(loginData || {})
    // filter to platforms with logins
    .filter((l) => !!l.loginConfigs.length)
    // map to active streamer login config or first streamer login config
    .map(
      (l) =>
        l.loginConfigs.find((c) => c.id === l.activeLoginConfigId)?.streamer ??
        l.loginConfigs[0]?.streamer
    )
    // find first login config with streamer avatar url
    .find((c) => !!c?.avatarUrl?.length);

  const avatarUrl = loginWithAvatarUrl?.avatarUrl ?? "/profile-photo.jpg";

  const manageProfileSlideOver = useManageProfileSlideOver();

  const firstInitial = activeProfile?.name?.charAt(0).toUpperCase() || "FB";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage
                  src={avatarUrl}
                  alt={loginWithAvatarUrl?.displayName}
                />
                <AvatarFallback className="rounded-lg">
                  {firstInitial}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeProfile?.name}
                </span>
                <span className="block truncate text-xs/5 w-5 font-normal text-zinc-500 dark:text-zinc-400">
                  {streamingPlatformsWithLogins.map((platform) => (
                    <FontAwesomeIcon
                      key={platform.id}
                      className="text-xs mr-2 text-zinc-300"
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      icon={["fab", platform.icon as any]}
                    />
                  ))}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={avatarUrl}
                    alt={loginWithAvatarUrl?.displayName}
                  />
                  <AvatarFallback className="rounded-lg">
                    {firstInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {activeProfile?.name}
                  </span>
                  <span className="block truncate text-xs/5 w-5 font-normal text-zinc-500 dark:text-zinc-400">
                    {streamingPlatformsWithLogins.map((platform) => (
                      <FontAwesomeIcon
                        key={platform.id}
                        className="text-xs mr-2 text-zinc-300"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        icon={["fab", platform.icon as any]}
                      />
                    ))}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => {
                  manageProfileSlideOver.show({
                    params: {},
                  });
                }}
              >
                <Pencil />
                Edit profile
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <Users />
                Manage profiles
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <ArrowLeftRight />
                Switch profiles
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
