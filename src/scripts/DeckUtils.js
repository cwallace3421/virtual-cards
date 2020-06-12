import { Deck } from "./DeckCube";
import { TextureManager } from "./TextureManager";
import { Scene } from "three";
import { CardDB } from "./CardDB";

class DeckUtils {

    /**
     * @param {TextureManager} textureManager
     * @param {Scene} scene
     * @param {Vector3} position
     * @param {String} deckType
     */
    static makeDeck(textureManager, scene, position, deckType) {
        const cards = [];
        CardDB[deckType].forEach((el, i) => {
            if (el.default_count > 0) {
                for (let c = 0; c < el.default_count; c++) {
                    cards.push({
                        index: i,
                        inverted: false,
                        type: deckType,
                    });
                }
            }
        });
        return new Deck(textureManager, scene, position, cards, true);
    }
}

export { DeckUtils };