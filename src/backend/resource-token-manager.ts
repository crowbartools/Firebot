import { randomUUID } from "crypto";
import logger from "./logwrapper";

interface ResourceToken {
    path: string;
    length: number | null;
}

class ResourceTokenManager {
    tokens: Record<string, ResourceToken> = {};

    private deleteToken(token: string) {
        logger.debug(`Deleting token: ${token}`);
        if (this.tokens[token] !== undefined) {
            delete this.tokens[token];
        }
    }

    getResourcePath(token: string) {
        const resource = this.tokens[token];

        // delete the token if we actually had something saved.
        // delay for the given length before deletion to allow multiple requests at once and loading.
        if (resource != null) {
            setTimeout((t) => {
                this.deleteToken(t);
            }, resource.length, token);
            return resource.path;
        }
        return null;
    }

    storeResourcePath(path: string, length: string | number | null) {
        const existingToken = Object.entries(this.tokens).find(([, value]) => value.path === path);

        // if we already have a token for this path and it is not temporary, return it.
        if (existingToken && existingToken.length == null) {
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