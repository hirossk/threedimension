import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// レイキャスター用の変数
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
export let controller1, controller2;

// シーン、カメラ、レンダラーを初期化してエクスポートする
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 初期位置を低く・後方に設定して問題が見えにくい距離にする
camera.position.set(0, 0.6, 20);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// コントローラーの初期化
initControllers();

// アニメーションループ
renderer.setAnimationLoop(() => {
    handleMovement();
    renderer.render(scene, camera);
});

// 照明
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

const backLight = new THREE.DirectionalLight(0xffffff, 0.8);
backLight.position.set(-5, 5, -5);
scene.add(backLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));

// 地面
const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x228B22 })
);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// resize ユーティリティ
export function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// コントローラーの初期化
export function initControllers() {
    // コントローラーの追加
    controller1 = renderer.xr.getController(0);
    controller1.addEventListener('selectstart', onSelectStart);
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    scene.add(controller2);

    // コントローラーモデルの追加
    const controllerModelFactory = new XRControllerModelFactory();
    
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    scene.add(controllerGrip1);

    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    scene.add(controllerGrip2);

    // レイ表示用の線
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);
    const line = new THREE.Line(geometry);
    line.name = 'line';
    line.scale.z = 5;

    controller1.add(line.clone());
    controller2.add(line.clone());
}

// 選択開始時の処理
function onSelectStart(event) {
    const controller = event.target;
    const intersections = getIntersections(controller);

    if (intersections.length > 0) {
        const intersection = intersections[0];
        const object = intersection.object;
        if (object.userData && object.userData.isAnswer) {
            import('./quizController.js').then(module => {
                module.markAnswer(object);
            });
        }
    }
}

// レイキャストによる交差判定
function getIntersections(controller) {
    tempMatrix.identity().extractRotation(controller.matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    
    // シーン内の全オブジェクトから、userData.isAnswerを持つものをフィルタリング
    const answerObjects = [];
    scene.traverse((object) => {
        if (object.userData && object.userData.isAnswer) {
            answerObjects.push(object);
        }
    });
    
    return raycaster.intersectObjects(answerObjects);
}

// 移動システムの実装
export function handleMovement() {
    if (!renderer.xr.isPresenting) return;

    const session = renderer.xr.getSession();
    if (!session) return;

    for (const source of session.inputSources) {
        if (source.gamepad) {
            const axes = source.gamepad.axes;
            if (axes.length >= 4) {
                const speed = 0.1;
                // カメラの向きに基づいて移動方向を計算
                const angle = camera.rotation.y;
                const moveX = axes[2] * speed;
                const moveZ = axes[3] * speed;
                
                // カメラの向きに応じて移動方向を回転
                camera.position.x += Math.cos(angle) * moveX - Math.sin(angle) * moveZ;
                camera.position.z += Math.sin(angle) * moveX + Math.cos(angle) * moveZ;
            }
        }
    }
}
