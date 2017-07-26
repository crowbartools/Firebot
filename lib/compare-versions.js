/*
* This compares two semvers and determines the type of update between them, if there is one
*
* Supported semvers:
* - 1.0.0
* - 1.0   (patch version is assumed as 0)
* - 1     (minor and patch are assumed as 0)
* 
* - Any leading "v"'s are ignored (ie v1.0.0 is valid)
* - Any variation can also have a prelease tag. They can be written as:
*     - 1.0.0-beta   (No version number after prerelaseTag is assumed as 1)
*     - 1.0.0-beta2
*     - 1.0.0-beta.3
*/
const semverRegex = /^v?(\d+)(?:[.](\d+))?(?:[.](\d+))?(?:-([a-z]*)[\W]?([\d]*))?$/i;

var UpdateType = {
  NONE: "none",
  PRERELEASE: "prerelease", // 1.0.0 -> 1.1.0-beta
  OFFICAL: "official", // 1.0.0-beta -> 1.0.0
  PATCH: "patch", // 1.0.0 -> 1.0.1
  MINOR: "minor", // 1.0.0 -> 1.1.0
  MAJOR: "major" // 1.0.0 -> 2.0.0
}

function validate(version) {
  if (typeof version !== 'string') {
      throw new TypeError('Invalid argument expected string');
  }
  if (!semverRegex.test(version)) {
      throw new Error('Invalid argument not valid semver');
  }
}

function parseVersion(version) {
  var elements = version.match(semverRegex);
  return {
    major: +elements[1],
    minor: elements[2] ? +elements[2] : 0,
    patch: elements[3] ? +elements[3] : 0,
    prerelaseTag: elements[4] ? elements[4] : "",
    prerelaseVersion: elements[5] ? +elements[5] : 1
  }
}

function compareVersions(newVersion, currentVersion) {
  [newVersion, currentVersion].forEach(validate);
  
  var updateType = UpdateType.NONE;
  
  var pNewVersion = parseVersion(newVersion);
  var pCurrentVersion = parseVersion(currentVersion);
  
  var majorsAreEqual = (pNewVersion.major === pCurrentVersion.major);
  var minorsAreEqual = (pNewVersion.minor === pCurrentVersion.minor);
  var patchesAreEqual = (pNewVersion.patch === pCurrentVersion.patch);
  
  // Check if the new version has a greater major version
  // x.0.0
  if(pNewVersion.major > pCurrentVersion.major) {
    updateType = UpdateType.MAJOR;
  }
  // then check the minor version
  // 1.x.0
  else if(majorsAreEqual && pNewVersion.minor > pCurrentVersion.minor) {
    updateType = UpdateType.MINOR;
  }
  // then check the patch(bugfix) version
  // 1.0.x
  else if(majorsAreEqual && minorsAreEqual && pNewVersion.patch > pCurrentVersion.patch) {
    updateType = UpdateType.PATCH;
  }
  
  // See if the new version is also a prelease
  if(pNewVersion.prerelaseTag !== "") {
    /*We consider an new version to be a prerelease update if one of the follow condiditions is met:
    * a) the new version has a greater major, minor, or patch version. IE: 1.0.0 -> 1.0.1-beta
    * b) the new version has the same major, minor, or patch version, but a greater prerelease version
    *    IE: 1.0.0-beta2 -> 1.0.0-beta3
    */
    
    // NOTE(ebiggz): Right now we just validate that both the old and new versions have prerelaseTags.
    // But if we ever decide to do alphas as well as betas, we will also want to order the old and new 
    // prerelaseTags alphabetically and validate that so 'alpha3' isnt considered an update to 'beta2'.
    if(updateType !== UpdateType.NONE || 
        (pCurrentVersion.prerelaseTag !== "" &&
          majorsAreEqual && 
          minorsAreEqual && 
          patchesAreEqual && 
          pNewVersion.prerelaseVersion > pCurrentVersion.prerelaseVersion)) {
          
      updateType = UpdateType.PRERELEASE;      
    }      
  }
  // If both versions are the same but the current version has a prelease tag and the new one doesn't,
  // we consider the new version an official release of the current.(IE 1.0.0-beta -> 1.0.0) 
  else if(majorsAreEqual && minorsAreEqual && patchesAreEqual && pCurrentVersion.prerelaseTag !== "") {
    updateType = UpdateType.OFFICIAL;
  }
  
  return updateType;
}

exports.UpdateType = UpdateType;
exports.compareVersions = compareVersions;