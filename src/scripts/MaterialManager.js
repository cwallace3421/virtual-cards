import { CardTypes } from './card/CardDB';
import { Texture, TextureLoader, RepeatWrapping, sRGBEncoding, Renderer, MeshStandardMaterial } from 'three';

class MaterialManager {

    constructor(renderer, performanceMode = false) {
        this.performanceMode = performanceMode;
        this.baseUrlPath = 'public';

        if (this.performanceMode) {
            this.baseUrlPath = this.baseUrlPath + '/low'
        } else {
            this.baseUrlPath = this.baseUrlPath + '/high'
        }

        /** @type {Number} */
        this.paperRoughness = .4;

        /** @type {Number} */
        this.feltRoughness = .8;

        /** @type {Renderer} */
        this.renderer = renderer;

        /** @type {TextureLoader} */
        this.textureLoader = new TextureLoader();

        this.materials = {
            [CardTypes.TAROT_CARDS]: {},
            [CardTypes.PLAYING_CARDS]: {},
            TABLE: undefined,
            HOVER: undefined,
            SELECTED: undefined,
        };

        this.textures = {
            normal: {
                paper: undefined,
                felt: undefined,
            }
        };
    }

    async init() {
        await this._loadTextureNormals();
        await Promise.all([
            this._loadCardBackMaterials(),
            this._loadCardEdgeMaterials(),
            this._loadOtherMaterials(),
        ]);
    }

    async _loadTextureNormals() {
        await Promise.all([
            this.textureLoader.loadAsync(`${this.baseUrlPath}/paper_normal.jpg`).then(texture => ({type: 'paper', texture})),
            this.textureLoader.loadAsync(`${this.baseUrlPath}/felt_normal.jpg`).then(texture => ({type: 'felt', texture})),
        ]).then(results => {
            for (let i = 0; i < results.length; i++) {
                this._processTexture(results[i].texture);
                this.textures.normal[results[i].type] = results[i].texture;
            }
            console.info('Material Manager: Texture normals have been loaded');
        });
    }

    async _loadCardBackMaterials() {
        console.assert(this.textures.normal.paper !== undefined, 'the paper normal texture has not been loaded');
        await Promise.all([
            this.textureLoader.loadAsync(`${this.baseUrlPath}/tarot/back.jpg`).then(texture => ({type: CardTypes.TAROT_CARDS, texture})),
            // this.textureLoader.loadAsync(`${this.baseUrlPath}/playing/back.jpg`).then(texture => ({type: CardTypes.PLAYING_CARDS, texture})),
        ]).then(results => {
            for (let i = 0; i < results.length; i++) {
                this._processTexture(results[i].texture);
                this.materials[results[i].type][MaterialManager.BACK] = {
                    material: new MeshStandardMaterial({
                        map: results[i].texture,
                        normalMap: this.textures.normal.paper,
                        roughness: this.paperRoughness,
                    }),
                };
            }
            console.info('Material Manager: Card back materials have been loaded');
        });
    }

    /**
     * @param {String} cardType
     * @returns {MeshStandardMaterial}
     */
    getCardBackMaterial(cardType) {
        console.assert(Object.keys(CardTypes).includes(cardType), 'not a valid card type: ' + cardType);
        return this.materials[cardType][MaterialManager.BACK].material;
    }

    async _loadCardEdgeMaterials() {
        this.materials[CardTypes.TAROT_CARDS][MaterialManager.EDGE] = {
            material: new MeshStandardMaterial({ color: 0x030301, roughness: this.paperRoughness }),
        };
        this.materials[CardTypes.PLAYING_CARDS][MaterialManager.EDGE] = {
            material: new MeshStandardMaterial({ color: 0xEEEEEE, roughness: this.paperRoughness }),
        };
        console.info('Material Manager: Card edge materials have been loaded');
    }

    /**
     * @param {String} cardType
     * @returns {MeshStandardMaterial}
     */
    getCardEdgeMaterial(cardType) {
        console.assert(Object.keys(CardTypes).includes(cardType), 'not a valid card type: ' + cardType);
        return this.materials[cardType][MaterialManager.EDGE].material;
    }

    async _loadOtherMaterials() {
        // Table
        console.assert(this.textures.normal.felt !== undefined, 'the felt normal texture has not been loaded');
        await this.textureLoader.loadAsync(`${this.baseUrlPath}/felt_albedo.jpg`).then(texture => {
            this._processTexture(texture);
            this.materials.TABLE = {
                material: new MeshStandardMaterial({
                    map: texture,
                    normalMap: this.textures.normal.felt,
                    roughness: this.feltRoughness,
                }),
            };
            const texScale = 10;
            this.materials.TABLE.material.map.repeat.set(texScale, texScale);
            this.materials.TABLE.material.normalMap.repeat.set(texScale, texScale);
            console.info('Material Manager: Table material has been loaded');
        });

        this.materials.HOVER = {
            material: new MeshStandardMaterial({ color: 0x999999, roughness: 1 }),
        };
        this.materials.SELECTED = {
            material: new MeshStandardMaterial({ color: 0x999999, roughness: 1 }),
        };
    }

    getOtherMaterials(type) {
        return this.materials[type].material;
    }

    /**
     * @param {String} cardType
     * @param {any} cardConfig
     * @returns {Promise}
     */
    loadCardMaterial(cardType, cardConfig) {
        console.assert(Object.keys(CardTypes).includes(cardType), 'not a valid card type: ' + cardType);

        if (this.materials[cardType][cardConfig.name]) {
            if (this.materials[cardType][cardConfig.name].material) {
                return Promise.resolve();
            }
            if (this.materials[cardType][cardConfig.name].promise) {
                return this.materials[cardType][cardConfig.name].promise;
            }
            console.error('Material Manager: This should never occur');
        }

        this.materials[cardType][cardConfig.name] = {
            promise: undefined,
            material: undefined,
            refCount: 0,
        };

        const loadingPromise = this.textureLoader.loadAsync(`${this.baseUrlPath}/${cardConfig.path}`)
            .then(texture => {
                this._processTexture(texture);
                this.materials[cardType][cardConfig.name].material = new MeshStandardMaterial({
                    map: texture,
                    normalMap: this.textures.normal.paper,
                    roughness: this.paperRoughness,
                });
                this.materials[cardType][cardConfig.name].promise = undefined;
            });

        this.materials[cardType][cardConfig.name].promise = loadingPromise;

        return loadingPromise;
    }

    getCardMaterial(cardType, cardName) {
        console.assert(Object.keys(CardTypes).includes(cardType), 'not a valid card type: ' + cardType);
        console.assert(this.materials[cardType][cardName] !== undefined, 'card material has not been loaded: ' + cardName);
        this.materials[cardType][cardName].refCount = this.materials[cardType][cardName].refCount + 1;
        return this.materials[cardType][cardName].material;
    }

    disposeCardMaterial(cardType, cardName) {
        console.assert(Object.keys(CardTypes).includes(cardType), 'not a valid card type: ' + cardType);
        if (this.materials[cardType][cardName] && this.materials[cardType][cardName].material) {
            this.materials[cardType][cardName].refCount = this.materials[cardType][cardName].refCount - 1;
            if (this.materials[cardType][cardName].refCount <= 0) {
                this.materials[cardType][cardName].material.dispose();
                this.materials[cardType][cardName] = undefined;
            }
        }
    }

    /**
     * @param {Texture} texture
     */
    _processTexture(texture) {
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.encoding = sRGBEncoding;

        if (this.performanceMode) {
            texture.anisotropy = Math.floor(this.renderer.capabilities.getMaxAnisotropy() / 2);
        } else {
            texture.anisotropy = 2;
        }
    }

}

MaterialManager.BACK = 'BACK';
MaterialManager.EDGE = 'EDGE';

export { MaterialManager };