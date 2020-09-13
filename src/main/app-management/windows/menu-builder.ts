import { Menu, MenuItem, MenuItemConstructorOptions } from "electron";

type MenuTemplate = (MenuItem | MenuItemConstructorOptions)[];

const menuTemplate: MenuTemplate = [
    {
        label: "Edit",
        submenu: [
            {
                role: "cut",
            },
            {
                role: "copy",
            },
            {
                role: "paste",
            },
        ],
    },
    {
        label: "Window",
        submenu: [
            {
                role: "minimize",
            },
            {
                role: "close",
            },
            {
                type: "separator",
            },
            {
                role: "toggleDevTools",
            },
        ],
    },
    {
        role: "help",
        submenu: [
            {
                label: "About",
            },
        ],
    },
];

export const applicationMenu = Menu.buildFromTemplate(menuTemplate);
