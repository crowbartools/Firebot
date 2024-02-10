import axios from "axios";

type TwitchHelixUser = {
  id: string;
  login: string;
  display_name: string;
  profile_image_url: string;
};

export async function getUserCurrent(
  accessToken: string,
  clientId: string
): Promise<TwitchHelixUser | null> {
  try {
    const response = await axios.get<{ data: TwitchHelixUser[] }>(
      "https://api.twitch.tv/helix/users",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": "Firebot v5",
          "Client-ID": clientId,
        },
        responseType: "json",
      }
    );

    if (response.status >= 200 && response.status <= 204) {
      const userData = response.data;
      if (userData.data && userData.data.length > 0) {
        return userData.data[0];
      }
    }
  } catch (error) {
    console.error("Error getting current twitch user", error);
  }
  return null;
}
