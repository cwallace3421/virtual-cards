import { BoxBufferGeometry } from "three";
import { Global } from "./Global";

class CardGeometry {
    /**
     * Creates Card Cube Geometry
     * @summary Requires in index order: 0 -> Edges, 1 -> Front, 2 -> Back
     * @static
     * @returns {BoxBufferGeometry}
     */
    static create() {
        const geometry = new BoxBufferGeometry(Global.CardWidth, Global.CardHeight, Global.CardThickness);
        // geometry.clearGroups();
        // geometry.addGroup(0, (4 * 6), 0);
        // geometry.addGroup((4 * 6), 6, 1);
        // geometry.addGroup((4 * 6) + 6, 6 , 2);

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