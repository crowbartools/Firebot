import type { PluginApiContext } from "../context";

export type PluginApiNamespaceFactory<TApi> = (ctx: PluginApiContext) => TApi;

export function definePluginApiNamespace<TApi>(factory: PluginApiNamespaceFactory<TApi>): PluginApiNamespaceFactory<TApi> {
    return factory;
}
