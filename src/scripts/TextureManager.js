import { TAROT, GENERAL } from './CardTypes';
import { TextureLoader, Texture, UnsignedByteType, PMREMGenerator, RepeatWrapping, LinearFilter, sRGBEncoding } from 'three';
import { RGBELoader } from './helpers/RGBELoader';

class TextureManager {
    constructor(renderer) {
        this.renderer = renderer;

        this.textureLoader = new TextureLoader();
        this.textureMap = {};

        this.environmentLoader = new RGBELoader();
        this.environmentLoader.setDataType(UnsignedByteType);
        this.environmentID = 'environment_map';
        this.environmentPath = 'public/environment/environment_map_living_room.hdr';

        this.loadingMap = {};
    }

    async loadEnvironmentMap() {
        const id = this.environmentID;
        const path = this.environmentPath;
        if (this.textureMap[id] === undefined) {
            if (this.loadingMap[id] === undefined) {
                this.loadingMap[id] = this._requestEnvironmentFromLoader(path).then((texture) => {
                    console.log('finished loading environment: ', path);
                    this.textureMap[id] = texture;
                    return texture;
                });
                return this.loadingMap[id];
            } else {
                return this.loadingMap[id];
            }
        }
        return this.textureMap[id];
    }

    /**
     * @async
     * @param {String} id
     * @returns {Texture}
     */
    async loadTarotTexture(id) {
        return this._loadTexture(id, TAROT[id]);
    }

    /**
     * @async
     * @param {String} id
     * @returns {Texture}
     */
    async loadGeneralTexture(id) {
        return this._loadTexture(id, GENERAL[id]);
    }

    /**
     * @param {String} id
     * @returns {Texture}
     */
    getTexture(id) {
        return this.textureMap[id];
    }

    /**
     *
     * @param {String} id
     * @param {String} path
     * @returns {Promise<Texture>}
     */
    async _loadTexture(id, path) {
        console.assert(id !== undefined, `who the hell is calling me with an undefined id (${id}, ${path})`);
        console.assert(path !== undefined, `who the hell is calling me with an undefined path (${id}, ${path})`);
        if (this.textureMap[id] === undefined) {
            if (this.loadingMap[id] === undefined) {
                this.loadingMap[id] = this._requestTextureFromLoader(path).then((texture) => {
                    console.log('finished loading texture: ', path);
                    texture.wrapS = RepeatWrapping;
                    texture.wrapT = RepeatWrapping;
                    texture.encoding = sRGBEncoding;
                    texture.anisotropy = Math.floor(this.renderer.capabilities.getMaxAnisotropy() * .75);
                    this.textureMap[id] = texture;
                    return texture;
                });
                return this.loadingMap[id];
            } else {
                return this.loadingMap[id];
            }
        }
        return this.textureMap[id];
    }

    /**
     * @async
     * @param {String} path
     * @returns {Promise<Texture>}
     */
    async _requestTextureFromLoader(path) {
        console.log('loading texture: ', path);
        return this.textureLoader.loadAsync(path);
    }

    /**
     * @async
     * @param {String} path
     * @returns {Promise<Texture>}
     */
    async _requestEnvironmentFromLoader(path) {
        console.log('loading environment: ', path);
        const promise = new Promise((res) => {
            const gen = new PMREMGenerator(this.renderer);
            gen.compileEquirectangularShader();
            this.environmentLoader.load(path, (texture) => {
                const envMap = gen.fromEquirectangular(texture).texture;
                texture.dispose();
                gen.dispose();
                res(envMap);
            });
        });
        return await promise;
    }
}

export { TextureManager };