import type { Quote } from "./quotes";
import type { FileFilter, Awaitable } from "./util-types";

export interface LoadRequest {
    appId: string;
    filepath: string;
};

export interface LoadResult<T = unknown[]> {
    success: boolean;
    data?: T;
    error?: string;
};

export type ParsedQuotes = {
    quotes: Quote[];
};

export type ParsedViewers<V = unknown> = {
    viewers: V[];
    ranks: string[];
};

export interface ImportRequest<Data = unknown, Settings = unknown> {
    appId: string;
    data: Data;
    settings: Settings;
}

export interface ImportResult {
    success: boolean;
    error?: string;
}

type CustomImporterSettings = {
    quotes?: unknown;
    viewers?: unknown;
};

export type ThirdPartyImporter<
    Settings extends CustomImporterSettings = unknown,
    ViewerType = unknown
> = {
    id: string;
    appName: string;
    defaultSettings?: Settings;
    filetypes: FileFilter[];

    loadQuotes?: (
        filename: string,
        settings?: Settings["quotes"]
    ) => Awaitable<LoadResult<ParsedQuotes>>;

    importQuotes?: (
        quotes: Quote[],
        settings: Settings["quotes"]
    ) => Awaitable<ImportResult>;

    loadViewers?: (
        filename: string,
        settings?: Settings["viewers"]
    ) => Awaitable<LoadResult<ParsedViewers>>;

    importViewers?: (
        viewers: ViewerType[],
        settings: Settings["viewers"]
    ) => Awaitable<ImportResult>;
};