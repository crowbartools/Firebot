import { resolve } from "path";
import { readFileSync } from "fs";
import argv from "./common/argv-parser";
import logger from "./logwrapper";

interface FirebotSecrets {
    twitchClientId: string;
    tipeeeStreamClientId: string;
    tipeeeStreamClientSecret: string;
    streamLabsClientId: string;
    streamLabsClientSecret: string;
    fontAwesome5KitId: string;
}

class SecretsManager {
    secrets: FirebotSecrets;
    expectedKeys: (keyof FirebotSecrets)[] = [
        "twitchClientId",
        "tipeeeStreamClientId",
        "tipeeeStreamClientSecret",
        "streamLabsClientId",
        "streamLabsClientSecret",
        "fontAwesome5KitId"
    ];

    constructor() {
        try {
            this.secrets = require("../secrets.json") as FirebotSecrets;
        } catch { }
    }

    testSecrets(): boolean {
        logger.debug("...Starting secrets test");
        let missingKeys = this.expectedKeys;
        try {
            let secrets: FirebotSecrets;
            if (Object.hasOwn(argv, "fbsecrets-config") && typeof argv["fbsecrets-config"] === "string" && /^\.json/i.test(argv["fbsecrets-config"])) {
                secrets = JSON.parse(readFileSync(resolve(__dirname, "../", argv["fbsecrets-config"]), "utf-8")) as FirebotSecrets;
            } else {
                secrets = (require("../secrets.json") || {}) as FirebotSecrets;
            }

            missingKeys = this.expectedKeys.filter(k => secrets[k] == null);

            if (!missingKeys.length) {
                // We have no missing keys
                return true;
            }
        } catch (error) {
            const err = error as { code: string };
            if (err && err.code === "MODULE_NOT_FOUND") {
                logger.error("Unable to find secrets.json in the root directory. Please create one. Contact us in the CrowbarTools Discord if you have any questions.");
                return false;
            } else if (err && err.code === "ENOENT") {
                logger.error(`Unable to find user-specified secrets file "${resolve(__dirname, "../", argv["fb-secrets-json"] as string)}"`);
                return false;
            }
            logger.error(`Secrets file is invalid JSON data`);
            return false;
        }

        logger.error(`secrets.json is missing the following key(s): ${missingKeys.join(", ")}`);
        return false;
    }
}

const secretsManager = new SecretsManager();

export { secretsManager as SecretsManager };