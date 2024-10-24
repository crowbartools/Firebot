import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "../ui/sidebar";
import Image from "next/image";
import firebotLogo from "assets/images/firebot-logo.png";
import { menuItems } from "./nav-menu-items";
import { useRouter } from "next/router";
import { ProfileDropdownNew } from "../header/ProfileDropdownNew";

export const NewSideNav: React.FC = () => {
  const router = useRouter();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex w-full items-center gap-3 rounded-lg px-1 py-0 text-left text-base/6 font-medium text-primary-text">
          <Image src={firebotLogo} alt="Firebot sLogo" className="w-7" />
          <SidebarLabel>Firebot</SidebarLabel>
        </div>
        {/* <SidebarItem disabled={true} className="py-0 my-0">
          

        </SidebarItem> */}
      </SidebarHeader>
      <SidebarBody>
        {Object.entries(menuItems).map(([header, items], index) => (
          <SidebarSection key={index}>
            {!!header?.length && <SidebarHeading>{header}</SidebarHeading>}
            {items.map((item) => (
              <SidebarItem
                key={item.title}
                href={item.route}
                current={router.asPath === item.route}
              >
                {item.icon}
                <SidebarLabel>{item.title}</SidebarLabel>
              </SidebarItem>
            ))}
          </SidebarSection>
        ))}
      </SidebarBody>
      <SidebarFooter className="max-lg:hidden">
        <ProfileDropdownNew />
      </SidebarFooter>
    </Sidebar>
  );
};
