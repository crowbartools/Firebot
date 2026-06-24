import type { ScopedIpc } from "../../../../types/plugin-api";
import { definePluginApiNamespace } from "../internal/define-namespace";

import { pluginMessageBroker } from "../internal/message-broker";

export const createMessagingApi = definePluginApiNamespace<ScopedIpc>((ctx) => {
    const { ipc, dispose } = pluginMessageBroker.createScope(ctx.scriptId, ctx.logger);

    ctx.onDispose(dispose);

    return ipc;
});
