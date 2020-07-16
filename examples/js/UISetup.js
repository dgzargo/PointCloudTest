
(function (){
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
            let createSphereMesh = function(geometryParams, material){
                let {radius, widthSegments, heightSegments} = geometryParams;
                let geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);//new THREE.IcosahedronBufferGeometry(500, 1);
                let sphere = new THREE.Mesh( geometry, material );
                return sphere;
            };
            let meshDictionary = {};
            config.pointProfiles.forEach(function (pointProfile) {
                let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );
                /*let lod = new THREE.LOD();
                    lod.autoUpdate = true;
                    lod.addLevel(createSphereMesh({radius:0.3, widthSegments:12, heightSegments:10}, material), 2);
                    lod.addLevel(createSphereMesh({radius:0.3, widthSegments:30, heightSegments:20}, material), 0.5);
                    lod.position.copy(pointProfile.position);
                    viewer.scene.scene.add(lod);*/
                let object3d = createSphereMesh({radius: 0.3, widthSegments: 12, heightSegments: 10}, material);
                object3d.position.copy(pointProfile.position);
                viewer.scene.scene.add(object3d);
                meshDictionary[object3d.uuid] = {pointProfile, object3d};
            })
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
            var geometry = new THREE.SphereGeometry( 500, 60, 40);
            geometry.scale( - 1, 1, 1 );
            geometry.rotateX(Math.PI/2);
            geometry.rotateZ(pointProfile.z_rotation);


            var texture = new THREE.TextureLoader().load( pointProfile.fullPathToImage() );
            var material = new THREE.MeshBasicMaterial( { map: texture } );

            let sphere = new THREE.Mesh( geometry, material );
            sphere.position.copy(pointProfile.position);

            viewer.scene.scene.add( sphere );
        }
    } // add scene elements
    {
        function setupPotreeUI(viewer) {
            viewer.loadGUI(() => {
                $('#potree_sidebar_container').hide();
                $('#potree_render_area>img').hide();
            });
        }
        function setupCustomUI(viewer) {
            {
                $('#pointBudgetSlider').slider({
                    value: viewer.getPointBudget(),
                    min: 100*1000,
                    max: 10*1000*1000,
                    step: 1000,
                    slide: function( event, ui ) {viewer.setPointBudget(ui.value);}
                });
                viewer.addEventListener('point_budget_changed', function(event){
                    $( '#pointBudgetTitle>span:last-child')[0].textContent = Potree.utils.addCommas(viewer.getPointBudget());
                    $('#pointBudgetSlider').slider({value: viewer.getPointBudget()});
                });
                viewer.dispatchEvent({'type': 'point_budget_changed'});
            }//PointBudget slider
            {
                $('#pointCloudVisibilityControl>label>input').change(function() {
                    let visible = this.checked;
                    viewer.scene.pointclouds[0].material.visible = visible;
                });
            }//pointCloud visibility control
            {
                jQuery.fn.init.prototype.showHide = function (show){
                    if(show){
                        this.show();
                    } else {
                        this.hide();
                    }
                }
                $('#potreeUIVisibilityControl>label>input').change(function() {
                    let visible = this.checked;
                    $('#potree_render_area').css("left", "0px");
                    $('#potree_sidebar_container').showHide(visible);
                    $('#potree_render_area>img').showHide(visible);
                });
            }//potree UI visibility control
            {
                let showHideButton = $('#showHideButton').button({
                    icon: 'ui-icon-caret-1-n'
                }).click(function () {
                    let menu = $('#menu');
                    menu.toggleClass('hide');
                    let isHidden = menu.hasClass('hide');
                    showHideButton.button("option", "icon", 'ui-icon-caret-1-'+ (isHidden? 's' : 'n'));
                })
                showHideButton.click();
            }//custom UI toggle
            {
                $('#rightDownPanel').dialog({position:{my: "right bottom", at: "right bottom", of: window }});
            }//debug dialog box
        }
        function addTouchEventsReflection(viewer) {
            viewer.renderer.domElement.addEventListener('touchstart', function (e) {
                if (e.touches.length !== 1) return;
                let touch = e.touches[0];
                // viewer.inputHandler.onMouseMove({clientX: touch.pageX, clientY: touch.pageY, preventDefault:function(){}});
                let event = new Event('mousemove')
                event.clientX = touch.pageX;
                event.clientY = touch.pageY;
                viewer.renderer.domElement.dispatchEvent(event);
            });

            /*viewer.renderer.domElement.addEventListener('touchend', function (e) {
                if (!touch) return;
                if (e.touches.length !== 0 && e.changedTouches.length !== 1) return;
                if (e.changedTouches[0].pageX === touch.pageX && e.changedTouches[0].pageY === touch.pageY){
                    $('#textOutput>p:first-child').text('x: ' + touch.pageX);
                    $('#textOutput>p:last-child').text('y: ' + touch.pageY);
                    // viewer.inputHandler.onMouseUp({button: THREE.MOUSE.LEFT, preventDefault:function(){}});
                    // viewer.measuringTool.insertionCallback({button:THREE.MOUSE.LEFT});
                    // viewer.inputHandler.onMouseMove({clientX: e.changedTouches[0].pageX, clientY: e.changedTouches[0].pageY, preventDefault:function(){}});
                    let event = new Event('mouseup');
                    event.clientX = touch.pageX;
                    event.clientY = touch.pageY;
                    event.button = THREE.MOUSE.LEFT;
                    viewer.renderer.domElement.dispatchEvent(event);
                }
            });//*/
            this.addEventListener('ClickNoMove', function (e) {
                let position = e.position;
                $('#textOutput>p:first-child').text('x: ' + position.x);
                $('#textOutput>p:last-child').text('y: ' + position.y);

                let event = new Event('mouseup'); // new MouseEvent('mouseup', {clientX:position.x,clientY:position.y,button: THREE.MOUSE.LEFT});
                event.clientX = position.x;
                event.clientY = position.y;
                event.button = THREE.MOUSE.LEFT;
                viewer.renderer.domElement.dispatchEvent(event);
            });//*/
        }
    } // UI setup
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
                    if (selectProfileCallback && typeof selectProfileCallback === 'function') selectProfileCallback(pointProfile);
                    return pointProfile;
                }

            }
        }
        function setupViewer(){
            let viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

            viewer.setEDLEnabled(true);
            viewer.setPointBudget(500*1000);
            viewer.loadSettingsFromURL();

            return viewer;
        }
        function subscribeAndDispatchEvents(viewer, subscriber) {
            let domElement = viewer.renderer.domElement;
            {
                let touchPosition = null;
                domElement.addEventListener('touchstart', function (e) {
                    if (e.touches.length !== 1) touchPosition = null;
                    let touch = e.touches[0];
                    touchPosition = new THREE.Vector2(touch.pageX, touch.pageY);
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
                    if (e.pageX === mouse.x && e.pageY === mouse.y){
                        subscriber.dispatchEvent({
                            type: 'ClickNoMove',
                            position: mouse
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
    } // general

    let profileLoaded = false;
    let meshDictionary = {};

    function PageControl(pointConfig) {
        let viewer = setupViewer();
        setupPotreeUI(viewer);
        //viewer.inputHandler.logMessages = true;
        setupCustomUI(viewer);
        addTouchEventsReflection.call(this, viewer);
        subscribeAndDispatchEvents(viewer, this);


        this.addEventListener('ClickNoMove', onDocumentMouseDown(viewer, meshDictionary, this.setProfile.bind(this)));

        let mouseMoveEventListener = onDocumentMouseDown(viewer, meshDictionary);
        this.addEventListener('mousemove', function (event) {
            let profile = mouseMoveEventListener(event);
            viewer.renderer.domElement.style.cursor = (profile !== undefined) ? 'pointer' : 'default';
        });

        Object.defineProperties(this, {
            pointConfig: { value: pointConfig },
            viewer: { value: viewer }
        });
    }

    PageControl.prototype = Object.assign(Object.create(THREE.EventDispatcher.prototype), {
        constructor: PageControl,
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
                exchangeDictionary(meshDictionary, addOtherPoints(this.viewer, config));
                add360Image(this.viewer, pointProfile);
                addPointCloud(pointProfile);
                this.viewer.scene.view.position = pointProfile.position;
            }
            profileLoaded = true;
        },
        setProfileByIndex: function (profileIndex) {
            Validator.validateNumber(profileIndex);
            if (profileIndex >= this.pointConfig.pointProfiles.length) throw 'index out of range of array';
            let pointProfile = config.pointProfiles[profileIndex];
            this.setProfile(pointProfile);
        },
        setProfileByMesh: function (mesh) {
            if (!meshDictionary) return;
            let {pointProfile} = meshDictionary[mesh];
            if (!pointProfile) return;
            this.setProfile(pointProfile);
        }
    });

    window.getImageType = getImageType;
    window.PageControl = PageControl;
})();
