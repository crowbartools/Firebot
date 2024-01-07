import { ReplaceVariable } from "../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../shared/variable-constants";
import { app } from "electron";
import logger from "../../logwrapper";
import axios from "axios";

const callUrl = async (url: string) => {
    try {
        const appVersion = app.getVersion();
        const response = await axios.get(url, {
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

const PronounVariable: ReplaceVariable = {
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
    evaluator: async (_, username: string, pronounNumber: number, fallback: string) => {
        try {
            const pronouns = (await callUrl('https://pronouns.alejo.io/api/pronouns')).data;
            const userPronounData = (await callUrl(`https://pronouns.alejo.io/api/users/${username}`)).data[0];

            if (pronouns != null && userPronounData != null) {
                try {
                    const pronoun = pronouns.find(p => p.name === userPronounData.pronoun_id);
                    if (pronoun != null) {
                        if (pronounNumber === 0) {
                            return pronoun.display;
                        }

                        const pronounArray = pronoun.display.split('/');

                        if (pronounArray.length === 1) {
                            return pronounArray[0];
                        }

                        if (pronounArray.length >= pronounNumber) {
                            return pronounArray[pronounNumber - 1];
                        }
                        return fallback;
                    }

                    return fallback;
                } catch (err) {
                    logger.warn("error when parsing pronoun api", err);
                    return fallback;
                }
            }

        } catch (err) {
            logger.warn("error when parsing pronoun api", err);
            return fallback;
        }
    }
};

export = PronounVariable;