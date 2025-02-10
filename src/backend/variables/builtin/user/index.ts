import chatMessages from './chat-messages';
import isUserInChat from './is-user-in-chat';
import metadataKey from './metadata-key';
import metadataValue from './metadata-value';
import pronouns from './pronouns';
import randomViewer from './random-viewer';
import randomActiveViewer from './random-active-viewer';
import userAvatarUrl from './user-avatar-url';
import userBadgeUrl from './user-badge-urls';
import userBio from './user-bio';
import userDisplayName from './user-display-name';
import userExists from './user-exists';
import userId from './user-id';
import userIdName from './user-id-name';
import userIsBanned from './user-is-banned';
import userIsTimedOut from './user-is-timed-out';
import userMetadata from './user-metadata';
import userMetadataRaw from './user-metadata-raw';
import usernameArray from './username-array';
import usernameArrayRaw from './username-array-raw';

import roleVariables from './roles';

import rankVariables from './ranks';

export default [
    chatMessages,
    isUserInChat,
    metadataKey,
    metadataValue,
    pronouns,
    randomViewer,
    randomActiveViewer,
    userAvatarUrl,
    userBadgeUrl,
    userBio,
    userDisplayName,
    userExists,
    userId,
    userIdName,
    userIsBanned,
    userIsTimedOut,
    userMetadata,
    userMetadataRaw,
    usernameArray,
    usernameArrayRaw,
    ...roleVariables,
    ...rankVariables
];