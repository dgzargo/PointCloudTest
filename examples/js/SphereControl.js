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

        this.fov = viewer.fov;


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

            // fov relative compensation
            ndrag.y = ndrag.y * this.fov  / 300;
            ndrag.x = ndrag.x * this.fov  / 150;

            if(e.drag.mouse === Potree.MOUSE.LEFT){
                this.yawDelta += ndrag.x * this.rotationSpeed;
                this.pitchDelta += ndrag.y * this.rotationSpeed;
            }


        };

        let drop = e => {
            this.dispatchEvent({type: "end"});
        };

        let scroll = (e) => {

            this.fov = THREE.Math.clamp( this.fov - e.delta * 0.5, 15, 75 );
        };

        let doubleTouchCenter = null;
        let doubleTouchInitialLength = null;

        let doubleTouchParameters = (t1, t2) => {
            let hypotenuse = new THREE.Vector2().subVectors(t1, t2).length();
            let center = new THREE.Vector2().set(t1).lerp(t2, 0.5);
            return {hypotenuse, center};
        }

        let touchStart = e => {
            let touches = e.touches;
            if (touches.length === 2){
                let {hypotenuse, center} = doubleTouchParameters(touches[0], touches[1]);
                doubleTouchCenter = center;
                doubleTouchInitialLength = hypotenuse;
            }
        };

        let touchEnd = e => {
        };

        let touchMove = e => {
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
            viewer.fov = this.fov;
        }
    }

};