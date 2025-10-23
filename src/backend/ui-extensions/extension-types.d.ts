/* eslint-disable @typescript-eslint/no-unsafe-function-type */
export type BasePage = {
    id: string;
    name: string;
    icon: `fa-${string}`;
    fullPage?: boolean;
    disableScroll?: boolean;
};

export type AngularJsPage = BasePage & {
    type: 'angularjs';
    template: string;
    controller: Function;
};

export type IframePage = BasePage & {
    type: 'iframe';
    // Other properties TBD
};

export type AngularJsFactory = {
    name: string;
    function: Function;
};

export type AngularJsComponent = {
    name: string;
    bindings: Record<string, string>;
    template: string;
    transclude?: boolean | string | { [slot: string]: string };
    controller: Function;
};


/**
 * A specialized AngularJS component for rendering Firebot parameters.
 * These components will always have the following bindings:
 * - `$ctrl.schema`: The parameter schema (any properties in the parameter object)
 * - `$ctrl.value`: The current value of the parameter
 * - `$ctrl.onInput`: A callback function to call when the parameter value changes
 * - `$ctrl.onTouched`: A callback function to call when the parameter is touched
 */
export type AngularJsFirebotParameterComponent = {
    parameterConfig: {
        /**
         * The type of parameter this component handles.
         * This value is what will go in the "type" field of a parameter schema.
         */
        type: string;
        hideTitle?: boolean;
        hideDescription?: boolean;
    };
    template: string;
    controller: Function;
};

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
        require?: string | string[] | { [controller: string]: string };
        restrict?: string;
        scope?: boolean | object;
        template?: string;
        terminal?: boolean;
        transclude?: boolean | string | { [slot: string]: string };
    };
};

export type AngularJsFilter = {
    name: string;
    function: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]): Function;
    };
};

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
        /**
         * Add your own parameter components for rendering custom parameter types
         */
        parameters?: AngularJsFirebotParameterComponent[];
    };
};
