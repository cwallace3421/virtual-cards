import { BufferGeometryUtils } from './helpers/BufferGeometryUtils';
import { CardGeometry } from './CardGeometry';
import { Global } from './Global';
import { BufferGeometry, Mesh, MathUtils, Vector3, MeshStandardMaterial, Texture, Scene, BoxBufferGeometry, Box3, Raycaster, PlaneBufferGeometry } from 'three';
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
        this.deckMesh = undefined;

        /** @type {Mesh} */
        this.selectMesh = undefined;

        /** @type {Array<Box3>} */
        this.bb = [];

        Promise.all([
            textureManager.loadTarotTexture('back'),
            textureManager.loadTarotTexture('edge'),
            textureManager.loadGeneralTexture('paper_normal')
        ]).then(() => {
            this.texturesLoaded = true;
        });
    }

    update() {
        if (!this.meshesLoaded && this.texturesLoaded) {
            this._createDeckMesh();
            this._createSelectMesh();
            this.scene.add(this.deckMesh);
            this.scene.add(this.selectMesh);
            this.meshesLoaded = true;
            console.log(`deck mesh created`);
        }
    }

    setPosition(pos) {
        const { x, y, z } = pos;
        if (this.meshesLoaded) {
            this.deckMesh.position.x = x;
            this.deckMesh.position.y = y;
            this.deckMesh.position.z = z;

            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
        }
    }

    /**
     * @param {Raycaster} raycaster
     */
    raycast(raycaster) {
        if (this.meshesLoaded) {
            let result = false;
            for (let i = 0; i < this.bb.length; i++) {
                if(raycaster.ray.intersectsBox(this.bb[i])) {
                    result = true;
                    break;
                }
            }

            if (this.meshesLoaded) {
                this.selectMesh.visible = result;
            }

            return result;
        }
        return false;
    }

    _createDeckMesh() {
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

        this.deckMesh = new Mesh(deckGeometry,
            [
                this._createMaterial(this.textureManager.getTexture('edge'), false),
                this._createMaterial(this.textureManager.getTexture('back')),
                this._createMaterial(this.textureManager.getTexture('back'))
            ]
        );
        this.deckMesh.receiveShadow = true;
        this.deckMesh.castShadow = true;

        this.bb.push(new Box3(
            new Vector3(
                this.position.x - (Global.CardWidth / 2),
                this.position.y,
                this.position.z - (Global.CardHeight / 2)
            ),
            new Vector3(
                this.position.x + (Global.CardWidth / 2),
                this.position.y + (Global.CardThickness * numOfCards),
                this.position.z + (Global.CardHeight / 2)
            )
        ));
    }

    _createSelectMesh() {
        const thickness = 0.03;
        const margin = 0.05;
        const yOffset = 0.001;
        const geoms = [
            new PlaneBufferGeometry(Global.CardWidth + (margin * 2) + (thickness * 2), thickness)
                .rotateX(MathUtils.degToRad(-90))
                .translate(this.position.x, this.position.y + yOffset, this.position.z + (margin + (Global.CardHeight / 2) + (thickness / 2))), // Front
            new PlaneBufferGeometry(Global.CardWidth + (margin * 2) + (thickness * 2), thickness)
                .rotateX(MathUtils.degToRad(-90))
                .translate(this.position.x, this.position.y + yOffset, this.position.z - (margin + (Global.CardHeight / 2) + (thickness / 2))), // Back
            new PlaneBufferGeometry(thickness, Global.CardHeight + (margin * 2))
                .rotateX(MathUtils.degToRad(-90))
                .translate(this.position.x + (margin + (Global.CardWidth / 2) + (thickness / 2)), this.position.y + yOffset, this.position.z), // Right
            new PlaneBufferGeometry(thickness, Global.CardHeight + (margin * 2))
                .rotateX(MathUtils.degToRad(-90))
                .translate(this.position.x - (margin + (Global.CardWidth / 2) + (thickness / 2)), this.position.y + yOffset, this.position.z), // Right
        ];
        const selectGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms);

        for (let i = 0; i < geoms.length; i++) {
            geoms[i].dispose();
        }

        this.selectMesh = new Mesh(selectGeometry, new MeshStandardMaterial({ color: 0x999999, roughness: 1 }));
        this.selectMesh.receiveShadow = true;

        this.bb.push(new Box3(
            new Vector3(
                this.position.x - ((Global.CardWidth / 2) + margin + thickness),
                this.position.y,
                this.position.z - ((Global.CardHeight / 2) + margin + thickness)
            ),
            new Vector3(
                this.position.x + ((Global.CardWidth / 2) + margin + thickness),
                this.position.y + thickness,
                this.position.z + ((Global.CardHeight / 2) + margin + thickness)
            )
        ));
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
            geometry.addGroup(startIndex, (4 * 6) /* 4 Faces */, 0);
            geometry.addGroup(group2Index, (1 * 6) /* 1 Faces */, 1);
            geometry.addGroup(group3Index, (1 * 6) /* 1 Faces */, 2);
        }
    }
}

export { Deck };