
function GeneralPointConfig(pointCloudRootPath, arrayOfPointProfiles, pointCloudPath, cubeSidesPaths, cubeTexturesPath) {
    Validator.validateString(pointCloudRootPath);
    Validator.validateArray(arrayOfPointProfiles, function(item){Validator.validateInstance(item, PointProfile);});
    Validator.validateString(pointCloudPath);
    Validator.validateArray(cubeSidesPaths, Validator.validateString);
    Validator.validateString(cubeTexturesPath)

    this.pointCloudRootPath = pointCloudRootPath;
    this.pointProfiles = arrayOfPointProfiles;
    this.pointCloudPath = pointCloudPath;
    this.cubeSidesPaths = cubeSidesPaths;
    this.cubeTexturesPath = cubeTexturesPath;
}
function PointProfile(generalPointConfig, name, position, euler360rotation) {
    Validator.validateInstance(generalPointConfig, GeneralPointConfig);
    Validator.validateString(name);
    Validator.validateInstance(position, THREE.Vector3);
    Validator.validateInstance(euler360rotation, THREE.Euler);

    this.name = name;
    this.position = position;
    this.rotation = euler360rotation;

    euler360rotation.setFromVector3(euler360rotation.toVector3().multiplyScalar(Math.PI).divideScalar(180));

    let fullRootPath = function () {
        return generalPointConfig.pointCloudRootPath + '/' + name;
    }

    this.fullPathToPointCloud = function() {
        return fullRootPath() + '/' + generalPointConfig.pointCloudPath;
    }

    this.fullPathToCubeSides = function (lod) {
        Validator.validateString(lod);
        return generalPointConfig.cubeSidesPaths.map(function (localPath) {
            return fullRootPath() + '/' + generalPointConfig.cubeTexturesPath + '/' + lod + '/' + localPath;
        });
    }

    this.belongsToLayer = function (layerInfo) {
        if (layerInfo.layer === '?' && layerInfo.sub === '?') return true;
        const actualLayerInfo = this.getLayerInfo();
        return actualLayerInfo.layer === layerInfo.layer && actualLayerInfo.sub === layerInfo.sub;
    }

    this.getLayerInfo = function () {
        const z = this.position.z;

        if (z === 27.224 || z === 27.229) return { layer: '_', sub: '_' }; // for Conoco points
        console.info('Conoco specific code here!');

        if (z < 27) {
            return { layer: 'level_22.8', sub: '_' };
        }
        if (z < 35) {
            return { layer: 'level_27.8', sub: z < 32.7 ? 'sub_0' : 'sub_1' };
        }
        if (z < 45) {
            return { layer: 'level_37.8', sub: '_' };
        }
        if (z < 57) {
            return { layer: 'level_47.8', sub: z < 52.7 ? 'sub_0' : 'sub_1' };
        }
        return { layer: 'level_58.0', sub: z < 60 ? 'sub_0' : 'sub_1' };
    }
}