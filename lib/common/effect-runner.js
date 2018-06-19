"use strict";

const logger = require("../logwrapper");
const util = require("../utility");

const Interactive = require("./mixer-interactive.js");
const Chat = require("./mixer-chat.js");

const effectManager = require("../effects/effectManager");
const { EffectDependency } = require("../effects/models/effectModels");

// Connection Dependency Checker
// This returns true if all dependency checks pass. IE: If interactive is required and we're connected to interactive.
// NOTE: I don't know of a way to check for overlay status right now so this skips that check.
function validateEffectCanRun(effectId, triggerType) {
  let effectDefinition = effectManager.getEffectById(effectId).definition;

  console.log("checking effect triggers");
  // Validate trigger
  if (
    !effectDefinition.triggers.includes(triggerType) &&
    !effectDefinition.triggers.includes("all")
  ) {
    logger.info(`${effectId} cannot be triggered by: ${triggerType}`);
    return false;
  }

  console.log("checking effect dependancies");
  // Validate Dependancies
  let interactiveStatus = Interactive.getInteractiveStatus();
  let chatStatus = Chat.getChatStatus();

  console.log(effectDefinition);
  let validDeps = effectDefinition.dependencies.every(d => {
    if (d === EffectDependency.INTERACTIVE) {
      return interactiveStatus;
    }

    if (d === EffectDependency.CHAT) {
      return chatStatus;
    }

    if (d === EffectDependency.CONSTELLATION) {
      // TODO: update to actually check state of constellation
      return true;
    }

    if (d === EffectDependency.OVERLAY) {
      return true;
    }

    logger.info(`Unknown effect dependancy: ${d}`);
    return false;
  });

  return validDeps;
}

function triggerEffect(effect, trigger) {
  return new Promise((resolve, reject) => {
    // For each effect, send it off to the appropriate handler.
    logger.debug(`Running ${effect.id} effect...`);

    let effectDef = effectManager.getEffectById(effect.id);

    return effectDef.onTriggerEvent({ effect: effect, trigger: trigger });
  });
}

function runEffects(runEffectsContext) {
  return new Promise(async resolve => {
    let trigger = runEffectsContext.trigger,
      effects = runEffectsContext.effects;

    console.log("running effects: ");
    console.log(effects);
    for (const effect of effects) {
      // Check this effect for dependencies before running.
      // If all dependencies are not fulfilled, we will skip this effect.
      if (!validateEffectCanRun(effect.id, trigger.type)) {
        logger.info(
          "Skipping " +
            effect.id +
            ". Dependencies not met or trigger not supported."
        );
        renderWindow.webContents.send("eventlog", {
          type: "general",
          username: "System:",
          event: `Skipped over ${
            effect.name
          } due to dependencies or unsupported trigger.`
        });
        continue;
      }

      try {
        console.log("triggering effect " + effect.id);
        let response = await triggerEffect(effect, trigger);
        if (response && response.success === false) {
          logger.error(
            `An effect with ID ${effect.id} failed to run.`,
            response.reason
          );
        }
      } catch (err) {
        logger.error(
          `There was an error running effect with ID ${effect.id}`,
          err
        );
      }
    }

    console.log("resolving effects");
    resolve();
  });
}

function processEffects(processEffectsRequest) {
  return new Promise(resolve => {
    let username = "";
    if (processEffectsRequest.participant) {
      username = processEffectsRequest.participant.username;
    }

    // Add some values to our wrapper
    let runEffectsContext = processEffectsRequest;
    runEffectsContext["username"] = username;

    return runEffects(runEffectsContext);
  });
}

exports.processEffects = processEffects;
