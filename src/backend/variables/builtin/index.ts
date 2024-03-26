import accountVariables from './accounts';
import arrayVariables from './array';
import counterVariables from './counter';
import currencyVariables from './currency';
import customVariables from './custom-vars';
import donationVariables from './donation';
import macroVariables from './macro';
import metadataVariables from './metadata';
import miscVariables from './misc';
import numberVariables from './number';
import objectVariables from './object';
import operandVariables from './operand';
import spoofedVariables from './spoofed';
import textVariables from './text';
import twitchVariables from './twitch';
import userVariables from './user';
import utilityVariables from './utility';

export default [
    ...accountVariables,
    ...arrayVariables,
    ...counterVariables,
    ...currencyVariables,
    ...customVariables,
    ...donationVariables,
    ...macroVariables,
    ...metadataVariables,
    ...miscVariables,
    ...numberVariables,
    ...objectVariables,
    ...operandVariables,
    ...spoofedVariables,
    ...textVariables,
    ...twitchVariables,
    ...userVariables,
    ...utilityVariables
];