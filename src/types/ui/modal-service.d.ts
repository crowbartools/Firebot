import type angular from "angular";

export type ModalService = {
    showModal: (options: {
        component?: string;
        resolveObj?: { [key: string]: unknown };
        dismissCallback?: () => void;
        closeCallback?: (data: unknown) => void;
        size?: "sm" | "md" | "mdlg" | "lg" | "xl";
        keyboard?: boolean;
        backdrop?: boolean | "static";
        controllerFunc?: angular.Injectable<angular.IControllerConstructor>;
        templateUrl?: string;
        windowClass?: string;
        breadcrumbName?: string;
        /**
         * @default true
         */
        autoSlide?: boolean;
    }) => void;
};
