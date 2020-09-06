import { appRoutes } from "../constants";
import * as React from "react";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import { motion, Variants } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import logo from "../assets/images/logo.png";

import { thunk } from "../utils";

interface MenuItem {
    className?: string;
    disabled?: boolean;
    icon: JSX.Element;
    iconClassName: string;
    title: string;
    to: keyof typeof appRoutes;
}

const menuItems: MenuItem[] = [
    {
        icon: <FontAwesomeIcon icon={["fas", "exclamation"]} />,
        iconClassName: "",
        title: "Commands",
        to: "COMMANDS",
    },
    {
        icon: <FontAwesomeIcon icon={["fas", "comment-alt"]} />,
        iconClassName: "",
        title: "Chat Feed",
        to: "CHAT_FEED",
    },
];

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
    [variantType.visible]: { opacity: 0.4 },
};

const MenuItem = (isOpen: boolean) => (menuItem: MenuItem, index: number) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const location = useLocation();
    const isActive = location.pathname === appRoutes[menuItem.to];

    return (
        <li key={menuItem.to}>
            <NavLink
                exact={true}
                to={appRoutes[menuItem.to]}
                className={clsx({
                    "pointer-events-none": menuItem.disabled,
                })}
            >
                <div
                    className={clsx(
                        "fb-nav-item relative hover:bg-dark-600 transition duration-300 ease-in-out",
                        "flex items-center h-12 relative",
                        { "bg-dark-600": isActive },
                        menuItem.className
                    )}
                >
                    <div
                        className={clsx("fb-nav-item-bar bg-gold-500 absolute h-full left-0", {
                            "w-1": isActive,
                        })}
                    />
                    <div className="w-20 h-14 flex justify-center items-center text-xl text-gold-500">
                        {menuItem.icon}
                    </div>
                    <motion.div
                        custom={index}
                        variants={menuItemTitleVariants}
                        animate={isOpen ? variantType.visible : variantType.hidden}
                        className={clsx("absolute inset-0 ml-20 w-64 flex items-center")}
                    >
                        <span className={clsx({ "text-white": !menuItem.disabled })}>{menuItem.title}</span>
                    </motion.div>
                </div>
            </NavLink>
        </li>
    );
};

export const SidebarHeader = (isOpen: boolean) => (
    <div className={clsx("flex items-center h-16 relative")}>
        <div className="w-20 h-14 flex justify-center items-center">
            <img src={logo} className="w-8" />
        </div>
        <motion.div
            variants={headerVariants}
            animate={isOpen ? variantType.visible : variantType.hidden}
            className={clsx("absolute inset-0 ml-20 w-64 flex items-center")}
        >
            <span className="text-gold-700 text-2xl font-thin">Firebot</span>
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
                className="fixed h-full z-30 bg-dark-500 overflow-y-auto"
                style={{ width: "65px" }}
                whileHover={{ width: 220 }}
                onHoverStart={thunk(toggleIsOpen, [true])}
                onHoverEnd={thunk(toggleIsOpen, [false])}
            >
                {SidebarHeader(isOpen)}
                <ul className="h-full">{menuItems.map(MenuItem(isOpen))}</ul>
            </motion.aside>
        </>
    );
};
