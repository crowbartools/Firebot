"use strict";

const refreshingAuthProvider = require("../auth/refreshing-auth-provider");
const { ApiClient } = require("@twurple/api");
const twitchClient = require("./client");

exports.getClient = () => new ApiClient({ authProvider: refreshingAuthProvider.getRefreshingAuthProviderForStreamer() });

exports.getOldClient = () => twitchClient.getClient();

exports.channels = require("./resource/channels");
exports.channelRewards = require("./resource/channel-rewards");
exports.users = require("./resource/users");
exports.teams = require("./resource/teams");
exports.categories = require("./resource/categories");
exports.streamTags = require("./resource/stream-tags");
