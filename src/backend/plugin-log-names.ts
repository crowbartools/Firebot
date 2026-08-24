const pluginDisplayNames = new Map<string, string>();

export function registerPluginLogName(pluginId: string, displayName: string): void {
    pluginDisplayNames.set(pluginId, displayName);
}

export function unregisterPluginLogName(pluginId: string): void {
    pluginDisplayNames.delete(pluginId);
}

export function getPluginLogName(pluginId: string): string | undefined {
    return pluginDisplayNames.get(pluginId);
}
