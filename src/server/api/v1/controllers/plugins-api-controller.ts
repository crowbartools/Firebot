import { Request, Response } from "express";
import { PluginManager } from "../../../../backend/plugins/plugin-manager";

/**
 * Convenience endpoint used for plugin hot-reloading. A plugin's dev tooling can
 * call this after copying a freshly bundled .js file into the scripts folder to
 * have Firebot restart the running plugin.
 */
export async function restartPlugin(
    req: Request<unknown, unknown, { fileName?: string }>,
    res: Response
): Promise<void> {
    const fileName = req.body?.fileName ?? (req.query?.fileName as string | undefined);

    try {
        await PluginManager.restartPluginByFileName(fileName);
    } catch {
        // best-effort, ignore errors
    }

    res.status(200).send({ status: "ok" });
}
