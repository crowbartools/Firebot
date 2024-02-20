import { AxiosInstance } from "axios";
import {
  FirebotAccountType,
  StreamingPlatformLoginSettings,
} from "firebot-types";

export class LoginApi {
  constructor(private readonly api: AxiosInstance) {}

  async getAllPlatformLogins(): Promise<StreamingPlatformLoginSettings> {
    const response =
      await this.api.get<StreamingPlatformLoginSettings>("/login/all");
    return response.data;
  }

  async createLoginForPlatform(platformId: string): Promise<void> {
    await this.api.post(`/login/${platformId}`);
  }

  async deleteLoginForPlatform(
    platformId: string,
    loginConfigId: string
  ): Promise<void> {
    await this.api.delete(`/login/${platformId}/${loginConfigId}`);
  }

  async deleteAccountForLoginForPlatform(
    platformId: string,
    loginConfigId: string,
    accountType: FirebotAccountType
  ): Promise<void> {
    await this.api.delete(
      `/login/${platformId}/${loginConfigId}/${accountType}`
    );
  }

  async setActiveLogin(
    platformId: string,
    loginConfigId: string
  ): Promise<boolean> {
    const response = await this.api.post(
      `/login/${platformId}/active`,
      undefined,
      {
        params: {
          loginConfigId,
        },
      }
    );
    return response.data;
  }
}