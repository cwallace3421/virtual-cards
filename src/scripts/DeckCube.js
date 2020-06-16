import { BufferGeometryUtils } from './helpers/BufferGeometryUtils';
import { CardGeometry } from './CardGeometry';
import { CardModel } from './CardModel';
import { Global } from './Global';
import { Mesh, MathUtils, Vector3, Scene, Box3, Raycaster, PlaneBufferGeometry } from 'three';
import { MaterialManager } from './MaterialManager';
import { CardDB } from './CardDB';

class Deck {

    /**
     * @constructor
     * @param {MaterialManager} materialManager
     * @param {Scene} scene
     * @param {Vector3} position
     */
    constructor(materialManager, scene, position, cards = [], isFaceDown = true) {
        this.materialManager = materialManager;
        this.scene = scene;
        this.position = position;
        this.isFaceDown = isFaceDown;

        /** @type {Array<CardModel>} */
        this.cards = cards;

        /** @type {Mesh} */
        this.deckMesh = undefined;

        /** @type {Mesh} */
        this.hoverMesh = undefined;

        /** @type {Mesh} */
        this.selectionMesh = undefined;

        /** @type {Box3} */
        this.deckBoundingBox = undefined;

        /** @type {Box3} */
        this.selectionBoundingBox = undefined;

        this.hover = false;
        this.selected = false;

        this.queuedUpdate = {
            isComplete: false, // Has the update request been fully processed
            isReady: false, // Is the update request ready to be process (are the texture loaded)
            topCardConfig: undefined, // The config of the top card to render
        };

        this.shuffle(2);
        this._requestMeshAndTextureUpdate();
    }

    addCardToTop(card) {
        if (this._isCardDeckLocked()) {
            return false;
        }

        this.cards.push(card);
        this._requestMeshAndTextureUpdate();
        return true;
    }

    removeCardFromTop() {
        if (this._isCardDeckLocked()) {
            if (this._hasCards()) {
                const c = this.cards.pop();
                this._requestMeshAndTextureUpdate();
                return c;
            }
        }

        return null;
    }

    shuffle(times = 1, regenerateMesh = false) {
        if (!this._isCardDeckLocked() && this._hasCards) {
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
    }

    update() {
        if (this._hasInitialised()) {
            this.selectionMesh.visible = this.hover || this.selected;
        } else {
            this._createSelectionMesh();
            this.scene.add(this.selectionMesh);
        }

        if (this._hasQueuedUpdate() && this.queuedUpdate.isReady) {
            this._createDeckMesh();
            if (this._hasCardDeckMesh()) {
                this.scene.add(this.deckMesh);
            }
            this.setPosition(this.position);
            this.queuedUpdate.isComplete = true;
        }
    }

    setPosition(pos) {
        const { x, y, z } = pos;
        if (this._hasInitialised()) {
            this.selectionMesh.position.x = x;
            this.selectionMesh.position.y = y;
            this.selectionMesh.position.z = z;
            this.selectionMesh.updateMatrixWorld();
            this.selectionBoundingBox.applyMatrix4(this.selectionMesh.matrixWorld);

            if (this._hasCardDeckMesh()) {
                this.deckMesh.position.x = x;
                this.deckMesh.position.y = y;
                this.deckMesh.position.z = z;
                this.deckMesh.updateMatrixWorld();
                this.deckBoundingBox.applyMatrix4(this.selectionMesh.matrixWorld);
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
        let result = false;
        if (this._hasInitialised()) {
            if (this.deckBoundingBox && raycaster.ray.intersectsBox(this.deckBoundingBox)) {
                result = true;
            }

            if (this.selectionBoundingBox && raycaster.ray.intersectsBox(this.selectionBoundingBox)) {
                result = true;
            }
        }
        this.hover = result;
        return result;
    }

    isHover() {
        return this.hover;
    }

    select() {
        this.selected = true;
    }

    deselect() {
        this.selected = false;
    }

    _requestMeshAndTextureUpdate() {
        let cardConfig = undefined;
        if (this._hasCards()) {
            const topCard = this.cards[this.cards.length - 1];
            cardConfig = { type: topCard.type, ...CardDB[topCard.type][topCard.index]};
        }

        this.queuedUpdate.topCardConfig = cardConfig;
        this.queuedUpdate.isComplete = false;
        this.queuedUpdate.isReady = false;

        if (cardConfig) {
            this.materialManager.loadCardMaterial(cardConfig.type, cardConfig).then(() => {
                this.queuedUpdate.isReady = true;
            }).catch((err) => {
                console.log(err);
            });
        } else {
            this.queuedUpdate.isReady = true;
        }
    }

    _createDeckMesh() {
        const geoms = [];
        const numOfCards = this.cards.length;

        if (this._hasCardDeckMesh()) {
            this.scene.remove(this.deckMesh);
            this.deckMesh.geometry.dispose();
            // this.materialManager.disposeCardMaterial(type, name); TODO: Should store current top card, and new top card seperately
            this.deckMesh = undefined;
            this.deckBoundingBox = undefined;
        }

        if (numOfCards > 0) {
            const cardConfig = this.queuedUpdate.topCardConfig;
            const xRotationRad = MathUtils.degToRad(!this.isFaceDown ? -90 : 90); // TODO: This will probably make the cards inverted when you flip them over
            for (let i = 0; i < numOfCards; i++) {
                const tempGeometry = CardGeometry.create();
                tempGeometry.rotateX(xRotationRad);
                tempGeometry.rotateY(MathUtils.degToRad(MathUtils.randFloat(-2, 2)));
                tempGeometry.translate(MathUtils.randFloat(-.01, .01), (Global.CardThickness * i) + (Global.CardThickness / 2), MathUtils.randFloat(-.01, .01));
                geoms.push(tempGeometry);
            }
            const deckGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms);

            deckGeometry.clearGroups();
            for (let i = 0; i < numOfCards; i++) {
                const startIndex = 36 * i;
                const group2Index = startIndex + (4 * 6);
                const group3Index = startIndex + (4 * 6) + 6;
                deckGeometry.addGroup(startIndex, (4 * 6) /* 4 Faces */, 0);
                deckGeometry.addGroup(group2Index, (1 * 6) /* 1 Faces */, 1);
                deckGeometry.addGroup(group3Index, (1 * 6) /* 1 Faces */, 2);
            }

            for (let i = 0; i < geoms.length; i++) {
                geoms[i].dispose();
            }

            this.deckMesh = new Mesh(deckGeometry,
                [
                    this.materialManager.getCardEdgeMaterial(cardConfig.type),
                    this.materialManager.getCardMaterial(cardConfig.type, cardConfig.name),
                    this.materialManager.getCardBackMaterial(cardConfig.type),
                ]
            );
            this.deckMesh.receiveShadow = true;
            this.deckMesh.castShadow = true;

            this.deckBoundingBox = new Box3(
                new Vector3(-(Global.CardWidth / 2), 0, -(Global.CardHeight / 2)),
                new Vector3((Global.CardWidth / 2), (Global.CardThickness * numOfCards), (Global.CardHeight / 2)),
            );
        }
    }

    _createSelectionMesh() {
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
        const selectionGeometry = BufferGeometryUtils.mergeBufferGeometries(geoms);

        for (let i = 0; i < geoms.length; i++) {
            geoms[i].dispose();
        }

        this.selectionMesh = new Mesh(selectionGeometry, this.materialManager.getOtherMaterials('SELECTED'));
        this.selectionMesh.receiveShadow = true;

        this.selectionBoundingBox = new Box3(
            new Vector3(-((Global.CardWidth / 2) + margin + thickness), 0, -((Global.CardHeight / 2) + margin + thickness)),
            new Vector3(((Global.CardWidth / 2) + margin + thickness), thickness, ((Global.CardHeight / 2) + margin + thickness)),
        );
    }

    /**
     * Does a card deck mesh exist?
     * @returns {boolean}
     */
    _hasCardDeckMesh() {
        return this.deckMesh;
    }

    /**
     * Does a selection mesh exist and it's bounding box? Means the Deck has been initialised.
     * @returns {boolean}
     */
    _hasInitialised() {
        return this.selectionMesh && this.selectionBoundingBox;
    }

    /**
     * Does the cards array exist and has at least 1 card in it?
     * @returns {boolean}
     */
    _hasCards() {
        return this.cards && this.cards.length > 0;
    }

    /**
     * Is there a deck update queued?
     * @returns {boolean}
     */
    _hasQueuedUpdate() {
        return !this.queuedUpdate.isComplete;
    }

    /**
     * Is there a deck update queued or has the deck not been initialised?
     * @returns {boolean}
     */
    _isCardDeckLocked() {
        return this._hasQueuedUpdate() || !this._hasInitialised();
    }
}

export { Deck };