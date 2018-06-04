"use strict";

const registeredEffects = [];

function registerEffect(effect) {
  registeredEffects.push(effect);
}

let exampleEffect = {
  id: "playsound",
  name: "Play Sound",
  description: "Plays a sound effect",
  tags: [],
  dependenies: [],
  triggers: [],
  optionsTemplate: `
    <div></div>
  `,
  optionsController: () => {},
  onTrigger: runRequest => {},
  overlayExtension: {}
};

function getEffectDefinitions() {
  let mapped = registeredEffects.map(e => {
    return {
      id: e.id,
      name: e.name,
      description: e.description,
      tags: e.tags,
      dependenies: e.dependenies,
      triggers: e.triggers
    };
  });

  return mapped;
}

function getEffectById(id) {
  return registeredEffects.filter(e => e.id === id);
}
