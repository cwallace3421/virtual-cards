import { Global } from '../Global';
import { PlaneBufferGeometry, Mesh, MathUtils, Vector3, MeshStandardMaterial, Texture, Scene, BoxBufferGeometry, NearestFilter, LinearFilter } from 'three';
import { TextureManager } from '../TextureManager';

class Card {
    id;
    width;
    height;
    /** @type {TextureManager} */
    textureManager;
    /** @type {Scene} */
    scene;
    mesh;
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

        /** @type {Mesh} */
        this.mesh = null;

        this.width = Global.CardWidth;
        this.height = Global.CardHeight;

        Promise.all([
            textureManager.loadTarotTexture(id),
            textureManager.loadTarotTexture('back'),
            textureManager.loadTarotTexture('edge'),
            textureManager.loadGeneralTexture('paper_normal')
        ]).then(() => {
            this.texturesLoaded = true;
        });
    }

    update() {
        if (!this.meshsLoaded && this.texturesLoaded) {
            this._createMesh();
            this.scene.add(this.mesh);
            this.meshsLoaded = true;
            this.setPosition(this.position);
            console.log(`${this.id} mesh created`);
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

    rotate(deg, axis = new Vector3(1, 0, 0)) {
        if (this.meshsLoaded) {
            const rad = MathUtils.degToRad(deg);
            this.mesh.rotateOnWorldAxis(axis, rad)
        }
    }

    _createMesh() {
        const geometry = new BoxBufferGeometry(this.width, this.height, Global.CardThickness);
        geometry.clearGroups();
        geometry.addGroup(0, (4 * 6), 0);
        geometry.addGroup((4 * 6), 6, 1);
        geometry.addGroup((4 * 6) + 6, 6 , 2);
        this._setUvCoordinatesForGeometry(geometry);
        this.mesh = new Mesh(
            geometry,
            [
                this._createMaterial(this.textureManager.getTexture('edge'), false),
                this._createMaterial(this.textureManager.getTexture(this.id)),
                this._createMaterial(this.textureManager.getTexture('back')),
            ]
        );
        // this.mesh = new Mesh(geometry,this._createMaterial(this.textureManager.getTexture('back')));
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
    }

    /**
     * @param {Texture} texture
     */
    _createMaterial(texture, useNormals = true) {
        const mat = new MeshStandardMaterial({
            map: texture,
            normalMap: this.textureManager.getTexture('paper_normal'),
            roughness: .4
        });
        return mat;
    }

    /**
     * @param {PlaneBufferGeometry} geometry
     */
    _setUvCoordinatesForGeometry(geometry) {
        const uvAttribute = geometry.attributes.uv;
        let vertexCount = 0;
        for (var i = 0; i < uvAttribute.count; i++) {
            let x = uvAttribute.getX(i);
            const y = uvAttribute.getY(i);
            if (vertexCount > (4 * 4)) {
                if (x === 1) {
                    x = Global.CardUVx;
                }
            }
            uvAttribute.setXY(i, x, y);
            vertexCount++;
        }
    }
}

export { Card };