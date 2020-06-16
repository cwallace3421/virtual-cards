import { BoxBufferGeometry } from "three";
import { Global } from "../Global";

class CardGeometry {
    /**
     * Creates Card Cube Geometry
     * @static
     * @returns {BoxBufferGeometry}
     */
    static create() {
        const geometry = new BoxBufferGeometry(Global.CardWidth, Global.CardHeight, Global.CardThickness);
        let vertexCount = 0;
        const uvAttribute = geometry.attributes.uv;
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
        return geometry;
    }
}

export { CardGeometry };