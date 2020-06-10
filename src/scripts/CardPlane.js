import { Global } from './Global';
import { PlaneBufferGeometry, Mesh, MathUtils, Vector3, MeshStandardMaterial, Texture, Scene } from 'three';
import { TextureManager } from './TextureManager';

class Card {
    id;
    width;
    height;
    /** @type {TextureManager} */
    textureManager;
    /** @type {Scene} */
    scene;
    frontMesh;
    backMesh;
    position;
    texturesLoaded = false;
    meshsLoaded = false;

    /**
     * @constructor
     * @param {TextureManager} textureManager
     * @param {Scene} scene
     * @param {String} id
     * @param {Vector3} position
     */
    constructor(textureManager, scene, id, position) {
        this.id = id;
        console.log(`${this.id} start creation`);
        this.textureManager = textureManager;
        this.scene = scene;
        this.position = position;

        this.width = Global.CardWidth;
        this.height = Global.CardHeight;

        Promise.all([
            textureManager.loadTarotTexture(id),
            textureManager.loadTarotTexture('back'),
            textureManager.loadGeneralTexture('paper_normal')
        ]).then(() => {
            this.texturesLoaded = true;
        });
    }

    update() {
        if (!this.meshsLoaded && this.texturesLoaded) {
            this._createMesh();
            this.scene.add(this.frontMesh);
            this.scene.add(this.backMesh);
            this.meshsLoaded = true;
            this.setPosition(this.position);
            console.log(`${this.id} mesh created`);
        }
    }

    setPosition(pos) {
        const { x, y, z } = pos;
        if (this.meshsLoaded) {
            this.frontMesh.position.x = x;
            this.frontMesh.position.y = y;
            this.frontMesh.position.z = z;

            this.backMesh.position.x = x;
            this.backMesh.position.y = y;
            this.backMesh.position.z = z;

            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
        }
    }

    rotate(deg, axis = new Vector3(1, 0, 0)) {
        if (this.meshsLoaded) {
            const rad = MathUtils.degToRad(deg);
            this.frontMesh.rotateOnWorldAxis(axis, rad)
            this.backMesh.rotateOnWorldAxis(axis, rad)
        }
    }

    _createMesh() {
        const frontGeometry = new PlaneBufferGeometry(this.width, this.height, 1, 1);
        this._setUvCoordinatesForGeometry(frontGeometry);
        this.frontMesh = new Mesh(frontGeometry, this._createMaterial(this.textureManager.getTexture(this.id)));
        this.frontMesh.receiveShadow = true;
        this.frontMesh.castShadow = true;

        const backGeometry = new PlaneBufferGeometry(this.width, this.height, 1, 1);
        this._setUvCoordinatesForGeometry(backGeometry);
        this.backMesh = new Mesh(backGeometry, this._createMaterial(this.textureManager.getTexture('back')));
        this.backMesh.rotateY(MathUtils.degToRad(180));
        this.backMesh.receiveShadow = true;
        this.backMesh.castShadow = true;
    }

    /**
     * @param {Texture} texture
     */
    _createMaterial(texture) {
        const mat = new MeshStandardMaterial({
            map: texture,
            normalMap: this.textureManager.getTexture('paper_normal'),
            roughness: .3
        });
        return mat;
    }

    /**
     * @param {PlaneBufferGeometry} geometry
     */
    _setUvCoordinatesForGeometry(geometry) {
        const uvAttribute = geometry.attributes.uv;
        for (var i = 0; i < uvAttribute.count; i++) {
            let x = uvAttribute.getX(i);
            const y = uvAttribute.getY(i);
            if (x === 1) {
                x = Global.CardUVx;
            }
            uvAttribute.setXY(i, x, y);
        }
    }
}

export { Card };