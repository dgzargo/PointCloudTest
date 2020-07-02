class SphereControl extends THREE.EventDispatcher {
    constructor(camera, domElement){
        super();
        this.domElement = domElement ? domElement : document;
        this.camera = camera;
        camera.target = new THREE.Vector3( 0, 0, 0 );

        this.isUserInteracting = false;
        this.onMouseDownMouseX = 0;
        this.onMouseDownMouseY = 0;
        this.lon = 0;
        this.onMouseDownLon = 0;
        this.lat = 0;
        this.onMouseDownLat = 0;

        /*domElement.addEventListener( 'mousedown', onPointerStart, false );
        domElement.addEventListener( 'mousemove', onPointerMove, false );
        domElement.addEventListener( 'mouseup', onPointerUp, false );

        domElement.addEventListener( 'wheel', onDocumentMouseWheel, false );

        domElement.addEventListener( 'touchstart', onPointerStart, false );
        domElement.addEventListener( 'touchmove', onPointerMove, false );
        domElement.addEventListener( 'touchend', onPointerUp, false );//*/
    }


    onPointerStart( event ) {
        this.isUserInteracting = true;

        var clientX = event.clientX || event.touches[ 0 ].clientX;
        var clientY = event.clientY || event.touches[ 0 ].clientY;

        this.onMouseDownMouseX = clientX;
        this.onMouseDownMouseY = clientY;

        this.onMouseDownLon = lon;
        this.onMouseDownLat = lat;
    }

    onPointerMove( event ) {
        if ( isUserInteracting === true ) {

            var clientX = event.clientX || event.touches[ 0 ].clientX;
            var clientY = event.clientY || event.touches[ 0 ].clientY;

            this.lon = ( onMouseDownMouseX - clientX ) * 0.1 + onMouseDownLon;
            this.lat = ( clientY - onMouseDownMouseY ) * 0.1 + onMouseDownLat;

        }
    }

    onPointerUp() {
        this.isUserInteracting = false;
    }

    onDocumentMouseWheel( event ) {
        var fov = camera.fov + event.deltaY * 0.05;

        camera.fov = THREE.Math.clamp( fov, 10, 75 );

        camera.updateProjectionMatrix();
    }

    update() {
        this.lat = Math.max( - 85, Math.min( 85, lat ) );
        this.phi = THREE.Math.degToRad( 90 - lat );
        this.theta = THREE.Math.degToRad( lon );

        camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
        camera.target.y = 500 * Math.cos( phi );
        camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );

        camera.lookAt( camera.target );
    }


}

/*Potree.OrbitControls = class OrbitControls extends THREE.EventDispatcher{

    constructor(viewer){
        super()

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.scene = null;
        this.sceneControls = new THREE.Scene();

        this.rotationSpeed = 5;

        this.fadeFactor = 10;
        this.yawDelta = 0;
        this.pitchDelta = 0;
        this.panDelta = new THREE.Vector2(0, 0);
        this.radiusDelta = 0;

        this.tweens = [];


        let drag = (e) => {
            if(e.drag.object !== null){
                return;
            }

            if(e.drag.startHandled === undefined){
                e.drag.startHandled = true;

                this.dispatchEvent({type: "start"});
            }

            let ndrag = {
                x: e.drag.lastDrag.x / this.renderer.domElement.clientWidth,
                y: e.drag.lastDrag.y / this.renderer.domElement.clientHeight
            };

            if(e.drag.mouse === Potree.MOUSE.LEFT){
                this.yawDelta += ndrag.x * this.rotationSpeed;
                this.pitchDelta += ndrag.y * this.rotationSpeed;

                this.stopTweens();
            }


        };

        let drop = e => {
            this.dispatchEvent({type: "end"});
        };

        let scroll = (e) => {
            let resolvedRadius = this.scene.view.radius + this.radiusDelta;

            this.radiusDelta += -e.delta * resolvedRadius * 0.1;

            this.stopTweens();
        };

        //let dblclick = (e) => {
        //    this.zoomToLocation(e.mouse);
        //};


        let previousTouch = null;
        let touchStart = e => {
            previousTouch = e;
        };

        let touchEnd = e => {
            previousTouch = e;
        };

        let touchMove = e => {

            if(e.touches.length === 2 && previousTouch.touches.length === 2){
                let prev = previousTouch;
                let curr = e;

                let prevDX = prev.touches[0].pageX - prev.touches[1].pageX;
                let prevDY = prev.touches[0].pageY - prev.touches[1].pageY;
                let prevDist = Math.sqrt(prevDX * prevDX + prevDY * prevDY);

                let currDX = curr.touches[0].pageX - curr.touches[1].pageX;
                let currDY = curr.touches[0].pageY - curr.touches[1].pageY;
                let currDist = Math.sqrt(currDX * currDX + currDY * currDY);

                let delta = currDist / prevDist;
                let resolvedRadius = this.scene.view.radius + this.radiusDelta;
                let newRadius = resolvedRadius / delta;
                this.radiusDelta = newRadius - resolvedRadius;

                this.stopTweens();
            }

            previousTouch = e;
        };

        this.addEventListener("touchstart", touchStart);
        this.addEventListener("touchend", touchEnd);
        this.addEventListener("touchmove", touchMove);
        this.addEventListener("drag", drag);
        this.addEventListener("drop", drop);
        //this.addEventListener("mousewheel", scroll);
        //this.addEventListener("dblclick", dblclick);

    }

    setScene(scene){
        this.scene = scene;
    }

    zoomToLocation(mouse){
        let camera = this.scene.camera;

        let I = Potree.utils.getMousePointCloudIntersection(
            mouse,
            camera,
            this.renderer,
            this.scene.pointclouds);

        if(I === null){
            return;
        }

        let nmouse =  {
            x: +( mouse.x / this.renderer.domElement.clientWidth )  * 2 - 1,
            y: -( mouse.y / this.renderer.domElement.clientHeight ) * 2 + 1
        };

        let targetRadius = 0;
        {
            let minimumJumpDistance = 0.2;

            let vector = new THREE.Vector3( nmouse.x, nmouse.y, 0.5 );
            vector.unproject(camera);

            let direction = vector.sub(camera.position).normalize();
            let ray = new THREE.Ray(camera.position, direction);

            let nodes = I.pointcloud.nodesOnRay(I.pointcloud.visibleNodes, ray);
            let lastNode = nodes[nodes.length - 1];
            let radius = lastNode.getBoundingSphere().radius;
            targetRadius = Math.min(this.scene.view.radius, radius);
            targetRadius = Math.max(minimumJumpDistance, targetRadius);
        }

        let d = this.scene.view.direction.multiplyScalar(-1);
        let cameraTargetPosition = new THREE.Vector3().addVectors(I.location, d.multiplyScalar(targetRadius));
        let controlsTargetPosition = I.location;

        var animationDuration = 600;
        var easing = TWEEN.Easing.Quartic.Out;

        { // animate

            let value = {x: 0};
            let tween = new TWEEN.Tween(value).to({x: 1}, animationDuration);
            tween.easing(easing);
            this.tweens.push(tween);

            let startPos = this.scene.view.position.clone();
            let targetPos = cameraTargetPosition.clone();
            let startRadius = this.scene.view.radius;
            let targetRadius = cameraTargetPosition.distanceTo(I.location);

            tween.onUpdate( () => {
                let t = value.x;
                this.scene.view.position.x = (1 - t) * startPos.x + t * targetPos.x;
                this.scene.view.position.y = (1 - t) * startPos.y + t * targetPos.y;
                this.scene.view.position.z = (1 - t) * startPos.z + t * targetPos.z;

                this.scene.view.radius = (1 - t) * startRadius + t * targetRadius;
                this.viewer.setMoveSpeed(this.scene.view.radius / 2.5);
            });

            tween.onComplete( () => {
                this.tweens = this.tweens.filter( e => e !== tween);
            });

            tween.start();
        }
    }

    stopTweens(){
        this.tweens.forEach( e => e.stop() );
        this.tweens = [];
    }

    update(delta){

        let view = this.scene.view;

        { // apply rotation
            let progression = Math.min(1, this.fadeFactor * delta);

            let yaw = view.yaw;
            let pitch = view.pitch;
            let pivot = view.getPivot();

            yaw -= progression * this.yawDelta;
            pitch -= progression * this.pitchDelta;

            view.yaw = yaw;
            view.pitch = pitch;

            let V = this.scene.view.direction.multiplyScalar(-view.radius);
            let position = new THREE.Vector3().addVectors(pivot, V);

            view.position.copy(position);
        }

        { // apply pan
            let progression = Math.min(1, this.fadeFactor * delta);
            let panDistance = progression * view.radius * 3;

            let px = -this.panDelta.x * panDistance;
            let py = this.panDelta.y * panDistance;

            view.pan(px, py);
        }

        { // apply zoom
            let progression = Math.min(1, this.fadeFactor * delta);

            //let radius = view.radius + progression * this.radiusDelta * view.radius * 0.1;
            let radius = view.radius + progression * this.radiusDelta;

            let V = view.direction.multiplyScalar(-radius);
            let position = new THREE.Vector3().addVectors(view.getPivot(), V);
            view.radius = radius;

            view.position.copy(position);
        }

        {
            let speed = view.radius / 2.5;
            this.viewer.setMoveSpeed(speed);
        }

        {// decelerate over time
            let progression = Math.min(1, this.fadeFactor * delta);
            let attenuation = Math.max(0, 1 - this.fadeFactor * delta);

            this.yawDelta *= attenuation;
            this.pitchDelta *= attenuation;
            this.panDelta.multiplyScalar(attenuation);
            //this.radiusDelta *= attenuation;
            this.radiusDelta -= progression * this.radiusDelta
        }
    }

};//*/

Potree.OrbitControls = class OrbitControls extends THREE.EventDispatcher{

    constructor(viewer){
        super()

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.scene = null;
        this.sceneControls = new THREE.Scene();

        this.rotationSpeed = 5;

        this.fadeFactor = 10;
        this.yawDelta = 0;
        this.pitchDelta = 0;

        this.fov = 40;

        this.tweens = [];


        let drag = (e) => {
            if(e.drag.object !== null){
                return;
            }

            if(e.drag.startHandled === undefined){
                e.drag.startHandled = true;

                this.dispatchEvent({type: "start"});
            }

            let ndrag = {
                x: e.drag.lastDrag.x / this.renderer.domElement.clientWidth,
                y: e.drag.lastDrag.y / this.renderer.domElement.clientHeight
            };

            if(e.drag.mouse === Potree.MOUSE.LEFT){
                this.yawDelta += ndrag.x * this.rotationSpeed;
                this.pitchDelta += ndrag.y * this.rotationSpeed;

                this.stopTweens();
            }


        };

        let drop = e => {
            this.dispatchEvent({type: "end"});
        };

        let scroll = (e) => {
            /*let resolvedRadius = this.scene.view.radius + this.radiusDelta;

            this.radiusDelta += -e.delta * resolvedRadius * 0.1;

            this.stopTweens();//*/
            //debugger;
            this.fov = THREE.Math.clamp( this.fov - e.delta * 0.5, 10, 75 );

        };

        /*let dblclick = (e) => {
            this.zoomToLocation(e.mouse);
        };//*/


        let previousTouch = null;
        let touchStart = e => {
            previousTouch = e;
        };

        let touchEnd = e => {
            previousTouch = e;
        };

        let touchMove = e => {

            if(e.touches.length === 2 && previousTouch.touches.length === 2){

                this.stopTweens();
            }

            previousTouch = e;
        };

        this.addEventListener("touchstart", touchStart);
        this.addEventListener("touchend", touchEnd);
        this.addEventListener("touchmove", touchMove);
        this.addEventListener("drag", drag);
        this.addEventListener("drop", drop);
        this.addEventListener("mousewheel", scroll);
        //this.addEventListener("dblclick", dblclick);

    }

    setScene(scene){
        this.scene = scene;
    }

    stopTweens(){
        this.tweens.forEach( e => e.stop() );
        this.tweens = [];
    }

    update(delta){

        let view = this.scene.view;

        { // apply rotation
            let progression = Math.min(1, this.fadeFactor * delta);

            let yaw = view.yaw;
            let pitch = view.pitch;

            yaw += progression * this.yawDelta;
            pitch += progression * this.pitchDelta;

            view.yaw = yaw;
            view.pitch = pitch;
        }

        {// decelerate over time
            let attenuation = Math.max(0, 1 - this.fadeFactor * delta);

            this.yawDelta *= attenuation;
            this.pitchDelta *= attenuation;
        }

        {//apply fov
            let camera = this.scene.camera;

            camera.fov = this.fov;

            camera.updateProjectionMatrix();
        }
    }

};