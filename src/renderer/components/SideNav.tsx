import { appRoutes } from "../constants";
import * as React from "react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import { motion, Variants } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logo from "../assets/images/logo.png";
import { TemplateIcon } from "@heroicons/react/outline";

import { thunk } from "../utils";

interface MenuItem {
    className?: string;
    disabled?: boolean;
    icon: JSX.Element;
    iconClassName: string;
    title: string;
    to: keyof typeof appRoutes;
}

const menu: Record<string, MenuItem[]> = {
    Main: [
        {
            icon: <TemplateIcon className="h-6 w-6" aria-hidden="true" />,
            iconClassName: "",
            title: "Dashboard",
            to: "DASHBOARD",
        },
    ],
    Chat: [
        {
            icon: <FontAwesomeIcon icon={["fas", "exclamation"]} />,
            iconClassName: "",
            title: "Commands",
            to: "COMMANDS",
        },
        {
            icon: <FontAwesomeIcon icon={["far", "comment-alt"]} />,
            iconClassName: "",
            title: "Chat Feed",
            to: "CHAT_FEED",
        },
    ],
    Management: [
        {
            icon: <FontAwesomeIcon icon={["fas", "cog"]} />,
            iconClassName: "",
            title: "Settings",
            to: "SETTINGS",
        },
    ],
};

const variantType = {
    hidden: "hidden",
    visible: "visible",
};

const menuItemTitleVariants: Variants = {
    [variantType.hidden]: {
        opacity: 0,
        y: 10,
    },
    [variantType.visible]: (index: number) => ({
        opacity: 1,
        transition: {
            delay: index * 0.05,
        },
        y: 0,
    }),
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

const menuBackdropVariants: Variants = {
    [variantType.hidden]: { opacity: 0 },
    [variantType.visible]: { opacity: 0.25 },
};

const MenuItem = (isOpen: boolean) => (menuItem: MenuItem, index: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const location = useLocation();
    const isActive = location.pathname === appRoutes[menuItem.to];

    return (
        <li key={menuItem.to} className="px-2 mb-1">
            <NavLink
                exact={true}
                to={appRoutes[menuItem.to]}
                className={clsx("focus:outline-none", {
                    "pointer-events-none": menuItem.disabled,
                })}
            >
                <motion.div
                    whileTap={!isActive ? { scale: 0.95 } : undefined}
                    className={clsx(
                        {
                            "bg-gray-900 bg-opacity-50": isActive,
                            "hover:bg-gray-900 hover:bg-opacity-25": !isActive,
                        },
                        "rounded-lg transition duration-150 ease-in-out",
                        "flex items-center h-12 relative",
                        menuItem.className
                    )}
                >
                    <div
                        className={clsx(
                            "w-12 flex justify-center items-center text-xl",
                            {
                                "text-white text-opacity-75": !isActive,
                                "text-yellow-400": isActive,
                            }
                        )}
                    >
                        {menuItem.icon}
                    </div>
                    <motion.div
                        custom={index}
                        variants={menuItemTitleVariants}
                        animate={
                            isOpen ? variantType.visible : variantType.hidden
                        }
                        className={clsx(
                            "absolute inset-0 ml-16 w-64 flex items-center uppercase font-thin font-base"
                        )}
                    >
                        <span
                            className={clsx({
                                "text-white": !menuItem.disabled,
                                "font-semibold": isActive,
                            })}
                        >
                            {menuItem.title}
                        </span>
                    </motion.div>
                </motion.div>
            </NavLink>
        </li>
    );
};

const CategoryHeader = (category: string, isOpen: boolean) => (
    <li>
        <motion.div
            variants={categoryHeaderVariants}
            animate={isOpen ? variantType.visible : variantType.hidden}
            className={clsx(
                "ml-4 mb-1 mt-2 font-base text-gray-800 font-semibold"
            )}
        >
            {category}
        </motion.div>
    </li>
);

const SidebarHeader = (isOpen: boolean) => (
    <div
        className={clsx(
            "flex items-center h-16 relative border-b border-gray-700 mb-3"
        )}
    >
        <div className="w-24 flex justify-center items-center">
            {<img src={logo} className="w-8" />}
        </div>
        <motion.div
            variants={headerVariants}
            animate={isOpen ? variantType.visible : variantType.hidden}
            className={clsx("absolute inset-0 ml-20 w-64 flex items-center")}
        >
            <span className="text-yellow-400 text-2xl font-thin">Firebot</span>
        </motion.div>
    </div>
);

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
                className="fixed h-full z-30 bg-gray-800 overflow-hidden"
                style={{ width: "65px" }}
                whileHover={{ width: 250 }}
                onHoverStart={thunk(toggleIsOpen, [true])}
                onHoverEnd={thunk(toggleIsOpen, [false])}
            >
                {SidebarHeader(isOpen)}
                <ul className="h-full">
                    {Object.keys(menu).map((category) => (
                        <>
                            {/* {CategoryHeader(category, isOpen)} */}
                            {menu[category].map(MenuItem(isOpen))}
                        </>
                    ))}
                </ul>
            </motion.aside>
        </>
    );
};
