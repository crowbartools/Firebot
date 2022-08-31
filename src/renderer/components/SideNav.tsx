import * as React from "react";
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import { motion, Variants } from "framer-motion";
import logo from "../assets/images/logo.png";
import Icon from "@mdi/react";
import { thunk } from "../utils";
import { menu, MenuItem } from "routes";
import { useScroll } from "react-use";
import { observer } from "mobx-react";
import { useStores } from "stores";

const variantType = {
    hidden: "hidden",
    visible: "visible",
};

const menuItemTitleVariants: Variants = {
    [variantType.hidden]: {
        opacity: 0,
        transition: {
            duration: 0.1,
        },
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
    [variantType.hidden]: {
        opacity: 0,
        transition: {
            duration: 0.1,
        },
    },
    [variantType.visible]: { opacity: 0.33 },
};

interface MenuItemProps {
    isOpen: boolean;
    container: React.MutableRefObject<any>;
    menuItem: MenuItem;
    index: number;
}

const MenuItem: React.FC<MenuItemProps> = observer(
    ({ container, index, isOpen, menuItem }) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const location = useLocation();
        const isActive = location.pathname === menuItem.route;

        // const { navbarStore } = useStores();

        // useScroll(container);

        // const ref = React.useRef(null);
        // if (isActive && ref.current) {
        //     const { x, y, width, height } = ref.current.getBoundingClientRect();
        //     navbarStore.setActiveNavItem({
        //         x,
        //         y,
        //         width,
        //         height,
        //     });
        // }

        return (
            <li
                key={menuItem.route}
                className={clsx(
                    "mb-1.5",
                    isActive && !isOpen ? "pl-2" : "px-2"
                )}
            >
                <NavLink
                    exact={true}
                    to={menuItem.route}
                    className={clsx("focus:outline-none", {
                        "pointer-events-none": menuItem.disabled,
                    })}
                >
                    <motion.div
                        whileTap={!isActive ? { scale: 0.95 } : undefined}
                        className={clsx(
                            {
                                "bg-slab-700 rounded-xl": isActive,
                                "hover:bg-slab-700 hover:bg-opacity-75 rounded-xl":
                                    !isActive,
                                "rounded-r-none": isActive && !isOpen,
                            },
                            "transition duration-150 ease-in-out",
                            "flex items-center h-14 relative",
                            menuItem.className
                        )}
                    >
                        <div
                            className={clsx(
                                "w-16 flex justify-center items-center text-xl",
                                {
                                    "text-white text-opacity-75": !isActive,
                                    "text-yellow-400": isActive,
                                }
                            )}
                        >
                            <Icon
                                path={menuItem.icon}
                                title={menuItem.title}
                                // className="h-6 w-6"
                                size={1}
                                horizontal
                                vertical
                                rotate={180}
                            />
                        </div>
                        <motion.div
                            custom={index}
                            variants={menuItemTitleVariants}
                            animate={
                                isOpen
                                    ? variantType.visible
                                    : variantType.hidden
                            }
                            className={clsx(
                                "absolute inset-0 ml-16 w-64 flex items-center uppercase font-thin font-base"
                            )}
                        >
                            <span
                                className={clsx(
                                    {
                                        "text-white": !menuItem.disabled,
                                        "font-semibold": isActive,
                                    },
                                    "capitalize"
                                )}
                            >
                                {menuItem.title}
                            </span>
                        </motion.div>
                    </motion.div>
                </NavLink>
            </li>
        );
    };
);

const CategoryHeader = (category: string, isOpen: boolean) => (
    <li className="relative">
        <motion.div
            variants={categoryHeaderVariants}
            animate={isOpen ? variantType.visible : variantType.hidden}
            className={clsx("ml-4 mb-1 mt-2 text text-gray-500 uppercase")}
        >
            {category}
        </motion.div>
        <motion.div
            variants={categoryHeaderVariants}
            animate={isOpen ? variantType.hidden : variantType.visible}
            className="h-0.5 w-full bg-slate-900/75 absolute top-1/2 left-0 -translate-y-1/2"
        ></motion.div>
    </li>
);

const SidebarHeader = (isOpen: boolean) => (
    <div className={clsx("flex items-center h-16 relative flex-shrink-0")}>
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

    const ref = React.useRef(null);

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
                    "fixed h-full z-30 rounded-r-xl overflow-hidden flex flex-col",
                    isOpen ? "bg-slab-900" : "bg-slab-900"
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
                {SidebarHeader(isOpen)}
                <ul className="h-full overflow-auto pb-4" ref={ref}>
                    {Object.keys(menu).map((category) => (
                        <>
                            {!!category?.length &&
                                CategoryHeader(category, isOpen)}
                            {menu[category].map((item, index) => (
                                <MenuItem
                                    container={ref}
                                    index={index}
                                    menuItem={item}
                                    isOpen={isOpen}
                                    key={item.route}
                                />
                            ))}
                        </>
                    ))}
                </ul>
            </motion.aside>
        </>
    );
};
