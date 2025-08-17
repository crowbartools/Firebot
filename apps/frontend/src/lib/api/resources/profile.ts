import { AxiosInstance } from "axios";
import { Profile} from "firebot-types"

export class ProfileApi {
  constructor(private readonly api: AxiosInstance) {}

  async getProfiles(): Promise<Profile[]> {
    const response = await this.api.get<Profile[]>("/profile");
    return response.data;
  }

  async getActiveProfile(): Promise<Profile> {
    const response = await this.api.get<Profile>("/profile/active");
    return response.data;
  }
}