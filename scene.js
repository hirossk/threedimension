import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';

// 軸マッピング (Quest 3/Meta 標準)
let axisMapping = { leftX: 2, leftZ: 3, rightX: 0, rightZ: 1 };

// レイキャスター用の変数
const raycaster = new THREE.Raycaster();
const tempMatrix = new THREE.Matrix4();
export let controller1, controller2;

// キーボード状態管理
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);
let cameraRotationY = 0;

// シーン、カメラ、レンダラーを初期化してエクスポートする
export const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);

export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// 初期位置を低く・後方に設定して問題が見えにくい距離にする
camera.position.set(0, 0.6, 20);

// プレイヤー用の rig を作成してカメラはその子にする
export const rig = new THREE.Group();
rig.name = 'rig';
rig.position.set(0, 0, 0);
rig.add(camera);
scene.add(rig);

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

// コントローラーの初期化
initControllers();

// マウスクリックでの選択を追加（PC用）
const mouse = new THREE.Vector2();
renderer.domElement.addEventListener('click', onMouseClick);

function onMouseClick(event) {
    // マウス座標を正規化デバイス座標に変換 (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // カメラからレイキャスト
    raycaster.setFromCamera(mouse, camera);

    // 選択肢のオブジェクトを取得
    const answerObjects = [];
    scene.traverse((object) => {
        if (object.userData && object.userData.isAnswer) {
            answerObjects.push(object);
        }
    });

    const intersects = raycaster.intersectObjects(answerObjects);
    if (intersects.length > 0) {
        const object = intersects[0].object;
        // 動的インポートを使用して quizController の循環参照を回避
        import('./quizController.js').then(module => {
            module.markAnswer(object);
        });
    }
}

// デバッグ用の移動速度
const MOVE_SPEED = 0.1;
const DEAD_ZONE = 0.15;

// アニメーションループ
renderer.setAnimationLoop(() => {
    // --- キーボード操作（PC用、VR外） ---
    if (!renderer.xr.isPresenting) {
        const speed = 0.1;
        const rotSpeed = 0.03;
        
        if (keys['q'] || keys['Q']) cameraRotationY += rotSpeed;
        if (keys['e'] || keys['E']) cameraRotationY -= rotSpeed;
        rig.rotation.y = cameraRotationY;

        const direction = new THREE.Vector3();
        if (keys['w'] || keys['W']) direction.z -= speed;
        if (keys['s'] || keys['S']) direction.z += speed;
        if (keys['a'] || keys['A']) direction.x -= speed;
        if (keys['d'] || keys['D']) direction.x += speed;
        direction.applyEuler(rig.rotation);
        rig.position.add(direction);
    }
    
    // --- VRモード ---
    if (renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        if (session) {
            // 左手コントローラー（移動用）を特定
            let moveController = null;
            if (controller1 && controller1.handedness === 'left' && controller1.gamepad) {
                moveController = controller1;
            } else if (controller2 && controller2.handedness === 'left' && controller2.gamepad) {
                moveController = controller2;
            }
            // 利き手が未設定（または両方右手）の場合は、見つかった方を使う (フォールバック)
            else if (controller1 && controller1.gamepad) {
                moveController = controller1;
            } else if (controller2 && controller2.gamepad) {
                moveController = controller2;
            }

            if (moveController) {
                const gamepad = moveController.gamepad;
                const axes = gamepad.axes;

                if (axes.length >= 4) { // Quest 3 などの標準的なコントローラー
                    const moveX = axes[axisMapping.leftX] || 0; // axes[2]
                    const moveZ = axes[axisMapping.leftZ] || 0; // axes[3]

                    if (Math.abs(moveX) > DEAD_ZONE || Math.abs(moveZ) > DEAD_ZONE) {
                        // カメラの向き（Y軸は無視）を取得
                        const direction = new THREE.Vector3();
                        camera.getWorldDirection(direction);
                        direction.y = 0;
                        direction.normalize();

                        // 右方向のベクトルを計算
                        const right = new THREE.Vector3();
                        right.crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();

                        // rig (プレイヤー) の位置を更新
                        // スティック奥 (moveZ < 0) で前進 (direction)
                        // ※ VRのZ軸は手前が+のため、-moveZ を使う
                        rig.position.addScaledVector(direction, -moveZ * MOVE_SPEED);
                        // スティック右 (moveX > 0) で右移動 (right)
                        rig.position.addScaledVector(right, moveX * MOVE_SPEED);
                    }
                }
            }

            // 右スティックで回転（右手コントローラーを特定）
            let rotateController = null;
            if (controller1 && controller1.handedness === 'right' && controller1.gamepad) {
                rotateController = controller1;
            } else if (controller2 && controller2.handedness === 'right' && controller2.gamepad) {
                rotateController = controller2;
            }

            if (rotateController) {
                const gamepad = rotateController.gamepad;
                const axes = gamepad.axes;
                
                if (axes.length >= 2) {
                    const rotateX = axes[0]; // 右スティック左右
                    
                    if (Math.abs(rotateX) > DEAD_ZONE) {
                        // rigをY軸回転（スナップターン or スムーズターン）
                        rig.rotation.y -= rotateX * 0.02; // 感度調整可能
                    }
                }
            }
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
    controller1.addEventListener('connected', (event) => {
        if (event.data && event.data.gamepad) {
            controller1.gamepad = event.data.gamepad;
            controller1.handedness = event.data.handedness;
        }
    });
    controller1.addEventListener('disconnected', () => {
        controller1.gamepad = null;
        controller1.handedness = null;
    });
    rig.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('connected', (event) => {
        if (event.data && event.data.gamepad) {
            controller2.gamepad = event.data.gamepad;
            controller2.handedness = event.data.handedness;
        }
    });
    controller2.addEventListener('disconnected', () => {
        controller2.gamepad = null;
        controller2.handedness = null;
    });
    rig.add(controller2);

    // コントローラーモデルの追加
    const controllerModelFactory = new XRControllerModelFactory();
    
    const controllerGrip1 = renderer.xr.getControllerGrip(0);
    controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1));
    rig.add(controllerGrip1);

    const controllerGrip2 = renderer.xr.getControllerGrip(1);
    controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2));
    rig.add(controllerGrip2);

    // レイ表示用の線（明るい緑で見やすく）
    const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, -1)
    ]);
    const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        })
    );
    line.name = 'line';
    line.scale.z = 10;  // 長めに表示

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
            // 動的インポートを使用して quizController の循環参照を回避
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
    // この関数のロジックは setAnimationLoop 内に統合されました
    // main.js など外部からこの関数を呼び出す必要はなくなりました
}