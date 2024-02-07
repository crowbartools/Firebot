import { join, resolve, sep } from 'node:path';
import { readdirSync } from 'node:fs';

import { ReplaceVariable, Trigger } from "../../../../types/variables";
import { OutputDataType, VariableCategory } from "../../../../shared/variable-constants";

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
        categories: [VariableCategory.ADVANCED],
        possibleDataOutput: [OutputDataType.TEXT]
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

            const regexFilter = new RegExp(<string>filter, flags);
            return fileList
                .filter(dirent => regexFilter.test(dirent.name))
                .map(dirent => resolve(join(dirent.path, sep, dirent.name)));

        } catch {}
        return [];
    }
};
export default model;