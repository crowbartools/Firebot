/* eslint-disable @typescript-eslint/ban-types */
export type BasePage = {
    id: string;
    name: string;
    icon: `fa-${string}`;
    fullPage?: boolean;
    disableScroll?: boolean;
}

export type AngularJsPage = BasePage & {
    type: 'angularjs';
    template: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    controller: Function;
}

export type IframePage = BasePage & {
    type: 'iframe';
    // Other properties TBD
}

export type AngularJsFactory = {
    name: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    function: Function;
}

export type AngularJsComponent = {
    name: string;
    bindings: Record<string, string>;
    template: string;
    transclude?: boolean | string | {[slot: string]: string};
    // eslint-disable-next-line @typescript-eslint/ban-types
    controller: Function;
}

export type AngularJsDirective = {
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function: (...args: any[]) => {
        compile?: Function;
        controller?: Function;
        link?: Function;
        multiElement?: boolean;
        name?: string;
        priority?: number;
        require?: string | string[] | {[controller: string]: string};
        restrict?: string;
        scope?: boolean | Object;
        template?: string;
        terminal?: boolean;
        transclude?: boolean | string | {[slot: string]: string};
    };
}

export type AngularJsFilter= {
    name: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    function: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]): Function;
    };
}

export type UIExtension = {
    id: string;
    /**
     * Adds new sidebar entries under an "Extensions" category
     */
    pages?: AngularJsPage[];
    /**
     * Add your own AngularJS services, components, directives, filters
     */
    providers?: {
        factories?: AngularJsFactory[];
        components?: AngularJsComponent[];
        directives?: AngularJsDirective[];
        filters?: AngularJsFilter[];
    }
}
