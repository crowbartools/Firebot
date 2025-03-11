import adVariables from './ads';
import chatVariables from './chat';
import channelGoalVariables from './channel-goal';
import charityVariables from './charity';
import cheerVariables from './cheer';
import cheermoteVariables from './cheermote';
import hypetrainVariables from './hype-train';
import pollVariables from './polls';
import raidVariables from './raid';
import rewardVariables from './reward';
import streamVariables from './stream';
import subVariables from './subs';

import accountCreationDate from './account-creation-date';
import followAge from './follow-age';
import followCount from './follow-count';
import predictionWinningOutcomeName from './prediction-winning-outcome-name';
import twitchChannelUrl from './twitch-channel-url';
import viewerCount from './viewer-count';
import vip from './vip';

export default [
    ...adVariables,
    ...chatVariables,
    ...channelGoalVariables,
    ...charityVariables,
    ...cheerVariables,
    ...cheermoteVariables,
    ...hypetrainVariables,
    ...pollVariables,
    ...raidVariables,
    ...rewardVariables,
    ...streamVariables,
    ...subVariables,

    accountCreationDate,
    followAge,
    followCount,
    predictionWinningOutcomeName,
    twitchChannelUrl,
    viewerCount,
    vip
];
