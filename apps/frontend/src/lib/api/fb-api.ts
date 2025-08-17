import { StreamingPlatformApi } from "@/lib/api/resources/streaming-platform";
import { ProfileApi } from "@/lib/api/resources/profile";
import { getServerUri } from "@/lib/utils/index";
import axios from "axios";
import { LoginApi } from "@/lib/api/resources/login";
import { AuthProviderApi } from "@/lib/api/resources/auth-provider";
import { ConnectionApi } from "./resources/connection";
import { WorkflowsApi } from "./resources/workflows";
import { CommandsApi } from "./resources/commands";

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
  public readonly workflows = new WorkflowsApi(this.api);
  public readonly commands = new CommandsApi(this.api);
}
