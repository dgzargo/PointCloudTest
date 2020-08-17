
(function (){
    {
        var colorMap = { default: 0xeeff00, selected: 0x0032c8 }
        var pointCloudNameQueryParamName = 'pointCloudName';
    } // constants
    {
        function getImageType() {
            let imgtype = Potree.utils.getParameterByName('imagetype');
            if (!imgtype) imgtype = canUseWebP() ? 'webp' : 'jpg';
            return imgtype;
        }
        function canUseWebP() {
            var elem = document.createElement('canvas');

            if (!!(elem.getContext && elem.getContext('2d'))) {
                // was able or not to get WebP representation
                return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0;
            }

            // very old browser like IE 8, canvas not supported
            return false;
        }
    } // image type utils
    {
        function addOtherPoints(viewer, config){
            let meshDictionary = {};
            let createSphereMesh = function(geometryParams, material){
                let {radius, widthSegments, heightSegments} = geometryParams;
                let geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);//new THREE.IcosahedronBufferGeometry(500, 1);
                return new THREE.Mesh(geometry, material);
            };
            config.pointProfiles.forEach(function (pointProfile) {
                let material = new THREE.MeshBasicMaterial( {color: colorMap.default} );
                // let lod = new THREE.LOD();
                //     lod.autoUpdate = true;
                //     lod.addLevel(createSphereMesh({radius:0.3, widthSegments:12, heightSegments:10}, material), 2);
                //     lod.addLevel(createSphereMesh({radius:0.3, widthSegments:30, heightSegments:20}, material), 0.5);
                //     lod.position.copy(pointProfile.position);
                //     viewer.scene.scene.add(lod);
                let object3d = createSphereMesh({radius: 0.15, widthSegments: 12, heightSegments: 10}, material);
                object3d.position.copy(pointProfile.position);
                viewer.scene.scene.add(object3d);
                meshDictionary[object3d.uuid] = {pointProfile, object3d};
            });//*/
            /*{
                config.pointProfiles.forEach(function (pointProfile){
                    const map = new THREE.TextureLoader().load( "pin-48.svg" );
                    const material = new THREE.SpriteMaterial( { map: map, color: 0xffffff } );
                    const sprite = new THREE.Sprite( material );
                    sprite.scale.set(0.5,0.5,1);
                    sprite.position.copy(pointProfile.position);
                    this.viewer.scene.scene.add( sprite );
                    meshDictionary[sprite.uuid] = {pointProfile, object3d: sprite};
                }, this);
            } // add point of interest as image //*/
            return meshDictionary;
        }
        function addPointCloud(pointProfile) {
            Potree.loadPointCloud(pointProfile.fullPathToPointCloud(), pointProfile.name, e => {
                if (e.type !== 'pointcloud_loaded') return;

                let scene = viewer.scene;
                let pointcloud = e.pointcloud;

                let material = pointcloud.material;
                material.size = 0.1;
                material.pointSizeType = Potree.PointSizeType.ADAPTIVE;
                material.shape = Potree.PointShape.SQUARE;
                material.visible = false;

                scene.addPointCloud(pointcloud);
            });
        }
        function add360Image(viewer, pointProfile) {
            /*let geometry = new THREE.SphereGeometry( 100, 60, 40);
            geometry.scale( - 1, 1, 1 );
            geometry.rotateX(Math.PI/2);
            geometry.rotateZ(pointProfile.z_rotation);


            let texture = new THREE.TextureLoader().load( pointProfile.fullPathToImage() );
            let material = new THREE.MeshBasicMaterial( { map: texture } );

            let sphere = new THREE.Mesh( geometry, material );
            sphere.position.copy(pointProfile.position);

            viewer.scene.scene.add( sphere );

            return sphere;//*/
            const geometry = new THREE.CubeGeometry(500,500,500);
            geometry.scale( - 1, 1, 1 );
            geometry.rotateX(Math.PI/2);
            geometry.rotateZ(pointProfile.z_rotation);
            const cubeMaterials = pointProfile.fullPathToCubeSides().map(function (path) {
                return new THREE.MeshBasicMaterial({map: new THREE.TextureLoader().load(path), side: THREE.DoubleSide});
            });
            const cubeMaterial = new THREE.MeshFaceMaterial(cubeMaterials);
            const cube = new THREE.Mesh(geometry, cubeMaterial);
            cube.position.copy(pointProfile.position);
            viewer.scene.scene.add(cube);
            return cube;
        }
    } // add scene elements
    {
        function addTouchEventsReflection(viewer) {
            {
                this.addEventListener('touchstart', function (e) {
                    e = e.event;
                    if (e.touches.length !== 1) return;
                    let touch = e.touches[0];
                    let event = new MouseEvent('mousemove', {
                        clientX: touch.pageX,
                        clientY: touch.pageY
                    });
                    viewer.renderer.domElement.dispatchEvent(event);
                })
                this.addEventListener('ClickNoMove', function (e) {
                    if (e.skipMouseUpEvent) return;
                    let position = e.position;
                    let event = new MouseEvent('mouseup', {
                        clientX: position.x,
                        clientY: position.y,
                        button: THREE.MOUSE.LEFT
                    });
                    event.fake = true;
                    viewer.renderer.domElement.dispatchEvent(event);
                });
            }
            {
                this.addEventListener('ClickNoMove', onDocumentMouseDown(viewer, meshDictionary, function (uuid) {
                    this.viewer.scene.removeAllMeasurements();
                    this.setProfileByMeshUuid(uuid);
                }.bind(this)));

                let mouseMoveEventListener = onDocumentMouseDown(viewer, meshDictionary);
                this.addEventListener('mousemove', function (event) {
                    let uuid = mouseMoveEventListener(event);
                    viewer.renderer.domElement.style.cursor = uuid ? 'pointer' : 'default';
                    Object.values(meshDictionary).map(function (o) { return o.object3d; }).forEach(function (mesh) {
                        mesh.material.color.set(colorMap.default);
                    })
                    if (uuid) {
                        let selectedMesh = meshDictionary[uuid].object3d;
                        selectedMesh.material.color.set(colorMap.selected);
                    }
                });
            }
        }
        function subscribeAndDispatchEvents(viewer) {
            let domElement = viewer.renderer.domElement;
            let subscriber = this;
            {
                let touchPosition = null;
                domElement.addEventListener('touchstart', function (e) {
                    if (e.touches.length !== 1) touchPosition = null;
                    let touch = e.touches[0];
                    touchPosition = new THREE.Vector2(touch.pageX, touch.pageY);

                    subscriber.dispatchEvent({
                        type: 'touchstart',
                        event: e
                    });
                });

                domElement.addEventListener('touchend', function (e) {
                    if (!touchPosition) return;
                    //if (e.touches.length !== 0 && e.changedTouches.length !== 1) return;
                    let changedTouch = e.changedTouches[0];
                    let changedPosition = new THREE.Vector2(changedTouch.pageX, changedTouch.pageY);
                    if (changedPosition.equals(touchPosition)){
                        subscriber.dispatchEvent({
                            type: 'ClickNoMove',
                            position: touchPosition
                        });
                    }
                });

                domElement.addEventListener('touchmove', function (e) {
                    if (!touchPosition) return;
                    let changedTouch = e.changedTouches[0];
                    let changedPosition = new THREE.Vector2(changedTouch.pageX, changedTouch.pageY);
                    if (!changedPosition.equals(touchPosition)) touchPosition = null;
                });
            } // touch events handling
            {
                let mouse = null;
                domElement.addEventListener('mousedown', function (e) {
                    if (e.button !== 0) return;
                    mouse = new THREE.Vector2(e.pageX, e.pageY);
                });

                domElement.addEventListener('mouseup', function (e) {
                    if (!mouse) return;
                    if (!e.fake && e.pageX === mouse.x && e.pageY === mouse.y){
                        subscriber.dispatchEvent({
                            type: 'ClickNoMove',
                            position: mouse,
                            skipMouseUpEvent: true
                        });
                    }
                    mouse = null;
                });

                domElement.addEventListener('mousemove', function (e) {
                    let changedPosition = new THREE.Vector2(e.pageX, e.pageY);
                    if (mouse && !changedPosition.equals(mouse)) {
                        mouse = null;
                    }
                    subscriber.dispatchEvent({
                        type: 'mousemove',
                        position: changedPosition
                    });
                });
            } // mouse events handling
        }
    } // events setup
    {
        function rollbackUI(viewer) {
            let scene = new Potree.Scene(viewer.renderer);
            viewer.setScene(scene);
        }
        function onDocumentMouseDown(viewer, objectsMap, selectProfileCallback) {
            let domElement = viewer.renderer.domElement;

            let raycaster = new THREE.Raycaster();

            let normalizedPosition = function (vector) {
                let normalizedPosition = new THREE.Vector2();
                normalizedPosition.copy(vector);

                normalizedPosition.x /= domElement.clientWidth;
                normalizedPosition.y /= domElement.clientHeight;

                normalizedPosition.multiplyScalar(2);

                normalizedPosition.subScalar(1);

                normalizedPosition.y *= -1;

                return normalizedPosition;
            }

            return function ( event ) {
                let camera = viewer.scene.camera;

                let normalized = normalizedPosition(event.position);
                raycaster.setFromCamera(normalized , camera );

                let Objects = Object.values(objectsMap).map(o=>o.object3d);
                let intersects = raycaster.intersectObjects(Objects);

                if ( intersects.length > 0 ) {

                    let object = intersects[0].object;
                    let {pointProfile} = objectsMap[object.uuid];
                    if (pointProfile && selectProfileCallback && typeof selectProfileCallback === 'function') selectProfileCallback(object.uuid);
                    return object.uuid;
                }

            }
        }
        function setupViewer(){
            let viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

            viewer.setEDLEnabled(true);
            viewer.setPointBudget(500*1000);
            viewer.loadSettingsFromURL();
            viewer.setEDLEnabled(false);

            return viewer;
        }
    } // general

    let profileLoaded = false;
    let meshDictionary = {};

    function SceneControl(pointConfig) {
        let viewer = setupViewer();
        //viewer.inputHandler.logMessages = true;
        addTouchEventsReflection.call(this, viewer);
        subscribeAndDispatchEvents.call(this, viewer);
        viewer.scene.scene.remove(viewer.scene.scene.children[0]); // remove weird mesh next to (0,0,0)

        Object.defineProperties(this, {
            pointConfig: { value: pointConfig, enumerable: true },
            viewer: { value: viewer, enumerable: true },
        });
    }

    SceneControl.prototype = Object.defineProperties(Object.assign(Object.create(THREE.EventDispatcher.prototype), {
        constructor: SceneControl,
        setProfile: function (pointProfile) {
            Validator.validateInstance(pointProfile, PointProfile);

            if (profileLoaded) rollbackUI(this.viewer);
            {
                let config = this.pointConfig;

                let exchangeDictionary = function(base, donor){
                    Object.keys(base).forEach(function (key) {
                        delete base[key];
                    })
                    Object.entries(donor).forEach(function (entry) {
                        base[entry[0]] = entry[1];
                    })
                };
                exchangeDictionary(meshDictionary, addOtherPoints.call(this, this.viewer, config));
                this.currentSphereMesh = add360Image(this.viewer, pointProfile);
                addPointCloud(pointProfile);
                this.viewer.scene.view.position = pointProfile.position;
            }
            profileLoaded = true;
            Potree.utils.setParameter(pointCloudNameQueryParamName, pointProfile.name);
        },
        setProfileByIndex: function (profileIndex) {
            Validator.validateNumber(profileIndex);
            if (profileIndex >= this.pointConfig.pointProfiles.length) throw 'index out of range of array';
            let pointProfile = config.pointProfiles[profileIndex];
            this.setProfile(pointProfile);
        },
        setProfileByMeshUuid: function (uuid) {
            if (!meshDictionary) return;
            let {pointProfile} = meshDictionary[uuid];
            if (!pointProfile) return;
            this.setProfile(pointProfile);
        },
        getProfileByQuery: function(){
            let pointCloudName = Potree.utils.getParameterByName(pointCloudNameQueryParamName);
            if (pointCloudName && pointCloudName.length > 0) {
                for(const profile of this.pointConfig.pointProfiles){
                    if (profile.name === pointCloudName){
                        return profile;
                    }
                }
            }
            return null;
        },
        pointCloudSetVisible: function(visibility){
            viewer.scene.pointclouds.forEach(function (pointCloud) {
                pointCloud.material.visible = visibility;
            });
        },
    }), {
        pointBudget: {
            get: function() {
                return this.viewer.getPointBudget();
            },
            set: function(pb) {
                this.viewer.setPointBudget(pb);
            }
        },
        sphereRange: {
            get: function() {
                let geometry = this.currentSphereMesh.geometry;
                geometry.computeBoundingSphere();
                return geometry.boundingSphere.radius;
            },
            set: function(v) {
                let sphere = this.currentSphereMesh.geometry;
                let currentRadius = sphere.boundingSphere.radius;
                currentRadius = 1 / currentRadius;
                sphere.scale(currentRadius, currentRadius, currentRadius);
                sphere.scale(v, v, v);
            }
        },
        currentSphereMesh: { value: null, writable: true, enumerable: true },
    });

    function UIControl(sceneControl){
        Validator.validateInstance(sceneControl, SceneControl);
        Object.defineProperties(this, {
            sceneControl: { value: sceneControl }
        });
        this.pointBudgetSliderSetup();
        this.pointCloudVisibilityControlSetup();
        jQuery.fn.init.prototype.showHide = function (show){
            if(show){
                this.show();
            } else {
                this.hide();
            }
        }
        this.potreeUIVisibilityControlSetup();
        this.customUIToggleSetup();
        //this.debugDialogBoxSetup();
        this.potreeUISetup();
        this.sphereVisibilityControlSetup();
        this.spheresVisibilityRangeSliderSetup();
    }
    UIControl.prototype = Object.assign(Object.create(Object.prototype), {
        constructor: UIControl,
        pointBudgetSliderSetup: function(){
            $('#pointBudgetSlider').slider({
                value: this.sceneControl.pointBudget,
                min: 100*1000,
                max: 10*1000*1000,
                step: 1000,
                slide: function( event, ui ) { this.sceneControl.pointBudget = ui.value; }.bind(this)
            });
            $('#pointBudgetTitle>span:first-child')[0].textContent = 'Point Budget:';
            this.sceneControl.viewer.addEventListener('point_budget_changed', function(){
                $('#pointBudgetTitle>span:last-child')[0].textContent = Potree.utils.addCommas(this.sceneControl.pointBudget);
                $('#pointBudgetSlider').slider({ value: this.sceneControl.pointBudget });
            }.bind(this));
            this.sceneControl.viewer.dispatchEvent({'type': 'point_budget_changed'});
        },
        pointCloudVisibilityControlSetup: function () {
            let uIControlContext = this;
            $('#pointCloudVisibilityControl>label>input').change(function() {
                uIControlContext.sceneControl.pointCloudSetVisible(this.checked);
            });
        },
        potreeUIVisibilityControlSetup: function () {
            $('#potreeUIVisibilityControl>label>input').change(function() {
                let visible = this.checked;
                $('#potree_render_area').css("left", "0px");
                $('#potree_sidebar_container').showHide(visible);
                $('#potree_render_area>img').showHide(visible);
            });
        },
        customUIToggleSetup: function () {
            let showHideButton = $('#showHideButton').button({
                icon: 'ui-icon-caret-1-n'
            }).click(function () {
                let menu = $('#menu');
                menu.toggleClass('hide');
                let isHidden = menu.hasClass('hide');
                showHideButton.button("option", "icon", 'ui-icon-caret-1-'+ (isHidden? 's' : 'n'));
            })
            showHideButton.click();
        },
        /*debugDialogBoxSetup: function () {
            $('#rightDownPanel').dialog({position:{my: "left bottom", at: "left bottom", of: window }});

            this.sceneControl.addEventListener('ClickNoMove', function (e) {
                let position = e.position;
                $('#textOutput>p:first-child').text('x: ' + position.x);
                $('#textOutput>p:last-child').text('y: ' + position.y);
            });
        },//*/
        potreeUISetup: function () {
            this.sceneControl.viewer.loadGUI(() => {
                $('#potree_sidebar_container').hide();
                $('#potree_render_area>img').hide();
            });
        },
        sphereVisibilityControlSetup: function () {
            $('#sphereVisibilityControl>label>input').change(function() {
                let visible = this.checked;
                Object.values(meshDictionary).map(function (o) { return o.object3d; }).forEach(function (mesh) {
                    mesh.visible = visible;
                })
            });
        },
        spheresVisibilityRangeSliderSetup: function () {
            let sceneControl = this.sceneControl;
            let rangeDisplayingSpan = $('#sphereRangeRadiusControl>p>span:last-child');
            let displayRange = function(range){
                rangeDisplayingSpan.text(range);
            };
            $('#sphereRangeSlider').slider({
                value: sceneControl.sphereRange,
                min: 0.5,
                max: 150,
                step: 0.1,
                slide: function( event, ui ) { sceneControl.sphereRange = ui.value; displayRange(ui.value); }
            });
            displayRange(sceneControl.sphereRange.toFixed(0));
        }
    });

    window.getImageType = getImageType;
    window.SceneControl = SceneControl;
    window.UIControl = UIControl;
})();
