
function GeneralPointConfig(pointCloudRootPath, arrayOfPointProfiles, imageName, pointCloudPath) {
    Validator.validateString(pointCloudRootPath);
    Validator.validateArray(arrayOfPointProfiles, function(item){Validator.validateInstance(item, PointProfile);});
    Validator.validateString(imageName);
    Validator.validateString(pointCloudPath);

    this.pointCloudRootPath = pointCloudRootPath;
    this.pointProfiles = arrayOfPointProfiles;
    this.imageName = imageName;
    this.pointCloudPath = pointCloudPath;
}
function PointProfile(generalPointConfig, name, position, z_rotation = 0) {
    Validator.validateInstance(generalPointConfig, GeneralPointConfig);
    Validator.validateString(name);
    Validator.validateInstance(position, THREE.Vector3);

    this.name = name;
    this.position = position;
    this.z_rotation = z_rotation;

    let fullRootPath = function () {
        return generalPointConfig.pointCloudRootPath + '/' + name;
    }

    this.fullPathToPointCloud = function() {
        return fullRootPath() + '/' + generalPointConfig.pointCloudPath;
    }

    this.fullPathToImage = function() {
        return fullRootPath() + '/' + generalPointConfig.imageName;
    }
}