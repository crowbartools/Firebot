import { join, resolve, sep } from "path";
import { readdirSync } from "fs";

import type { ReplaceVariable, Trigger } from "../../../../types/variables";

const model : ReplaceVariable = {
    definition: {
        handle: "filesInDirectory",
        usage: 'filesInDirectory[path\\to\\dir\\]',
        description: "Returns an array of full filepaths in the given directory. Does not include subdirectories",
        examples: [
            {
                usage: "filesInDirectory[path\\to\\dir\\, regexp, flags]",
                description: "Lists files matching the regexp filter"
            }
        ],
        categories: ["advanced"],
        possibleDataOutput: ["text"]
    },
    evaluator: (trigger: Trigger, dirpath: string, filter?: string | RegExp, flags?: string) => {
        if (typeof dirpath === 'string' || <unknown>dirpath instanceof String) {
            dirpath = `${dirpath}`;
        }
        if (typeof dirpath !== 'string' || dirpath === '') {
            return [];
        }

        try {
            const dirList = readdirSync(dirpath, { "withFileTypes": true });
            const fileList = dirList.filter(dirent => dirent.isFile());

            if (typeof filter !== 'string') {
                return fileList
                    .map(dirent => resolve(join(dirent.path, sep, dirent.name)));
            }

            const regexFilter = new RegExp(filter, flags);
            return fileList
                .filter(dirent => regexFilter.test(dirent.name))
                .map(dirent => resolve(join(dirent.path, sep, dirent.name)));

        } catch {}
        return [];
    }
};
export default model;