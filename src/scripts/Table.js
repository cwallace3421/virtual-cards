import { Color, Scene, Vector3, Mesh, PlaneBufferGeometry, MathUtils } from "three";
import { MaterialManager } from './MaterialManager';

class Table {

    /**
     * @constructor
     * @param {MaterialManager} materialManager
     * @param {Scene} scene
     * @param {Vector3} position
     * @param {Number} size
     * @param {Color} color
     */
    constructor(materialManager, scene, position, size, color = new Color(0xffffff)) {
        this.materialManager = materialManager;
        this.scene = scene;
        this.position = position;
        this.width = size;
        this.height = size;
        this.color = color;
        this.roughness = .8;

        /** @type {Mesh} */
        this.tableMesh = undefined;
    }

    update() {
        if (!this._hasTableMesh()) {
            this._createTableMesh();
            this.setPosition(this.position);
            this.scene.add(this.tableMesh);
            console.log(`table mesh created`);
        }
    }

    setPosition(pos) {
        const { x, y, z } = pos;
        if (this._hasTableMesh()) {
            this.tableMesh.position.x = x;
            this.tableMesh.position.y = y;
            this.tableMesh.position.z = z;

            this.position.x = x;
            this.position.y = y;
            this.position.z = z;
        }
    }

    _createTableMesh() {
        const planeGeometry = new PlaneBufferGeometry(this.width, this.height, 1, 1);
        planeGeometry.rotateX(MathUtils.degToRad(-90));
        planeGeometry.computeVertexNormals();
        this.tableMesh = new Mesh(planeGeometry, this.materialManager.getOtherMaterials('TABLE'));
        this.tableMesh.receiveShadow = true;
        this.tableMesh.name = "Table";
    }

    /**
     * Does the table mesh exist?
     * @returns {boolean}
     */
    _hasTableMesh() {
        return this.tableMesh;
    }
}

export { Table };