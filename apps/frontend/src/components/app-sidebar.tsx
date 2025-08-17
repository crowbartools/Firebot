"use client";

import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import Image from "next/image";
import firebotLogo from "assets/images/firebot-logo.png";

import { ConnectionButton } from "./side-nav/ConnectionButton";
import { menuItems } from "./side-nav/nav-menu-items";
import { useRouter } from "next/router";
import { NavUser } from "./nav-user";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex w-full items-center gap-3 rounded-lg px-1 py-0 text-left text-base/6 font-medium text-foreground">
          <Image src={firebotLogo} alt="Firebot Logo" className="w-7" />
          <h2>Firebot</h2>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {Object.entries(menuItems).map(([header, items], index) => (
          <SidebarGroup key={index}>
            {!!header?.length && (
              <SidebarGroupLabel>{header}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={
                        item.route === "/"
                          ? router.asPath === "/"
                          : router.asPath?.startsWith(item.route)
                      }
                    >
                      <a href={item.route}>
                        {item.icon != null && item.icon}
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <NavUser />
        <ConnectionButton />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
