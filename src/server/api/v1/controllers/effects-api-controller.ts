import { Request, Response } from "express";
import { EffectList } from "../../../../types/effects";
import { PresetEffectListManager } from "../../../../backend/effects/preset-lists/preset-effect-list-manager";
import { EffectManager } from "../../../../backend/effects/effect-manager";
import effectRunner from "../../../../backend/common/effect-runner";
import { Trigger } from "../../../../types/triggers";

export function getEffects(req: Request, res: Response): void {
    let effectDefs = EffectManager.getEffectDefinitions();

    if (req.query.trigger) {
        effectDefs = effectDefs.filter(effect => effect.triggers == null || effect.triggers[req.query.trigger as string]);
    }

    res.json(effectDefs);
};

export function getEffect(req: Request, res: Response): void {
    const effectId = req.params.effectId;
    const effect = EffectManager.getEffectById(effectId);
    if (effect == null) {
        res.status(404).send({
            status: "error",
            message: `Cannot find effect '${effectId}'`
        });
        return;
    }

    res.json(effect.definition);
};

export async function runEffects(
    req: Request<undefined, undefined, {
        effects: EffectList;
        triggerData: {
            username: string;
        };
    }>,
    res: Response
): Promise<void> {
    if (req.body.effects != null) {

        const triggerData = req.body?.triggerData ?? {} as { username: string };
        if (triggerData.username == null) {
            triggerData.username = "API Call";
        }

        const processEffectsRequest = {
            trigger: {
                type: "api",
                metadata: triggerData
            } as Trigger,
            effects: req.body.effects
        };

        try {
            await effectRunner.processEffects(processEffectsRequest);
            res.status(200).send({ status: "success" });
        } catch (error) {
            const err = error as Error;
            res.status(500).send({ status: "error", message: err.message });
        }
    } else {
        res.status(400).send({ status: "error", message: "No effects provided." });
    }
};

export function getPresetLists(req: Request, res: Response): void {
    const presetLists = PresetEffectListManager.getAllItems();

    if (presetLists == null) {
        res.status(500).send({
            status: "error",
            message: "Unknown error getting preset effect lists"
        });
    }

    const formattedPresetLists = presetLists.map((presetList) => {
        return {
            id: presetList.id,
            name: presetList.name,
            args: presetList.args.map(arg => arg.name)
        };
    });

    res.json(formattedPresetLists);
};

async function runPresetEffectList(
    req: Request,
    res: Response,
    waitForCompletion = false
): Promise<void> {
    const presetListId = req.params.presetListId;

    if (presetListId == null) {
        res.status(400).send({
            status: "error",
            message: `No presetListId provided`
        });
    }

    const presetList = PresetEffectListManager.getItem(presetListId);
    if (presetList == null) {
        res.status(404).send({
            status: "error",
            message: `Cannot find preset effect list '${presetListId}'`
        });
    }

    const body = (req.body ?? {}) as { username?: string, args?: Record<string, unknown> };
    const query = req.query ?? {};
    let args: Record<string, unknown>, username: string;

    // GET
    if (req.method === "GET") {
        username = query.username as string;
        args = query;

    // POST
    } else if (req.method === "POST") {
        username = body.username;
        args = body.args;

    // Not GET or POST
    } else {
        res.status(404).send({ status: "error", message: "Invalid request method" });
    }

    const processEffectsRequest = {
        trigger: {
            type: "preset",
            metadata: {
                username,
                presetListArgs: args
            }
        } as Trigger,
        effects: presetList.effects
    };

    try {
        if (waitForCompletion === true) {
            await effectRunner.processEffects(processEffectsRequest);
        } else {
            void effectRunner.processEffects(processEffectsRequest);
        }
        res.status(200).send({ status: "success" });
    } catch (error) {
        const err = error as Error;
        res.status(500).send({ status: "error", message: err.message });
    }
}

export async function runPresetListSynchronous(req: Request, res: Response): Promise<void> {
    await runPresetEffectList(req, res, true);
};

export function triggerPresetListAsync(req: Request, res: Response): void {
    void runPresetEffectList(req, res, false);
};
