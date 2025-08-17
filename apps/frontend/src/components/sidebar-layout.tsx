"use client";

import { Separator } from "@radix-ui/react-separator";
import { AppSidebar } from "./app-sidebar";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "./ui/sidebar";
import { useRouter } from "next/router";
import { menuItems } from "./side-nav/nav-menu-items";
import useAppStore from "@/stores/app-store";
import Link from "next/link";

type Props = {
  children: React.ReactNode;
};
export function NewSidebarLayout({ children }: Props) {
  const router = useRouter();

  const allMenuItems = Object.values(menuItems).flat();

  const currentPath = router.asPath ?? "";

  const currentRootPage = allMenuItems.find((item) => {
    return item.route === "/"
      ? currentPath === "/"
      : currentPath.startsWith(item.route);
  });

  const trailingBreadcrumb = useAppStore((state) => state.trailingBreadcrumb);

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              {currentRootPage && trailingBreadcrumb && (
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href={currentRootPage.route}>
                      {currentRootPage.title}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )}
              {currentRootPage && !trailingBreadcrumb && (
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentRootPage.title}</BreadcrumbPage>
                </BreadcrumbItem>
              )}
              {trailingBreadcrumb && (
                <>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{trailingBreadcrumb}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
