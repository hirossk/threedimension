import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { createTextMesh } from './textMesh.js';

// デバッグパネル用の変数
let debugPanel = null;
let debugText = "";
// 軸マッピング自動検出 (Quest 3/Meta 標準)
let axisMapping = { leftX: 2, leftZ: 3, rightX: 0, rightZ: 1 };
let detectionFrames = 0;

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

// XR セッション開始 / 終了のイベント監視
renderer.xr.addEventListener('sessionstart', () => {
    updateDebugPanel('Debug Info:\nXR Session: Started');
});
renderer.xr.addEventListener('sessionend', () => {
    updateDebugPanel('Debug Info:\nXR Session: Ended');
});

// デバッグ用の移動速度
const MOVE_SPEED = 0.1;
const DEAD_ZONE = 0.15;

// アニメーションループ
renderer.setAnimationLoop(() => {
    let debugInfo = "Debug Info:\n";

    if (renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        if (session) {
            debugInfo += "XR Session: Active\n";
            let hasMovement = false;

            // --- 修正点 1：controller.gamepad を直接ポーリング ---

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

                debugInfo += `Gamepad ${moveController.handedness || 'N/A'} Axes[${axes.length}]: [${Array.from(axes).map(v => v.toFixed(2)).join(', ')}]\n`;

                if (axes.length >= 4) { // Quest 3 などの標準的なコントローラー
                    const moveX = axes[axisMapping.leftX] || 0; // axes[2]
                    const moveZ = axes[axisMapping.leftZ] || 0; // axes[3]
                    debugInfo += `Left Stick: X=${moveX.toFixed(2)}, Z=${moveZ.toFixed(2)}\n`;

                    if (Math.abs(moveX) > DEAD_ZONE || Math.abs(moveZ) > DEAD_ZONE) {
                        hasMovement = true;

                        // --- 修正点 2：カメラの向きに基づいた移動 ---

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
            } else {
                debugInfo += `No controller.gamepad available for movement\n`;
            }

            // --- (古い session.inputSources.forEach ループ (移動処理) は削除) ---

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
            // レイの向きをデバッグ表示
            if (controller1) {
                const rayDir = new THREE.Vector3(0, 0, -1);
                rayDir.applyMatrix4(controller1.matrixWorld);
                debugInfo += `Ray1: (${rayDir.x.toFixed(2)}, ${rayDir.y.toFixed(2)}, ${rayDir.z.toFixed(2)})\n`;
            }
            if (controller2) {
                const rayDir = new THREE.Vector3(0, 0, -1);
                rayDir.applyMatrix4(controller2.matrixWorld);
                debugInfo += `Ray2: (${rayDir.x.toFixed(2)}, ${rayDir.y.toFixed(2)}, ${rayDir.z.toFixed(2)})\n`;
            }
            // デバッグ情報 (inputSources の生情報)
            debugInfo += `Input Sources Count: ${session.inputSources.length}\n`;
            session.inputSources.forEach(source => {
                debugInfo += `  Hand: ${source.handedness}, Gamepad: ${source.gamepad ? 'Yes' : 'No'}\n`;
            });


            debugInfo += `Rig: (${rig.position.x.toFixed(2)}, ${rig.position.z.toFixed(2)})\n`;
            debugInfo += `Moving: ${hasMovement ? "YES" : "NO"}`;
        } else {
            debugInfo += "XR Session: No Active Session";
        }
    } else {
        debugInfo += "XR Session: Not Presenting";
        // fallback: ブラウザの Gamepad API を参照
        try {
            const gps = navigator.getGamepads ? navigator.getGamepads() : [];
            const gpList = [];
            for (let i = 0; i < gps.length; i++) {
                const g = gps[i];
                if (!g) continue;
                gpList.push({ index: g.index, id: g.id, axes: g.axes ? Array.from(g.axes).map(v => v.toFixed(2)) : [], buttons: g.buttons ? g.buttons.length : 0 });
            }
            if (gpList.length > 0) {
                debugInfo += `\nGamepads:\n${JSON.stringify(gpList)}`;
            } else {
                debugInfo += `\nGamepads: none`;
            }
        } catch (e) {
            debugInfo += `\nGamepads: error`;
        }
    }

    // 毎フレームデバッグパネルを更新
    updateDebugPanel(debugInfo);
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
    // 既存のパネルを削除（親がある場合は親から外す）
    if (debugPanel) {
        if (debugPanel.parent) debugPanel.parent.remove(debugPanel);
        debugPanel.geometry.dispose && debugPanel.geometry.dispose();
        if (debugPanel.material) {
            debugPanel.material.map && debugPanel.material.map.dispose();
            debugPanel.material.dispose();
        }
    }
    debugText = text;
    // デバッグパネルをより小さく・中心に表示
    debugPanel = createTextMesh(text, 18, '#000000');  // フォントサイズを小さく
    // カメラにアタッチして常に視界内に表示させる
    // 中央寄り・少し上に表示（ローカル座標）
    debugPanel.position.set(0, 0.25, -0.8);
    debugPanel.rotation.set(0, 0, 0);
    // 全体を縮小して控えめに表示
    debugPanel.scale.set(0.35, 0.35, 0.35);
    camera.add(debugPanel);
}

// ブラウザの Gamepad API をチェックして文字列で返す (WebXRとは別)
function detectGamepadsString() {
    try {
        const gps = navigator.getGamepads ? navigator.getGamepads() : [];
        const gpList = [];
        for (let i = 0; i < gps.length; i++) {
            const g = gps[i];
            if (!g) continue;
            gpList.push({ index: g.index, id: g.id, axes: g.axes ? Array.from(g.axes).map(v => v.toFixed(2)) : [], buttons: g.buttons ? g.buttons.length : 0 });
        }
        if (gpList.length > 0) {
            return `Gamepads: ${JSON.stringify(gpList)}`;
        }
        return 'Gamepads: none';
    } catch (e) {
        return 'Gamepads: error';
    }
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
    controller1.addEventListener('connected', (event) => {
        console.log('controller1 connected', event);

        // --- 修正点 3：event.data から gamepad と handedness をアタッチ ---
        if (event.data && event.data.gamepad) {
            controller1.gamepad = event.data.gamepad;
            controller1.handedness = event.data.handedness; // 利き手情報も保存
        }

        const data = event && event.data ? event.data : event;
        const gpInfo = detectGamepadsString();
        updateDebugPanel(`Debug Info:\nController 1 connected\n${JSON.stringify(data)}\n${gpInfo}`);
    });
    controller1.addEventListener('disconnected', () => {
        console.log('controller1 disconnected');
        controller1.gamepad = null; // 切断時にクリア
        controller1.handedness = null;
        updateDebugPanel('Debug Info:\nController 1 disconnected');
    });
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('connected', (event) => {
        console.log('controller2 connected', event);

        // --- 修正点 4：controller2 にも同様の処理を追加 ---
        if (event.data && event.data.gamepad) {
            controller2.gamepad = event.data.gamepad;
            controller2.handedness = event.data.handedness; // 利き手情報も保存
        }

        const data = event && event.data ? event.data : event;
        const gpInfo = detectGamepadsString();
        updateDebugPanel(`Debug Info:\nController 2 connected\n${JSON.stringify(data)}\n${gpInfo}`);
    });
    controller2.addEventListener('disconnected', () => {
        console.log('controller2 disconnected');
        controller2.gamepad = null; // 切断時にクリア
        controller2.handedness = null;
        updateDebugPanel('Debug Info:\nController 2 disconnected');
    });
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
            // 動的インポートを使用して quizController の循環参照を回避 (推奨)
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
    // --- 修正点 5：この関数のロジックは setAnimationLoop 内に統合されました ---
    // main.js など外部からこの関数を呼び出す必要はなくなりました。
    // もし呼び出している場合は、その呼び出しを削除してください。
    // console.log('handleMovement() is deprecated. Movement is handled in setAnimationLoop.');
}