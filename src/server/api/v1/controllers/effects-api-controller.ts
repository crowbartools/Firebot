import { EffectTrigger } from "../../../../shared/effect-constants";
import effectRunner from "../../../../backend/common/effect-runner";
import presetEffectListManager from "../../../../backend/effects/preset-lists/preset-effect-list-manager";
import { Request, Response } from "express";
import { ParsedQs } from "qs";
const effectsManager = require("../../../../backend/effects/effectManager");

export function getEffects (req: Request, res: Response) {
    let effectDefs = effectsManager.getEffectDefinitions();

    if (req.query.trigger) {
        effectDefs = effectDefs.filter(effect =>
            effect.triggers == null ||
            effect.triggers[req.query.trigger.toString()]);
    }
    res.json(effectDefs);
}

export function getEffect (req: Request, res: Response) {
    const effectId = req.params.effectId;
    const effect = effectsManager.getEffectById(effectId);
    if (effect == null) {
        res.status(404).send({
            status: "error",
            message: `Cannot find effect '${effectId}'`
        });
        return;
    }

    res.json(effect.definition);
}

export async function runEffects(req: Request, res: Response): Promise<Response> {
    if (req.body.effects != null) {

        const triggerData = req.body && req.body.triggerData || {};
        if (triggerData.username == null) {
            triggerData.username = "API Call";
        }

        const processEffectsRequest = {
            trigger: {
                type: EffectTrigger.API,
                metadata: triggerData
            },
            effects: req.body.effects
        };

        try {
            await effectRunner.processEffects(processEffectsRequest);
            return res.status(200).send({
                status: "success"
            });
        } catch (err) {
            return res.status(500).send({
                status: "error",
                message: err.message
            });
        }
    } else {
        return res.status(400).send({
            status: "error",
            message: "No effects provided."
        });
    }
}

export async function getPresetLists(req: Request, res: Response): Promise<Response> {
    const presetLists = presetEffectListManager.getAllItems();

    if (presetLists == null) {
        return res.status(500).send({
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

    return res.json(formattedPresetLists);
}

export async function runPresetEffectList(req: Request, res: Response, waitForCompletion = false): Promise<Response> {
    const presetListId = req.params.presetListId;

    if (presetListId == null) {
        return res.status(400).send({
            status: "error",
            message: `No presetListId provided`
        });
    }

    const presetList = presetEffectListManager.getItem(presetListId);
    if (presetList == null) {
        return res.status(404).send({
            status: "error",
            message: `Cannot find preset effect list '${presetList}'`
        });
    }

    const body = req.body || {};
    const query = req.query || {};
    let args: ParsedQs, username:string;

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
        return res.status(404).send({
            status: "error",
            message: "Invalid request method"
        });
    }

    const processEffectsRequest = {
        trigger: {
            type: EffectTrigger.PRESET_LIST,
            metadata: {
                username,
                presetListArgs: args
            }
        },
        effects: presetList.effects
    };

    try {
        if (waitForCompletion === true) {
            await effectRunner.processEffects(processEffectsRequest);
        } else {
            effectRunner.processEffects(processEffectsRequest);
        }
        return res.status(200).send({
            status: "success"
        });
    } catch (err) {
        return res.status(500).send({
            status: "error",
            message: err.message
        });
    }
}

export async function runPresetListSynchronous(req: Request, res: Response): Promise<Response> {
    return runPresetEffectList(req, res, true);
}

export async function triggerPresetListAsync(req: Request, res: Response): Promise<Response> {
    return runPresetEffectList(req, res, false);
}