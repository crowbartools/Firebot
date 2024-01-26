import { StreamingPlatformApi } from "@/api/resources/streaming-platform";
import { ProfileApi } from "@/api/resources/profile";
import { getServerUri } from "@/utils";
import axios from "axios";
import { LoginApi } from "@/api/resources/login";

export class FbApi {
  private readonly api = axios.create({
    baseURL: `${getServerUri()}/api/v1/`,
    withCredentials: true,
  });

  public readonly streamingPlatform = new StreamingPlatformApi(this.api);
  public readonly profile = new ProfileApi(this.api);
  public readonly login = new LoginApi(this.api);

  constructor() {}
}