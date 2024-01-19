import accountVariables from './accounts';
import arrayVariables from './array';
import counterVariables from './counter';
import customVariables from './custom-vars';
import donationVariables from './donation';
import metadataVariables from './metadata';
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
    ...customVariables,
    ...donationVariables,
    ...metadataVariables,
    ...numberVariables,
    ...objectVariables,
    ...operandVariables,
    ...spoofedVariables,
    ...textVariables,
    ...twitchVariables,
    ...userVariables,
    ...utilityVariables
];