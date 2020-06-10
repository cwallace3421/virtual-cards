import { BufferGeometryUtils } from './helpers/BufferGeometryUtils';
import { CardGeometry } from './CardGeometry';
import { Global } from './Global';
import { PlaneBufferGeometry, Mesh, MathUtils, Vector3, MeshStandardMaterial, Texture, Scene, BoxBufferGeometry } from 'three';
import { TextureManager } from './TextureManager';

class Deck {

    /**
     * @constructor
     * @param {TextureManager} textureManager
     * @param {Scene} scene
     * @param {Vector3} position
     */
    constructor(textureManager, scene, position) {
        this.textureManager = textureManager;
        this.scene = scene;
        this.position = position;
        this.texturesLoaded = false;
        this.meshesLoaded = false;

        /** @type {Mesh} */
        this.mesh = undefined;

        Promise.all([
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
        const numOfCards = Global.DeckVisualHeight;
        for (let i = 0; i < numOfCards; i++) {
            const tempGeometry = CardGeometry.create();
            this._setGeometryPosition(i, tempGeometry);
            geoms.push(tempGeometry);
        }
        const deckGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms);
        this._setGeometryGroups(deckGeometry, numOfCards);

        for (let i = 0; i < geoms.length; i++) {
            geoms[i].dispose();
        }

        this.mesh = new Mesh(deckGeometry,
            [
                this._createMaterial(this.textureManager.getTexture('edge'), false),
                this._createMaterial(this.textureManager.getTexture('back')),
                this._createMaterial(this.textureManager.getTexture('back'))
            ]
        );
        this.mesh.receiveShadow = true;
        this.mesh.castShadow = true;
    }

    /**
     * @param {Texture} texture
     */
    _createMaterial(texture, useNormal = true) {
        const mat = new MeshStandardMaterial({
            map: texture,
            normalMap: this.textureManager.getTexture('paper_normal'),
            roughness: .4
        });
        return mat;
    }

    /**
     * @param {Number} index
     * @param {BoxBufferGeometry} geometry
     */
    _setGeometryPosition(index, geometry) {
        const gap = Global.CardThickness;
        const y = (gap * index) + (gap / 2);
        geometry.rotateX(MathUtils.degToRad(-90));
        geometry.rotateY(MathUtils.degToRad(MathUtils.randFloat(-2, 2)));
        geometry.translate(
            this.position.x + MathUtils.randFloat(-.01, .01),
            this.position.y + y,
            this.position.z + MathUtils.randFloat(-.01, .01)
        );
        geometry.computeVertexNormals();
    }

    /**
     * @param {BoxBufferGeometry} geometry
     * @param {Number} numOfCards
     */
    _setGeometryGroups(geometry, numOfCards) {
        geometry.clearGroups();
        for (let i = 0; i < numOfCards; i++) {
            const startIndex = 36 * i;
            const group2Index = startIndex + (4 * 6);
            const group3Index = startIndex + (4 * 6) + 6;
            geometry.addGroup(startIndex,  (4 * 6) /* 4 Faces */, 0);
            geometry.addGroup(group2Index, (1 * 6) /* 1 Faces */, 1);
            geometry.addGroup(group3Index, (1 * 6) /* 1 Faces */, 2);
        }
    }

}

export { Deck };