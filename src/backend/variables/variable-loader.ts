import builtinVariables from './builtin/index';

const manager = require('./replace-variable-manager');

export const loadReplaceVariables = () => {
    for (const definition of builtinVariables) {
        manager.registerReplaceVariable(definition);
    }
};



