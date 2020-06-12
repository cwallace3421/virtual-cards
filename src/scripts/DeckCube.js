import { BufferGeometryUtils } from './helpers/BufferGeometryUtils';
import { CardGeometry } from './CardGeometry';
import { CardModel } from './CardModel';
import { Global } from './Global';
import { Mesh, MathUtils, Vector3, MeshStandardMaterial, Texture, Scene, BoxBufferGeometry, Box3, Raycaster, PlaneBufferGeometry } from 'three';
import { TextureManager } from './TextureManager';
import { CardTypes, CardDB } from './CardDB';

class Deck {

    /**
     * @constructor
     * @param {TextureManager} textureManager
     * @param {Scene} scene
     * @param {Vector3} position
     */
    constructor(textureManager, scene, position, cards = [], isFaceDown = true) {
        this.textureManager = textureManager;
        this.scene = scene;
        this.position = position;
        this.isFaceDown = isFaceDown;

        /** @type {Array<CardModel>} */
        this.cards = cards;

        /** @type {Mesh} */
        this.deckMesh = undefined;

        /** @type {Mesh} */
        this.selectMesh = undefined;

        /** @type {Array<Box3>} */
        this.bb = [];

        this.texturesLoaded = false;
        this.hasMesh = false;

        this.updateRequest = {
            first: false, // Is this the first update request coming through (the initial mesh creation)
            complete: false, // Has the update request been fully processed
            ready: false, // Is the update request ready to be process (are the texture loaded)
            isFaceDown: this.isFaceDown, // Is the update request going to flip the deck?
            topCardName: undefined, // The name of the top card in the current deck
        };

        this.shuffle(2, true);
    }

    addCardToTop(card) {
        if (this.updateRequest.complete) {
            this.cards.push(card);
            this._requestMeshAndTextureUpdate();
            return true;
        } else {
            return false;
        }
    }

    removeCardFromTop() {
        if (this.cards.length > 0 && this.updateRequest.complete) {
            const c = this.cards.pop();
            this._requestMeshAndTextureUpdate();
            return c;
        } else {
            return null;
        }
    }

    shuffle(times = 1, regenerateMesh = false) {
        for (let t = 0; t < times; t++) {
            for (let i = this.cards.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * i);
                const temp = this.cards[i];
                this.cards[i] = this.cards[j];
                this.cards[j] = temp;
            }
        }
        if (regenerateMesh) {
            this._requestMeshAndTextureUpdate();
        }
    }

    update() {
        if (!this.updateRequest.complete && this.updateRequest.ready) {
            this._createDeckMesh();
            if (this.deckMesh) {
                this.scene.add(this.deckMesh);
            }
            if (this.updateRequest.first) {
                this._createSelectMesh();
                this.scene.add(this.selectMesh);
                console.log(`deck mesh created`);
            } else {
                console.log(`deck mesh updated`);
            }
            this.hasMesh = true;
            this.setPosition(this.position);
            this.updateRequest.complete = true;
        }
    }

    setPosition(pos) {
        const { x, y, z } = pos;
        if (this.hasMesh) {
            if (this.deckMesh) {
                this.deckMesh.position.x = x;
                this.deckMesh.position.y = y;
                this.deckMesh.position.z = z;
                this.deckMesh.updateMatrixWorld();
            }

            this.selectMesh.position.x = x;
            this.selectMesh.position.y = y;
            this.selectMesh.position.z = z;
            this.selectMesh.updateMatrixWorld();

            for (let i = 0; i < this.bb.length; i++) {
                this.bb[i].applyMatrix4(this.selectMesh.matrixWorld);
            }

            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
        }
    }

    /**
     * @param {Raycaster} raycaster
     */
    raycast(raycaster) {
        if (this.hasMesh) {
            let result = false;
            for (let i = 0; i < this.bb.length; i++) {
                if (raycaster.ray.intersectsBox(this.bb[i])) {
                    result = true;
                    break;
                }
            }

            if (this.hasMesh && this.cards.length > 0) {
                this.selectMesh.visible = result;
            }
            else if (this.cards.length === 0) {
                this.selectMesh.visible = true;
            }

            return result;
        }
        return false;
    }

    _requestMeshAndTextureUpdate() {
        let topCardName = undefined;
        if (this.cards.length > 0) {
            const topCard = this.cards[this.cards.length - 1];
            const cardConfig = CardDB[topCard.type][topCard.index];
            topCardName = cardConfig.name;

            if (this.cards.length === 1) {
                this.updateRequest.isFaceDown = topCard.faceddown;
            } else {
                this.updateRequest.isFaceDown = this.isFaceDown;
            }
        }

        this.updateRequest.first = !this.hasMesh;
        this.updateRequest.topCardName = topCardName;
        this.updateRequest.complete = false;
        this.updateRequest.ready = false;

        Promise.all([
            topCardName ? this.textureManager.loadTarotTexture(topCardName) : Promise.resolve(),
            this.textureManager.loadTarotTexture('back'),
            this.textureManager.loadTarotTexture('edge'),
            this.textureManager.loadGeneralTexture('paper_normal')
        ]).then(() => {
            this.updateRequest.ready = true;
        }).catch((err) => {
            console.log(err);
        });
    }

    _createDeckMesh() {
        const geoms = [];
        const numOfCards = this.cards.length;

        if (this.hasMesh && this.deckMesh) {
            this.scene.remove(this.deckMesh);
            this.deckMesh.geometry.dispose();
            this.deckMesh.material.forEach(m => m.dispose());
            this.deckMesh = undefined;
        }

        if (numOfCards > 0) {
            this.isFaceDown = this.updateRequest.isFaceDown;

            const xRotationRad = MathUtils.degToRad(!this.isFaceDown ? -90 : 90); // TODO: This will probably make the cards inverted when you flip them over
            for (let i = 0; i < numOfCards; i++) {
                const tempGeometry = CardGeometry.create();
                tempGeometry.rotateX(xRotationRad);
                tempGeometry.rotateY(MathUtils.degToRad(MathUtils.randFloat(-2, 2)));
                tempGeometry.translate(MathUtils.randFloat(-.01, .01), (Global.CardThickness * i) + (Global.CardThickness / 2), MathUtils.randFloat(-.01, .01));
                geoms.push(tempGeometry);
            }
            const deckGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms);
            this._setGeometryGroups(deckGeometry, numOfCards);

            for (let i = 0; i < geoms.length; i++) {
                geoms[i].dispose();
            }

            console.log(this.updateRequest.topCardName);
            this.deckMesh = new Mesh(deckGeometry,
                [
                    this._createMaterial(this.textureManager.getTexture('edge'), false),
                    this._createMaterial(this.textureManager.getTexture(this.updateRequest.topCardName)),
                    this._createMaterial(this.textureManager.getTexture('back'))
                ]
            );
            this.deckMesh.receiveShadow = true;
            this.deckMesh.castShadow = true;

            // TODO: Everytime a new mesh gets generated a new bb gets added
            this.bb.push(new Box3(
                new Vector3(-(Global.CardWidth / 2), 0, -(Global.CardHeight / 2)),
                new Vector3((Global.CardWidth / 2), (Global.CardThickness * numOfCards), (Global.CardHeight / 2)),
            ));
        }
    }

    _createSelectMesh() {
        const thickness = 0.03;
        const margin = 0.05;
        const yOffset = 0.001;
        const geoms = [
            new PlaneBufferGeometry(Global.CardWidth + (margin * 2) + (thickness * 2), thickness)
                .rotateX(MathUtils.degToRad(-90))
                .translate(0, yOffset, (margin + (Global.CardHeight / 2) + (thickness / 2))), // Front
            new PlaneBufferGeometry(Global.CardWidth + (margin * 2) + (thickness * 2), thickness)
                .rotateX(MathUtils.degToRad(-90))
                .translate(0, yOffset, -(margin + (Global.CardHeight / 2) + (thickness / 2))), // Back
            new PlaneBufferGeometry(thickness, Global.CardHeight + (margin * 2))
                .rotateX(MathUtils.degToRad(-90))
                .translate((margin + (Global.CardWidth / 2) + (thickness / 2)), yOffset, 0), // Right
            new PlaneBufferGeometry(thickness, Global.CardHeight + (margin * 2))
                .rotateX(MathUtils.degToRad(-90))
                .translate(-(margin + (Global.CardWidth / 2) + (thickness / 2)), yOffset, 0), // Right
        ];
        const selectGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms);

        for (let i = 0; i < geoms.length; i++) {
            geoms[i].dispose();
        }

        this.selectMesh = new Mesh(selectGeometry, new MeshStandardMaterial({ color: 0x999999, roughness: 1 }));
        this.selectMesh.receiveShadow = true;

        this.bb.push(new Box3(
            new Vector3(-((Global.CardWidth / 2) + margin + thickness), 0, -((Global.CardHeight / 2) + margin + thickness)),
            new Vector3(((Global.CardWidth / 2) + margin + thickness), thickness, ((Global.CardHeight / 2) + margin + thickness)),
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
        geometry.rotateX(MathUtils.degToRad(-90));
        geometry.rotateY(MathUtils.degToRad(MathUtils.randFloat(-20, 20)));
        geometry.translate(MathUtils.randFloat(-.01, .01), (Global.CardThickness * index) + (Global.CardThickness / 2), MathUtils.randFloat(-.01, .01));
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