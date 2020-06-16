import { CardDB } from "../card/CardDB";
import { Deck } from "./Deck";
import { Scene } from "three";
import { MaterialManager } from "../MaterialManager";

class DeckUtils {

    /**
     * @param {MaterialManager} materialManager
     * @param {Scene} scene
     * @param {Vector3} position
     * @param {String} deckType
     */
    static makeDeck(materialManager, scene, position, deckType) {
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
        return new Deck(materialManager, scene, position, cards, true);
    }
}

export { DeckUtils };