"use strict";


function mapMixplayControl(firebotControl) {
    let mixplayControl = firebotControl.mixplay;

    mixplayControl.controlID = firebotControl.id;
    mixplayControl.kind = firebotControl.kind;
    if (firebotControl.position != null) {
        mixplayControl.position = firebotControl.position;
    }
    if (firebotControl.active != null) {
        mixplayControl.disabled = !firebotControl.active;
    }

    //if text size is just a number, append "px"
    if (mixplayControl.textSize !== null && mixplayControl.textSize !== undefined) {
        if (!isNaN(mixplayControl.textSize)) {
            mixplayControl.textSize += "px";
        }
    }

    if (mixplayControl.backgroundImage != null) {
        mixplayControl.backgroundImage = mixplayControl.backgroundImage.trim();
    }

    if (mixplayControl.progress != null) {
        let progress = mixplayControl.progress.toString().replace("%", "").trim();
        if (isNaN(progress)) {
            mixplayControl.progress = undefined;
        } else {
            mixplayControl.progress = Number(progress) / 100;
        }
    }

    return mixplayControl;
}

function mapMixplayScene(firebotScene, id) {
    let mixplayScene = {
        sceneID: id,
        controls: []
    };

    if (firebotScene.controls) {
        for (let fbControl of firebotScene.controls) {
            let mixplayControl = mapMixplayControl(fbControl);
            mixplayScene.controls.push(mixplayControl);
        }
    }

    return mixplayScene;
}

function buildMixplayModelFromProject(project) {
    //copy the scenes to avoid issues with references
    let firebotScenes = JSON.parse(JSON.stringify(project.scenes));

    let defaultScene;
    let otherScenes = [];
    for (let fbScene of firebotScenes) {
        if (fbScene.id === project.defaultSceneId) {
            defaultScene = mapMixplayScene(fbScene, 'default');
        } else {
            otherScenes.push(mapMixplayScene(fbScene, fbScene.id));
        }
    }

    return {
        id: project.id,
        defaultScene: defaultScene,
        otherScenes: otherScenes,
        groups: []
    };
}

exports.mapMixplayControl = mapMixplayControl;
exports.buildMixplayModelFromProject = buildMixplayModelFromProject;