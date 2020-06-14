import { OrbitControls } from './helpers/OrbitControls';
import { sRGBEncoding, Clock, Scene, PerspectiveCamera, WebGLRenderer, Color, AxesHelper, PCFSoftShadowMap, Vector3, Raycaster, Vector2, Camera } from 'three';
import { Table } from './Table';
import { TextureManager } from './TextureManager';
import { MaterialManager } from './MaterialManager';
import { WorldLights } from './WorldLights';
import { DeckUtils } from './DeckUtils';
import { CardTypes, CardDB } from './CardDB';
import '../styles/index.scss';

/** @type {Scene} */
let scene;

/** @type {PerspectiveCamera} */
let camera;

/** @type {WebGLRenderer} */
let renderer;

/** @type {OrbitControls} */
let controls;

/** @type {WorldLights} */
let lights;

/** @type {AxesHelper} */
let axesHelper;

/** @type {MaterialManager} */
let materialManager;

/** @type {TextureManager} */
let textureManager;

/** @type {Table} */
let table;

/** @type {Array<Deck>} */
let decks;

const clock = new Clock();
const mouse = new Vector2();
const ray = new Raycaster();

/**
 * Load Function
 */
let loadStarted = false;
let loadComplete = false;
function load() {
  loadStarted = true;
  scene = new Scene();
  scene.background = new Color(0xa8dcff);

  camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 2);
  camera.lookAt(0, 0, 0);

  renderer = new WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.physicallyCorrectLights = true;
  renderer.outputEncoding = sRGBEncoding;
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  axesHelper = new AxesHelper(5);
  scene.add(axesHelper);

  controls = new OrbitControls(camera, renderer.domElement);
  lights = new WorldLights(scene);

  textureManager = new TextureManager(renderer);
  loadComplete = true;
  // materialManager = new MaterialManager(renderer, false);
  // materialManager.init().then(() => {
  //   loadComplete = true;
  // });
}

/**
 * Create Function
 */
let createStarted = false
let createComplete = false;
function create() {
  createStarted = true;
  table = new Table(textureManager, scene, new Vector3(0, 0, 0), 30);
  decks = [
    DeckUtils.makeDeck(textureManager, scene, new Vector3(-2, 0, 0), CardTypes.EMPTY),
    DeckUtils.makeDeck(textureManager, scene, new Vector3(2, 0, 0), CardTypes.TAROT_CARDS),
  ];
  createComplete = true;
}

/**
 * Update Function
 * @param {Number} delta
 */
function update(delta) {
  controls.update();

  ray.setFromCamera(mouse, camera);

  table.update();
  for (let i = 0; i < decks.length; i++) {
    decks[i].update();
    decks[i].raycast(ray);
  }

  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (loadComplete && createComplete) {
    update(delta);
    return;
  }

  if (!loadStarted) {
    console.info('Main: Load started');
    load();
    return;
  }

  if (loadComplete && !createStarted) {
    console.info('Main: Complete started');
    create();
    return;
  }
};

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

function onWindowResize() {
  if (loadComplete) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
window.addEventListener('resize', onWindowResize, false);

window.addEventListener('keyup', function (event) {
  const key = event.key;
  // if (key === 'Enter') {
  //   const c = deckFull.removeCardFromTop();
  //   if (c) {
  //     console.log(`removed card: ${CardDB[c.type][c.index].name}`);
  //     c.faceddown = false;
  //     deckEmpty.addCardToTop(c);
  //   }
  // }
});

animate();
