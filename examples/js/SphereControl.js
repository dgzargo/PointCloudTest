Potree.OrbitControls = class OrbitControls extends THREE.EventDispatcher{

    constructor(viewer){
        super()

        this.viewer = viewer;
        this.renderer = viewer.renderer;

        this.scene = null;
        this.sceneControls = new THREE.Scene();

        this.rotationSpeed = 5;

        this.fadeFactor = 10;
        // this.yawDelta = 0;
        // this.pitchDelta = 0;
        this.rotationUpdateDelta = {yawDelta: 0, pitchDelta: 0};

        this.fov = viewer.fov;

        let dragEventEnabled = true;

        let calculateRotation = (panVector) => {
            let yawDelta = panVector.x / this.renderer.domElement.clientWidth * this.fov  / 150 * this.rotationSpeed;
            let pitchDelta = panVector.y / this.renderer.domElement.clientHeight * this.fov  / 300 * this.rotationSpeed;
            return {yawDelta, pitchDelta};
        };

        let applyRotationDelta = (baseRotation, deltaRotation) => {
            baseRotation.yawDelta += deltaRotation.yawDelta;
            baseRotation.pitchDelta += deltaRotation.pitchDelta;
        };

        let drag = (e) => {
            if (dragEventEnabled === false) {
                dragEventEnabled = true;
                return;
            }

            if(e.drag.object !== null){
                return;
            }

            if(e.drag.startHandled === undefined){
                e.drag.startHandled = true;

                this.dispatchEvent({type: "start"});
            }

            let rotationEventDelta = calculateRotation(e.drag.lastDrag);
            applyRotationDelta(this.rotationUpdateDelta, rotationEventDelta);
        };

        let drop = e => {
            this.dispatchEvent({type: "end"});
        };

        let scroll = (e) => {
            this.fov = THREE.Math.clamp( this.fov - e.delta * 0.5, 15, 75 );
        };

        let touchData = null;

        let vector2OfTouch = (touch) => {
            return new THREE.Vector2(touch.pageX, touch.pageY);
        }

        let getTouchData = (e) => {
            let touches = e.touches;
            /*if(touches.length === 1){
                touches = [touches[0], {pageX:0, pageY:0}];
            }//*/
            if (touches.length === 2){
                let t1 = vector2OfTouch(touches[0]);
                let t2 = vector2OfTouch(touches[1]);
                let hypotenuse = new THREE.Vector2().subVectors(t1, t2).length();
                let center = new THREE.Vector2().copy(t1).lerp(t2, 0.5);
                return {twoTouchesDistance: hypotenuse, center: center};
            } else if(touches.length === 1){
                return {twoTouchesDistance: null, center: vector2OfTouch(touches[0])};
            } else return null;
        }

        let writeDownTouch = e => {
            touchData = getTouchData(e);
        };

        let touchMove = e => {
            dragEventEnabled = false;
            let newTouchData = getTouchData(e);
            {
                let panVector = new THREE.Vector2().subVectors(newTouchData.center, touchData.center);
                let rotationEventDelta = calculateRotation(panVector);
                applyRotationDelta(this.rotationUpdateDelta, rotationEventDelta);
            } //pan
            {
                if (touchData.twoTouchesDistance){
                    let scale = touchData.twoTouchesDistance / newTouchData.twoTouchesDistance
                    this.fov = THREE.Math.clamp( this.fov * scale, 15, 75 );
                }
            } // zoom
            touchData = newTouchData;
        };

        this.addEventListener("touchstart", writeDownTouch);
        this.addEventListener("touchend", writeDownTouch);
        this.addEventListener("touchmove", touchMove);
        this.addEventListener("drag", drag);
        this.addEventListener("drop", drop);
        this.addEventListener("mousewheel", scroll);
        //this.addEventListener("dblclick", dblclick);
    }

    setScene(scene){
        this.scene = scene;
    }

    update(delta){

        let view = this.scene.view;

        { // apply rotation
            let progression = Math.min(1, this.fadeFactor * delta);

            let yaw = view.yaw;
            let pitch = view.pitch;

            yaw += progression * this.rotationUpdateDelta.yawDelta;
            pitch += progression * this.rotationUpdateDelta.pitchDelta;

            view.yaw = yaw;
            view.pitch = pitch;
        }

        {// decelerate over time
            let attenuation = Math.max(0, 1 - this.fadeFactor * delta);

            this.rotationUpdateDelta.yawDelta *= attenuation;
            this.rotationUpdateDelta.pitchDelta *= attenuation;
        }

        {//apply fov
            viewer.fov = this.fov;
        }
    }

};