import { Global } from './Global';
import { DoubleSide, PlaneBufferGeometry, Mesh, MathUtils, Vector3, MeshStandardMaterial, Texture, Scene } from 'three';
import { BufferGeometryUtils } from './helpers/BufferGeometryUtils';
import { TextureManager } from './TextureManager';

class Deck {

    /**
     * @constructor
     * @param {TextureManager} textureManager
     * @param {Scene} scene
     */
    constructor(textureManager, scene, position) {
        this.textureManager = textureManager;
        this.scene = scene;
        this.position = position;
        this.texturesLoaded = false;
        this.meshesLoaded = false;

        this.cardWidth = Global.CardWidth;
        this.cardHeight = Global.CardHeight;

        /** @type {Mesh} */
        this.mesh = undefined;

        Promise.all([
            textureManager.loadTarotTexture('back'),
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
            // this.setPosition(this.position);
            console.log(`deck mesh created`);
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
        const geoms = [];
        for (let i = 0; i < Global.DeckVisualHeight; i++) {
            const tempGeometry = new PlaneBufferGeometry(this.cardWidth, this.cardHeight, 1, 1);
            this._setGeometryPosition(i, tempGeometry);
            this._setGeometryUvCoordinates(tempGeometry);
            geoms.push(tempGeometry);
        }
        const baseGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms);

        for (let i = 0; i < geoms.length; i++) {
            geoms[i].dispose();
        }

        this.mesh = new Mesh(baseGeometry, this._createMaterial(this.textureManager.getTexture('back')));
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
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
        // mat.side = DoubleSide;
        return mat;
    }

    /**
     * @param {Number} index
     * @param {PlaneBufferGeometry} geometry
     */
    _setGeometryPosition(index, geometry) {
        const gap = Global.DeckGap;
        const y = gap * (index + 1);
        geometry.rotateX(MathUtils.degToRad(-90));
        geometry.rotateY(MathUtils.degToRad(MathUtils.randFloat(-1, 1)));
        geometry.translate(
            this.position.x + MathUtils.randFloat(-.01, .01),
            this.position.y + y,
            this.position.z + MathUtils.randFloat(-.01, .01)
        );
        geometry.computeVertexNormals();
    }

    /**
     * @param {PlaneBufferGeometry} geometry
     */
    _setGeometryUvCoordinates(geometry) {
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

export { Deck };