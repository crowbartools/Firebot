import { ActionType } from "workflows/action-type.decorator";
import {
  // ExecuteActionContext,
  FirebotActionIconName,
  FirebotActionType,
  // FirebotParameterCategories,
} from "firebot-types";

import { backendContext } from "backend-context";

type PlaySoundActionParams = {
  sound: {
    filePath: string;
    volume: number;
    outputDeviceId?: string;
  };
};

@ActionType()
export class PlaySoundActionType
  implements FirebotActionType<PlaySoundActionParams>
{
  constructor() {}

  id = "play-sound";
  name = "Play Sound";
  description = "Play a sound on a specific output device.";
  icon: FirebotActionIconName = "volume-2";
  category = "Chat";

  // parameters: FirebotParameterCategories<PlaySoundActionParams> = {
  //   sound: {
  //     parameters: {
  //       filePath: {
  //         type: "filepath",
  //         title: "Sound File",
  //         description: "The sound file to play.",
  //         fileOptions: {
  //           directoryOnly: false,
  //           filters: [
  //             { name: "Audio Files", extensions: ["mp3", "wav", "ogg"] },
  //           ],
  //           title: "Select Sound File",
  //           buttonLabel: "Select",
  //         },
  //       },
  //       volume: {
  //         type: "number",
  //         title: "Volume",
  //         description: "Volume level for the sound (0-100).",
  //         default: 50,
  //         validation: {
  //           min: 0,
  //           max: 100,
  //         },
  //       },
  //       outputDeviceId: {
  //         type: "string",
  //         title: "Output Device ID",
  //         description: "The ID of the output device to play the sound on.",
  //         default: "",
  //         tip: "Leave empty to use the default output device.",
  //       },
  //     },
  //   },
  // };

  async execute() // _context: ExecuteActionContext
  : Promise<void> {
    backendContext.playSound("test/test.mp3");
  }
}
