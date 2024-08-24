import adVariables from './ads';
import chatVariables from './chat';
import channelGoalVariables from './channel-goal';
import charityVariables from './charity';
import cheerVariables from './cheer';
import cheermoteVariables from './cheermote';
import hypetrainVariables from './hype-train';
import pollVariables from './polls';
import rewardVariables from './reward';
import streamVariables from './stream';
import subVariables from './subs';

import followAge from './follow-age';
import followCount from './follow-count';
import predictionWinningOutcomeName from './prediction-winning-outcome-name';
import raidViewerCounter from './raid-viewer-count';
import twitchChannelUrl from './twitch-channel-url';
import viewerCount from './viewer-count';


export default [
    ...adVariables,
    ...chatVariables,
    ...channelGoalVariables,
    ...charityVariables,
    ...cheerVariables,
    ...cheermoteVariables,
    ...hypetrainVariables,
    ...pollVariables,
    ...rewardVariables,
    ...streamVariables,
    ...subVariables,

    followAge,
    followCount,
    predictionWinningOutcomeName,
    raidViewerCounter,
    twitchChannelUrl,
    viewerCount
];
