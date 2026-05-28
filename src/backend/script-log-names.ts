const scriptDisplayNames = new Map<string, string>();

export function registerScriptLogName(scriptId: string, displayName: string): void {
    scriptDisplayNames.set(scriptId, displayName);
}

export function unregisterScriptLogName(scriptId: string): void {
    scriptDisplayNames.delete(scriptId);
}

export function getScriptLogName(scriptId: string): string | undefined {
    return scriptDisplayNames.get(scriptId);
}
