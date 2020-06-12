import { CardCube } from './CardCube';
import { Deck } from './DeckCube';
import { OrbitControls } from './helpers/OrbitControls';
import { sRGBEncoding, Clock, Scene, PerspectiveCamera, WebGLRenderer, Color, AxesHelper, PCFSoftShadowMap, Vector3, Raycaster, Vector2 } from 'three';
import { Table } from './Table';
import { TextureManager } from './TextureManager';
import { WorldLights } from './WorldLights';
import '../styles/index.scss';
import { DeckUtils } from './DeckUtils';
import { CardTypes, CardDB } from './CardDB';

const clock = new Clock();

const scene = new Scene();
scene.background = new Color(0xa8dcff);

const camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);

const mouse = new Vector2();
const ray = new Raycaster();

const renderer = new WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.outputEncoding = sRGBEncoding;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const axesHelper = new AxesHelper(5);
scene.add(axesHelper);

// const boxGeometry = new BoxGeometry();
// const boxMaterial = new MeshPhongMaterial({ color: 0x00ff00 });
// const box = new Mesh(boxGeometry, boxMaterial);
// box.castShadow = true;
// box.receiveShadow = true;
// box.position.y = 1.5;
// scene.add(box);

const orbit = new OrbitControls(camera, renderer.domElement);
const worldLights = new WorldLights(scene);

camera.position.z = 2;
camera.position.y = 5;
camera.position.x = 0;
camera.lookAt(0, 0, 0);

// const cameraHelper = new CameraHelper(worldLights.lights[1].shadow.camera);
// scene.add(cameraHelper);

const textureManager = new TextureManager(renderer);

const table = new Table(textureManager, scene, new Vector3(0, 0, 0), 30);
// const deck = new Deck(textureManager, scene, new Vector3(3, 0, 1));
const deckEmpty = DeckUtils.makeDeck(textureManager, scene, new Vector3(-2, 0, 0), CardTypes.EMPTY);
const deckFull = DeckUtils.makeDeck(textureManager, scene, new Vector3(2, 0, 0), CardTypes.TAROT_CARDS);

// const cDebug = new CardCube(textureManager, scene, 'two_of_wands', new Vector3(-2, 1, -2));
// const cDebug2 = new CardCube(textureManager, scene, 'five_of_swords', new Vector3(-2, 2, 0));

// const c1 = new Card(textureManager, scene, '19_the_sun', new Vector3(1, 2, -1));
// const c2 = new Card(textureManager, scene, 'knight_of_cups', new Vector3(4, 2, 0));

const animate = function () {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // cameraHelper.update();

  // cDebug.update();
  // cDebug2.update();
  // cDebug2.rotate(40 * delta);

  orbit.update();

  // c1.update();
  // c1.rotate(40 * delta);
  // c2.update();

  table.update();
  deckEmpty.update();
  deckFull.update();

  ray.setFromCamera(mouse, camera);
  deckEmpty.raycast(ray);
  deckFull.raycast(ray);

  renderer.render(scene, camera);
};

function onMouseMove( event ) {
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

window.addEventListener('keyup', function(event) {
  const key = event.key;
  if (key === 'Enter') {
    const c = deckFull.removeCardFromTop();
    if (c) {
      console.log(`removed card: ${CardDB[c.type][c.index].name}`);
      c.faceddown = false;
      deckEmpty.addCardToTop(c);
    }
  }
});

animate();
