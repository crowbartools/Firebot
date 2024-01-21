import { AxiosInstance } from "axios";
import { UserProfile} from "firebot-types"

export class UserProfileApi {
    constructor(private readonly api: AxiosInstance) {}

    async getUserProfiles(): Promise<UserProfile[]> {
        const response = await this.api.get<UserProfile[]>("/user-profile");
        return response.data;
    }

    async getActiveUserProfile(): Promise<UserProfile> {
        const response = await this.api.get<UserProfile>("/user-profile/active");
        return response.data;
    }
}