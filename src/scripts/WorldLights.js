import { HemisphereLight, DirectionalLight } from 'three';

class WorldLights {

    constructor(scene) {
        this.scene = scene;
        this.lights = [];
        this._setup1();
    }

    _setup1() {
        const hemiLight = new HemisphereLight(0xffffff, 0xffffff, 0.6);
        this.lights.push(hemiLight);
        hemiLight.intensity = 2;
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);
        hemiLight.position.set(0, 50, 0);
        this.scene.add(hemiLight);

        const dirLight = new DirectionalLight(0xffffff, 1);
        this.lights.push(dirLight);
        dirLight.color.setHSL(0.1, 1, 0.95);
        dirLight.intensity = 5;
        dirLight.position.set(-1, 1.75, 1);
        dirLight.position.multiplyScalar(30);
        this.scene.add(dirLight);

        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        const d = 5;
        dirLight.shadow.camera.left = -d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = -d;

        dirLight.shadow.camera.far = 500;
        dirLight.shadow.bias = -0.00001;
    }
}

export { WorldLights };