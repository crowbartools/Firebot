import { randomUUID } from "crypto";
import { LoggerCache } from "./logger-cache";

interface ResourceToken {
    path: string;
    length: number | null;
}

class ResourceTokenManager {
    private logger = LoggerCache.getLogger("Resource Tokens");
    tokens: Record<string, ResourceToken> = {};

    private deleteToken(token: string) {
        this.logger.debug(`Deleting token: ${token}`);
        if (this.tokens[token] !== undefined) {
            delete this.tokens[token];
        }
    }

    getResourcePath(token: string) {
        const resource = this.tokens[token];

        // delete the token if we actually had something saved.
        // delay for the given length before deletion to allow multiple requests at once and loading.
        if (resource != null) {
            // A null length means a permanent token that must never be auto-deleted.
            if (resource.length != null) {
                setTimeout((t) => {
                    this.deleteToken(t);
                }, resource.length, token);
            }
            return resource.path;
        }
        return null;
    }

    storeResourcePath(path: string, length: string | number | null) {
        const existingToken = Object.entries(this.tokens).find(([, value]) => value.path === path);

        // if we already have a permanent token for this path, reuse it.
        if (existingToken && existingToken[1].length == null) {
            return existingToken[0];
        }

        let tokenLength = 5;

        if (typeof length === "string" && length != null && length !== "") {
            tokenLength = parseFloat(length);
        } else if (typeof length === "number" && length != null && !isNaN(length)) {
            tokenLength = length;
        }

        const token = randomUUID();
        this.tokens[token] = { path: path, length: length != null ? tokenLength * 1000 : null };
        return token;
    }
}

const resourceTokenManager = new ResourceTokenManager();

export { resourceTokenManager as ResourceTokenManager };