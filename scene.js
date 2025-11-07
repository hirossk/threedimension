import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { createTextMesh } from './textMesh.js';

// デバッグパネル用の変数
let debugPanel = null;
let debugText = "";

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

// デバッグ用の移動速度
const MOVE_SPEED = 0.15; // 速度を上げました

// アニメーションループ
renderer.setAnimationLoop(() => {
    // XRセッション中の移動処理
    if (renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        if (session) {
            let debugInfo = "Debug Info:\n";
            let hasMovement = false;
            
            session.inputSources.forEach(inputSource => {
                if (inputSource.gamepad) {
                    const gamepad = inputSource.gamepad;
                    // 左スティックの値を取得（axes[2]が左右、axes[3]が前後）
                    const moveX = gamepad.axes[2];
                    const moveZ = gamepad.axes[3];
                    
                    debugInfo += `Stick: X=${moveX.toFixed(2)} Z=${moveZ.toFixed(2)}\n`;
                    
                    // デッドゾーン（小さな入力を無視）
                    if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
                        hasMovement = true;
                        // カメラの向きを取得
                        const cameraDirection = new THREE.Vector3();
                        camera.getWorldDirection(cameraDirection);
                        
                        // 移動方向を計算
                        camera.position.x += moveX * MOVE_SPEED;
                        camera.position.z += moveZ * MOVE_SPEED;
                    }
                }
            });
            
            // カメラ位置情報を追加
            debugInfo += `\nCamera:\nX=${camera.position.x.toFixed(2)}\nZ=${camera.position.z.toFixed(2)}\n`;
            debugInfo += `Moving: ${hasMovement ? "YES" : "NO"}`;
            
            // デバッグパネルを更新
            updateDebugPanel(debugInfo);
        }
    }
    
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

// デバッグパネルの作成と更新関数
export function updateDebugPanel(text) {
    if (debugPanel) {
        scene.remove(debugPanel);
    }
    debugText = text;
    debugPanel = createTextMesh(text, 40, '#00FF00');
    // カメラの位置から少し前に配置
    debugPanel.position.set(-2, 2, -3);
    debugPanel.rotation.y = 0; // 正面を向かせる
    scene.add(debugPanel);
}

// 初期デバッグパネルの作成
updateDebugPanel("Debug Info:\nWaiting for input...");

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

// 移動システムの実装（シンプル化）
export function handleMovement() {
    if (!renderer.xr.isPresenting) return;

    const session = renderer.xr.getSession();
    if (!session) return;

    session.inputSources.forEach(source => {
        if (source.gamepad) {
            const axes = source.gamepad.axes;
            if (axes.length >= 4) {
                const moveX = axes[2];  // 左右の移動
                const moveZ = axes[3];  // 前後の移動

                // 大きな動きのみ反応（デッドゾーン）
                if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
                    camera.position.x += moveX * MOVE_SPEED;
                    camera.position.z += moveZ * MOVE_SPEED;
                    console.log('Movement detected:', moveX, moveZ);
                }
            }
        }
    });
}
