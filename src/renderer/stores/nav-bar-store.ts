import { makeAutoObservable } from "mobx";

type ElementDimensions = {
    x: number;
    y: number;
    width: number;
    height: number;
};

class NavbarStore {
    activeNavItem: ElementDimensions | null = null;
    appContentArea: ElementDimensions | null = null;

    constructor() {
        makeAutoObservable(this);
    }

    setActiveNavItem(element: ElementDimensions) {
        console.log("set", this.appContentArea);
        this.activeNavItem = element;
        if (this.appContentArea) {
            console.log(this.activeNavItem, this.appContentArea);
            console.log(
                "touches top",
                this.activeNavItem.y <= this.appContentArea.y &&
                    this.activeNavItem.y + this.activeNavItem.height >=
                        this.appContentArea.y
            );
        }
    }

    setAppContentArea(element: ElementDimensions) {
        this.appContentArea = element;
    }
}

export const navbarStore = new NavbarStore();
