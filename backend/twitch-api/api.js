"use strict";

const refreshingAuthProvider = require("../auth/refreshing-auth-provider");
const { ApiClient } = require("@twurple/api");

exports.getClient = () => new ApiClient({ authProvider: refreshingAuthProvider.getRefreshingAuthProviderForStreamer() });

exports.channels = require("./resource/channels");
exports.channelRewards = require("./resource/channel-rewards");
exports.users = require("./resource/users");
exports.categories = require("./resource/categories");
exports.streamTags = require("./resource/stream-tags");
