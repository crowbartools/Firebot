import * as React from "react";
import { useState } from "react";
import clsx from "clsx";
import { motion, Variants } from "framer-motion";
import Image from 'next/image'
import firebotLogo from "assets/images/firebot-logo.png";
import Icon from "@mdi/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { thunk } from "@/utils";
import { menuItems, MenuItem } from "./nav-menu-items";
import { useToggleAllConnections } from "@/hooks/api/use-toggle-all-connections";
import { useConnectables } from "@/hooks/api/use-connectables";
import { ConnectionType } from "firebot-types";
import { useRealTimeEvent } from "@/hooks/api/use-realtime-event";
import { ArrowPathIcon, PowerIcon } from "@heroicons/react/20/solid";

const variantType = {
  hidden: "hidden",
  visible: "visible",
};

const menuBackdropVariants: Variants = {
  [variantType.hidden]: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
  [variantType.visible]: { opacity: 0.33 },
};

export const SideNav = () => {
  const [isOpen, toggleIsOpen] = useState(false);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-20 pointer-events-none bg-black"
        initial={variantType.hidden}
        variants={menuBackdropVariants}
        animate={isOpen ? variantType.visible : variantType.hidden}
      />
      <motion.aside
        className={clsx(
          "fixed top-0 bottom-0 z-30 rounded-r-xl overflow-hidden py-3 pl-3"
        )}
        style={{ width: "85px" }}
        whileHover={{ width: 300 }}
        transition={{
          type: "spring",
          duration: 0.4,
          bounce: !isOpen ? 0.1 : 0.3,
        }}
        onHoverStart={thunk(toggleIsOpen, [true])}
        onHoverEnd={thunk(toggleIsOpen, [false])}
      >
        <div className="flex flex-col h-full bg-secondary-bg rounded-3xl">
          {SidebarHeader(isOpen)}
          <ul
            className={clsx(
              "h-full overflow-x-hidden pb-4 scrollbar-thin scrollbar-thumb-black/20 scrollbar-track-transparent",
              isOpen ? "overflow-y-auto" : "overflow-y-hidden"
            )}
          >
            {Object.keys(menuItems).map((category) => (
              <div key={category}>
                {!!category?.length && CategoryHeader(category, isOpen)}
                {menuItems[category].map((item, index) => (
                  <MenuItem
                    index={index}
                    menuItem={item}
                    isOpen={isOpen}
                    key={item.route}
                  />
                ))}
              </div>
            ))}
          </ul>
          {SidebarFooter(isOpen)}
        </div>
      </motion.aside>
    </>
  );
};

const menuItemTitleVariants: Variants = {
  [variantType.hidden]: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
    // y: 10,
  },
  [variantType.visible]: (index: number) => ({
    opacity: 1,
    transition: {
      delay: 0.05,
      //   delay: index * 0.05,
    },
    // y: 0,
  }),
};

interface MenuItemProps {
  isOpen: boolean;
  menuItem: MenuItem;
  index: number;
}

const MenuItem: React.FC<MenuItemProps> = ({ index, isOpen, menuItem }) => {
  const router = useRouter();
  const isActive = router.asPath === menuItem.route;

  return (
    <li key={menuItem.route} className={clsx("mb-1.5 px-2")}>
      <Link
        href={menuItem.route}
        className={clsx("focus:outline-none", {
          "pointer-events-none": menuItem.disabled,
        })}
      >
        <motion.div
          whileTap={!isActive ? { scale: 0.95 } : undefined}
          className={clsx(
            {
              "bg-secondary-bg rounded-xl": isActive,
              "hover:bg-secondary-bg hover:bg-opacity-75 rounded-xl": !isActive,
            },
            "transition duration-150 ease-in-out",
            "flex items-center h-14 relative",
            menuItem.className
          )}
        >
          <div
            className={clsx("w-24 pl-4 flex items-center text-xl", {
              "text-primary-text text-opacity-75": !isActive,
              "text-firebot-sunglow": isActive,
            })}
          >
            <Icon
              path={menuItem.icon}
              title={menuItem.title}
              size={1}
              horizontal
              vertical
              rotate={180}
            />
          </div>
          <motion.div
            custom={index}
            variants={menuItemTitleVariants}
            animate={isOpen ? variantType.visible : variantType.hidden}
            className={clsx(
              "absolute inset-0 ml-16 w-64 flex items-center uppercase font-thin font-base"
            )}
          >
            <span
              className={clsx(
                {
                  "text-primary-text": !menuItem.disabled,
                  "font-semibold": isActive,
                },
                "capitalize"
              )}
            >
              {menuItem.title}
            </span>
          </motion.div>
        </motion.div>
      </Link>
    </li>
  );
};

const categoryHeaderVariants: Variants = {
  [variantType.hidden]: {
    opacity: 0,
    transition: {
      duration: 0.1,
    },
  },
  [variantType.visible]: {
    opacity: 1,
  },
};

const CategoryHeader = (category: string, isOpen: boolean) => (
  <li className="relative">
    <motion.div
      variants={categoryHeaderVariants}
      animate={isOpen ? variantType.visible : variantType.hidden}
      className={clsx("ml-4 mb-1 mt-2 text text-primary-text/50 uppercase")}
    >
      {category}
    </motion.div>
    <motion.div
      variants={categoryHeaderVariants}
      animate={isOpen ? variantType.hidden : variantType.visible}
      className="h-0.5 w-[75%] bg-tertiary-bg absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 rounded-md"
    ></motion.div>
  </li>
);

const headerVariants: Variants = {
  [variantType.hidden]: {
    opacity: 0,
    x: -15,
  },
  [variantType.visible]: {
    opacity: 1,
    x: 0,
  },
};

const SidebarHeader = (isOpen: boolean) => (
  <div
    className={clsx(
      "flex items-center h-16 relative flex-shrink-0 border-b border-tertiary-bg"
    )}
  >
    <div className="w-24 pl-5 flex items-center">
      {<Image src={firebotLogo} alt="Firebot sLogo" className="w-8" />}
    </div>
    <motion.div
      variants={headerVariants}
      animate={isOpen ? variantType.visible : variantType.hidden}
      className={clsx("absolute inset-0 ml-24 w-64 flex items-center")}
    >
      <span
        className="bg-firebot-sunglow bg-gradient-to-br from-firebot-sunglow to-amber-400 text-2xl font-bold bg-clip-text"
        style={{
          WebkitTextFillColor: "transparent",
        }}
      >
        Firebot
      </span>
    </motion.div>
  </div>
);

const SidebarFooter = (isOpen: boolean) => {
  const { mutate: toggleConnection, isPending: isConnecting } =
    useToggleAllConnections();
  const { data: allConnectables } = useConnectables();

  const [connectedConnectables, setConnectedConnectables] = useState<
    Record<ConnectionType, Record<string, boolean>>
  >({
    "streaming-platform": {},
    integration: {},
    overlay: {},
  });

  useRealTimeEvent<{ type: ConnectionType; id: string; connected: boolean }>(
    "connection:update",
    (data) => {
      setConnectedConnectables((prev) => ({
        ...prev,
        [data.type]: {
          ...prev[data.type],
          [data.id]: data.connected,
        },
      }));
    }
  );

  const totalCount = Object.entries(allConnectables ?? {}).reduce(
    (acc, [, connectables]) => acc + connectables.length,
    0
  );

  const connectedCount = Object.entries(connectedConnectables).reduce(
    (acc, [, connectables]) => {
      return (
        acc +
        Object.values(connectables).reduce(
          (acc, connected) => acc + (connected ? 1 : 0),
          0
        )
      );
    },
    0
  );

  const allConnected = connectedCount > 0 && totalCount === connectedCount;
  const someConnected = connectedCount > 0;

  return (
    <div
      className={clsx(
        "flex items-center justify-between h-16 relative flex-shrink-0 border-t border-tertiary-bg"
      )}
    >
      <div className="w-24 pl-4 flex items-center">
        <button
          className="flex items-center justify-center bg-tertiary-bg rounded-full text-sm h-10 w-10 hover:bg-tertiary-bg"
          onClick={() => toggleConnection(someConnected ? false : true)}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ArrowPathIcon className="h-5 w-5 text-gray-200 animate-spin" />
          ) : (
            <PowerIcon
              className={clsx("h-5 w-5", {
                "text-green-400": allConnected,
                "text-amber-400": someConnected,
                "text-red-500": !someConnected && !allConnected,
              })}
            />
          )}
        </button>
      </div>
      <motion.div
        variants={headerVariants}
        animate={isOpen ? variantType.visible : variantType.hidden}
        className={clsx("absolute inset-0 ml-20 w-64 flex items-center")}
      >
        <span>
          {isConnecting
            ? someConnected
              ? "Disconnecting"
              : "Connecting"
            : someConnected
              ? "Connected"
              : "Disconnected"}
        </span>
      </motion.div>
    </div>
  );
};
