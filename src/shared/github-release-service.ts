import axios from "axios";
import { determineUpdateType, UpdateType } from "./version-utils";
import { marked } from "marked";
import { sanitize } from "dompurify";

const FIREBOT_RELEASES_URL =
  "https://api.github.com/repos/crowbartools/Firebot/releases";

export type FirebotRelease = {
  name: string;
  date: string;
  version: string;
  releasePageUrl: string;
  patchNotes: string;
};

export type GetApplicableReleasesResponse = {
  patchUpdate?: FirebotRelease;
  minorUpdate?: FirebotRelease;
  prereleaseUpdate?: FirebotRelease;
  majorUpdate?: FirebotRelease;
  majorPrereleaseUpdate?: FirebotRelease;
};

export async function getApplicableReleases(
  currentVersion: string
): Promise<GetApplicableReleasesResponse> {
  const firebotReleases = await getFirebotReleases();

  const response = firebotReleases.reduce((response, release) => {
    const updateType = determineUpdateType(release.version, currentVersion);

    if ([UpdateType.None, UpdateType.Unknown].includes(updateType)) {
      return response;
    }

    if (!response.majorUpdate && !response.minorUpdate) {
      // this is true when current version is prerelease and the update is the same prerelease (major/minor/patch numbers are same)
      // we can consider it a patch (ie no need to give user option to postpone)
      if (updateType === UpdateType.PrereleaseUpdate) {
        response.patchUpdate = release;
        return response;
      }

      if (updateType === UpdateType.Patch) {
        response.patchUpdate = release;
        return response;
      }

      if (updateType === UpdateType.Minor) {
        response.minorUpdate = release;
        return response;
      }
    }

    if (updateType === UpdateType.Major && !response.majorUpdate) {
      response.majorUpdate = release;
      return response;
    }

    if (
      updateType === UpdateType.MajorPrerelease &&
      !response.majorPrereleaseUpdate
    ) {
      response.majorPrereleaseUpdate = release;
      return response;
    }

    if (updateType === UpdateType.Prerelease && !response.prereleaseUpdate) {
      response.prereleaseUpdate = release;
      return response;
    }

    return response;
  }, {} as GetApplicableReleasesResponse);

  return convertMarkdownToHtml(response);
}

async function getFirebotReleases(): Promise<FirebotRelease[]> {
  try {
    const releasesResponse = await axios.get<
      Array<{
        name: string;
        tag_name: string;
        published_at: string;
        html_url: string;
        body: string;
      }>
    >(FIREBOT_RELEASES_URL);
    return (
      releasesResponse.data?.map((r) => ({
        name: r.name,
        version: r.tag_name,
        date: r.published_at,
        patchNotes: r.body,
        releasePageUrl: r.html_url,
      })) ?? []
    );
  } catch {
    return [];
  }
}

function convertMarkdownToHtml(
  response: GetApplicableReleasesResponse
): GetApplicableReleasesResponse {
  return Object.entries(response ?? {}).reduce((response, [key, release]) => {
    response[key] = {
      ...release,
      patchNotes: sanitize(marked(release.patchNotes)),
    };
    return response;
  }, {} as GetApplicableReleasesResponse);
}
