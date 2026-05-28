import type { ScriptApiContext } from "../context";

export type ScriptApiNamespaceFactory<TApi> = (ctx: ScriptApiContext) => TApi;

export function defineScriptApiNamespace<TApi>(factory: ScriptApiNamespaceFactory<TApi>): ScriptApiNamespaceFactory<TApi> {
    return factory;
}
