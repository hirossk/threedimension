import { raycaster, mouseSetup } from './utils.js';
import { camera, renderer } from './scene.js';
import { markAnswer, answerBoxes } from './quizController.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import * as THREE from 'three';

// キー状態
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

let cameraRotationY = 0;

export function updateMovement() {
    const speed = 0.1;
    const rotSpeed = 0.03;
    if(keys['q'] || keys['Q']) cameraRotationY += rotSpeed;
    if(keys['e'] || keys['E']) cameraRotationY -= rotSpeed;
    camera.rotation.y = cameraRotationY;

    const direction = new THREE.Vector3();
    if(keys['w'] || keys['W']) direction.z -= speed;
    if(keys['s'] || keys['S']) direction.z += speed;
    if(keys['a'] || keys['A']) direction.x -= speed;
    if(keys['d'] || keys['D']) direction.x += speed;
    direction.applyEuler(camera.rotation);
    camera.position.add(direction);
}

export function onSelect(event) {
    // mouse pos を utils 経由でセット
    mouseSetup(event.clientX, event.clientY);
    raycaster.setFromCamera(window.__mouse, camera);
    const intersects = raycaster.intersectObjects(answerBoxes);
    if (intersects.length > 0) markAnswer(intersects[0].object);
}

// DOM クリック
window.addEventListener('click', onSelect);

// VR controller
const controller1 = renderer.xr.getController(0);
controller1.addEventListener('selectstart', () => {
    raycaster.setFromXRController(controller1);
    const intersects = raycaster.intersectObjects(answerBoxes);
    if (intersects.length > 0) markAnswer(intersects[0].object);
});

const controllerModelFactory = new XRControllerModelFactory();
const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));

export function addControllerToScene(scene) {
    scene.add(controller1);
    scene.add(controllerGrip1);
}
