import adVariables from './ads';
import bitsVariables from './bits';
import chatVariables from './chat';
import channelGoalVariables from './channel-goal';
import charityVariables from './charity';
import cheermoteVariables from './cheermote';
import clipVariables from "./clips";
import hypetrainVariables from './hype-train';
import pollVariables from './polls';
import raidVariables from './raid';
import rewardVariables from './reward';
import streamVariables from './stream';
import subVariables from './subs';

import accountCreationDate from './account-creation-date';
import followAge from './follow-age';
import followCount from './follow-count';
import latestFollower from './latest-follower';
import predictionWinningOutcomeName from './prediction-winning-outcome-name';
import twitchChannelUrl from './twitch-channel-url';
import twitchVodUrl from './twitch-vod-url';
import viewerCount from './viewer-count';
import vip from './vip';

export default [
    ...adVariables,
    ...bitsVariables,
    ...chatVariables,
    ...channelGoalVariables,
    ...charityVariables,
    ...cheermoteVariables,
    ...clipVariables,
    ...hypetrainVariables,
    ...pollVariables,
    ...raidVariables,
    ...rewardVariables,
    ...streamVariables,
    ...subVariables,

    accountCreationDate,
    followAge,
    followCount,
    latestFollower,
    predictionWinningOutcomeName,
    twitchChannelUrl,
    twitchVodUrl,
    viewerCount,
    vip
];
