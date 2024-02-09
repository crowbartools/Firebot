import { AxiosInstance } from "axios";
import { Profile, type FirebotAccountType} from "firebot-types"

interface DeviceCodeResponse {
    code: string;
    verificationUri: string;
}

export class AuthProviderApi {
  constructor(private readonly api: AxiosInstance) {}

  async startDeviceFlow(
    streamingPlatformId: string,
    loginConfigId: string,
    accountType: FirebotAccountType
  ): Promise<DeviceCodeResponse | null> {
    const response = await this.api.post<DeviceCodeResponse>(
      "/auth-provider/device-flow",
      undefined,
      {
        params: {
          streamingPlatformId,
          loginConfigId,
          accountType,
        },
      }
    );
    return response.data;
  }

  async getActiveProfile(): Promise<Profile> {
    const response = await this.api.get<Profile>("/profile/active");
    return response.data;
  }
}