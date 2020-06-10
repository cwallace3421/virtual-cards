import { Color, Scene, Vector3, Mesh, PlaneBufferGeometry, MeshStandardMaterial, RepeatWrapping, MathUtils } from "three";
import { TextureManager } from './TextureManager';

class Table {

    /**
     * @constructor
     * @param {TextureManager} textureManager
     * @param {Scene} scene
     * @param {Vector3} position
     * @param {Number} size
     * @param {Color} color
     */
    constructor(textureManager, scene, position, size, color = new Color(0xffffff)) {
        this.textureManager = textureManager;
        this.scene = scene;
        this.position = position;
        this.width = size;
        this.height = size;
        this.color = color;
        this.meshesLoaded = false;
        this.texturesLoaded = false;
        this.roughness = .8;

        /** @type {Mesh} */
        this.mesh = undefined;

        Promise.all([
            textureManager.loadGeneralTexture('felt_albedo'),
            textureManager.loadGeneralTexture('felt_normal')
        ]).then(() => {
            this.texturesLoaded = true;
        });
    }

    update() {
        if (!this.meshsLoaded && this.texturesLoaded) {
            this._createMesh();
            this.setPosition(this.position);
            this.meshsLoaded = true;
            this.scene.add(this.mesh);
            console.log(`table mesh created`);
        }
    }

    setPosition(pos) {
        const { x, y, z } = pos;
        if (this.meshsLoaded) {
            this.mesh.position.x = x;
            this.mesh.position.y = y;
            this.mesh.position.z = z;

            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
        }
    }

    _createMesh() {
        const planeGeometry = new PlaneBufferGeometry(this.width, this.height, 1, 1);
        planeGeometry.rotateX(MathUtils.degToRad(-90));
        planeGeometry.computeVertexNormals();
        this.mesh = new Mesh(planeGeometry, this._createMaterial());
        this.mesh.receiveShadow = true;
    }

    /**
     * @param {Texture} texture
     */
    _createMaterial() {
        const texScale = 10;
        const mat = new MeshStandardMaterial({
            color: this.color,
            map: this.textureManager.getTexture('felt_albedo'),
            normalMap: this.textureManager.getTexture('felt_normal'),
            roughness: this.roughness
        });
        mat.map.repeat.set(texScale, texScale);
        mat.normalMap.repeat.set(texScale, texScale);
        return mat;
    }
}

export { Table };