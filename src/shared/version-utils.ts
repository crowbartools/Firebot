import { compareVersions, validate } from "compare-versions";

export enum UpdateType {
  Unknown,
  None,

  /** 1.0.0 -> 1.1.0-beta.1 */
  Prerelease,

  /** 1.1.0-beta.1 -> 1.1.0-beta.2 */
  PrereleaseUpdate,

  /** 1.1.0-beta.1 -> 1.1.0 */
  Official,

  /** 1.0.0 -> 1.0.1 */
  Patch,

  /** 1.0.0 -> 1.1.0 */
  Minor,

  /** 1.0.0 -> 2.0.0 */
  Major,

  /** 1.0.0 -> 2.0.0-beta */
  MajorPrerelease,
}

export function determineUpdateType(
  nextVersion: string,
  currentVersion: string
): UpdateType {
  const versionsValid = [nextVersion, currentVersion].every(validate);
  if (!versionsValid) {
    return UpdateType.Unknown;
  }

  const isUpdate = compareVersions(nextVersion, currentVersion) > 0;

  if (!isUpdate) {
    return UpdateType.None;
  }

  const nextSemVer = new SemanticVersion(nextVersion);
  const currentSemVer = new SemanticVersion(currentVersion);

  const isMajorUpdate = nextSemVer.major > currentSemVer.major;
  const isMinorUpdate = nextSemVer.minor > currentSemVer.minor;
  const isPatchUpdate = nextSemVer.patch > currentSemVer.patch;

  const currentIsPrerelease = currentVersion.includes("-");
  const nextIsPrerelease = nextVersion.includes("-");

  if (isMajorUpdate) {
    return nextIsPrerelease ? UpdateType.MajorPrerelease : UpdateType.Major;
  }

  if (currentIsPrerelease && !nextIsPrerelease) {
    return UpdateType.Official;
  }

  if (nextIsPrerelease && (isMinorUpdate || isPatchUpdate)) {
    return UpdateType.Prerelease;
  }

  if (isMinorUpdate) {
    return UpdateType.Minor;
  }

  if (isPatchUpdate) {
    return UpdateType.Patch;
  }

  if (currentIsPrerelease && nextIsPrerelease) {
    return UpdateType.PrereleaseUpdate;
  }

  return UpdateType.Unknown;
}

class SemanticVersion {
  private semverRegex =
    /^[v^~<>=]*?(\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+)(?:\.([x*]|\d+))?(?:-([\da-z\-]+(?:\.[\da-z\-]+)*))?(?:\+[\da-z\-]+(?:\.[\da-z\-]+)*)?)?)?$/i;

  public readonly major: number;
  public readonly minor: number;
  public readonly patch: number;
  public readonly prerelease: string | undefined;

  constructor(public readonly rawVersion: string) {
    const result = rawVersion.match(this.semverRegex);
    this.major = parseInt(result[1] ?? "0");
    this.minor = parseInt(result[2] ?? "0");
    this.patch = parseInt(result[3] ?? "0");
    this.prerelease = result[5];
  }
}
