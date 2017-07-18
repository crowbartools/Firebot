const semverRegex = /^v?(\d+)(?:[.](\d+))?(?:[.](\d+))?(?:-([\S]*))?$/i;

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
    major: elements[1] +elements[1],
    minor: elements[2] ? +elements[2] : 0,
    patch: elements[3] ? +elements[3] : 0,
    tag: elements[4]
  }
}

function compareVersions(newVersion, currentVersion) {
  [newVersion, currentVersion].forEach(validate);
  
  var isUpdate = true;
  var updateType;
  
  var pNewVersion = parseVersion(newVersion);
  var pCurrentVersion = parseVersion(currentVersion);
  
  var majorsAreEqual = (pNewVersion.major === pCurrentVersion.major);
  var minorsAreEqual = (pNewVersion.minor === pCurrentVersion.minor);
  var patchesAreEqual = (pNewVersion.patch === pCurrentVersion.patch);
  
  if(pNewVersion.major > pCurrentVersion.major) {
    updateType = "major"
  }
  else if(majorsAreEqual && pNewVersion.minor > pCurrentVersion.minor) {
    updateType = "minor"
  }
  else if(majorsAreEqual && minorsAreEqual && pNewVersion.patch > pCurrentVersion.patch) {
    updateType = "patch"
  }
  else if(majorsAreEqual && minorsAreEqual && patchesAreEqual && pNewVersion.tag !== pCurrentVersion.tag) {
    updateType = "prerelease"
  }
  else {
    isUpdate = false;
    updateType = "none";
  }
  
  return {
    isUpdate: isUpdate,
    type: updateType
  }
}

exports.compareVersions = compareVersions;