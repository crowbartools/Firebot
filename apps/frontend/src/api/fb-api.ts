import { StreamingPlatformApi } from "@/api/resources/streaming-platform";
import { ProfileApi } from "@/api/resources/profile";
import { getServerUri } from "@/utils";
import axios from "axios";
import { LoginApi } from "@/api/resources/login";
import { AuthProviderApi } from "@/api/resources/auth-provider";
import { ConnectionApi } from "./resources/connection";

export class FbApi {
  private readonly api = axios.create({
    baseURL: `${getServerUri()}/api/v1/`,
    withCredentials: true,
  });

  public readonly streamingPlatform = new StreamingPlatformApi(this.api);
  public readonly profile = new ProfileApi(this.api);
  public readonly login = new LoginApi(this.api);
  public readonly authProvider = new AuthProviderApi(this.api);
  public readonly connection = new ConnectionApi(this.api);

  constructor() {}
}