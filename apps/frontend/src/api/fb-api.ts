import { StreamingPlatformApi } from "@/api/resources/streaming-platform";
import { UserProfileApi } from "@/api/resources/user-profile";
import { getServerUri } from "@/utils";
import axios from "axios";

export class FbApi {
  private readonly api = axios.create({
    baseURL: `${getServerUri()}/api/v1/`,
    withCredentials: true,
  });

  public readonly streamingPlatform = new StreamingPlatformApi(this.api);
  public readonly userProfile = new UserProfileApi(this.api);

  constructor() {}
}