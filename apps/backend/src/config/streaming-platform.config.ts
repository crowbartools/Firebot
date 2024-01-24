/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { registerAs } from "@nestjs/config";

export const StreamingPlatformConfig = registerAs("streamingPlatform", () => {
  return {
    twitch: {
      clientId: process.env.TWITCH_CLIENT_ID!,
    }
  };
});
