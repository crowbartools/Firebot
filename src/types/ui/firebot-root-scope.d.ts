import type angular from "angular";

export type FirebotRootScope = angular.IRootScopeService & {
    copyTextToClipboard: (text: string) => void;
};
