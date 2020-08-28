
function GeneralPointConfig(pointCloudRootPath, arrayOfPointProfiles, imageName, pointCloudPath, cubeSidesPaths, cubeTexturesPath) {
    Validator.validateString(pointCloudRootPath);
    Validator.validateArray(arrayOfPointProfiles, function(item){Validator.validateInstance(item, PointProfile);});
    Validator.validateString(imageName);
    Validator.validateString(pointCloudPath);
    Validator.validateArray(cubeSidesPaths, Validator.validateString);
    Validator.validateString(cubeTexturesPath)

    this.pointCloudRootPath = pointCloudRootPath;
    this.pointProfiles = arrayOfPointProfiles;
    this.imageName = imageName;
    this.pointCloudPath = pointCloudPath;
    this.cubeSidesPaths = cubeSidesPaths;
    this.cubeTexturesPath = cubeTexturesPath;
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

    this.fullPathToCubeSides = function (lod) {
        Validator.validateString(lod);
        return generalPointConfig.cubeSidesPaths.map(function (localPath) {
            return fullRootPath() + '/' + generalPointConfig.cubeTexturesPath + '/' + lod + '/' + localPath;
        });
    }
}