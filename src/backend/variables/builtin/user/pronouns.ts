import { app } from "electron";

import { ReplaceVariable } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

import logger from "../../../logwrapper";

const callUrl = async (url: string): Promise<Response> => {
    try {
        const appVersion = app.getVersion();
        const response = await fetch(url, {
            headers: {
                "User-Agent": `Firebot/${appVersion}`
            }
        });

        if (response) {
            return response;
        }
    } catch (error) {
        logger.warn(`error calling readApi url: ${url}`, error.message);
        return null;
    }
};

const model : ReplaceVariable = {
    definition: {
        handle: "pronouns",
        description: "Returns the pronouns of the given user. It uses https://pronouns.alejo.io/ to get the pronouns.",
        examples: [
            {
                usage: 'pronouns[username, 0, they/them]',
                description: "Returns 'she/her' if available, otherwise uses they/them."
            },
            {
                usage: 'pronouns[username, 1, they]',
                description: "Returns 'she' pronoun in she/her set if available, otherwise uses they."
            },
            {
                usage: 'pronouns[username, 2, them]',
                description: "Returns 'her' pronoun in she/her set if available, otherwise uses them."
            }
        ],
        categories: [VariableCategory.COMMON],
        possibleDataOutput: [OutputDataType.TEXT]
    },
    evaluator: async (
        trigger,
        username: string,
        pronounNumber: number | string = 0,
        // eslint-disable-next-line @typescript-eslint/no-inferrable-types
        fallback : string = "they/them"
    ) => {

        if (typeof pronounNumber === 'string' || <unknown>pronounNumber instanceof String) {
            pronounNumber = Number(`${pronounNumber}`);
        }

        if (!Number.isFinite(<number>pronounNumber)) {
            logger.warn(`Pronoun index not a number using ${fallback}`);
            return fallback;
        }
        try {
            const pronouns = await (await callUrl('https://pronouns.alejo.io/api/pronouns')).json();
            let userPronounData = (await (await callUrl(`https://pronouns.alejo.io/api/users/${username}`)).json())[0];

            let pronounArray = [];
            if (userPronounData == null || userPronounData === undefined) {
                userPronounData = { "pronoun_id": `${fallback}`.replace("/", "") };
            }

            let pronoun = pronouns.find(p => p.name === userPronounData.pronoun_id);
            if (pronoun != null) {
                pronounArray = pronoun.display.split('/');
            } else {
                pronoun = { "display": `${fallback}` };
                pronounArray = fallback.split('/');
            }

            if (pronounNumber === 0) {
                return pronoun.display;
            }

            if (pronounArray.length === 1) {
                return pronounArray[0];
            }

            if (pronounArray.length >= pronounNumber) {
                return pronounArray[pronounNumber - 1];
            }

        } catch (err) {
            logger.warn("error when parsing pronoun api", err);
            return fallback;
        }
        return fallback;
    }
};
export default model;