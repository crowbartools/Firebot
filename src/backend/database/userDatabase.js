"use strict";

const viewerDatabase = require("../viewers/viewer-database");
const viewerMetadataManager = require("../viewers/viewer-metadata-manager");
const viewerOnlineStatusManager = require("../viewers/viewer-online-status-manager");

exports.getUserDb = viewerDatabase.getViewerDb;
exports.connectUserDatabase = viewerDatabase.connectViewerDatabase;

exports.createNewUser = viewerDatabase.createNewViewer;
exports.addNewUserFromChat = viewerDatabase.addNewViewerFromChat;
exports.getUserById = viewerDatabase.getViewerById;
exports.getUserByUsername = viewerDatabase.getViewerByUsername;
exports.getTwitchUserByUsername = viewerDatabase.getViewerByUsername;
exports.getAllUsernames = viewerDatabase.getAllUsernames;
exports.getAllUsernamesWithIds = viewerDatabase.getAllUsernamesWithIds;
exports.updateUser = viewerDatabase.updateViewer;
exports.updateViewerDataField = viewerDatabase.updateViewerDataField;
exports.removeUser = viewerDatabase.removeViewer;
exports.incrementDbField = viewerDatabase.incrementDbField;

exports.getUserMetadata = viewerMetadataManager.getViewerMetadata;
exports.getTopMetadata = viewerMetadataManager.getTopMetadata;
exports.getTopMetadataPosition = viewerMetadataManager.getTopMetadataPosition;
exports.updateUserMetadata = viewerMetadataManager.updateViewerMetadata;
exports.removeUserMetadata = viewerMetadataManager.removeViewerMetadata;

exports.setChatUserOnline = viewerOnlineStatusManager.setChatViewerOnline;
exports.setChatUsersOnline = viewerOnlineStatusManager.setAllChatViewersOnline;
exports.setChatUserOffline = viewerOnlineStatusManager.setChatViewerOffline;
exports.setAllUsersOffline = viewerOnlineStatusManager.setAllViewersOffline;
exports.getUserOnlineMinutes = viewerOnlineStatusManager.getViewerOnlineMinutes;
exports.getTopViewTimeUsers = viewerOnlineStatusManager.getTopViewTimeViewers;
exports.getOnlineUsers = viewerOnlineStatusManager.getOnlineViewers;