import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { createTextMesh } from './textMesh.js';

// デバッグパネル用の変数
let debugPanel = null;
let debugText = "";
// 軸マッピング自動検出
let axisMapping = null; // { x: index, z: index }
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
const MOVE_SPEED = 0.15; // 速度を上げました

// アニメーションループ
renderer.setAnimationLoop(() => {
    let debugInfo = "Debug Info:\n";
    
    if (renderer.xr.isPresenting) {
        const session = renderer.xr.getSession();
        if (session) {
            debugInfo += "XR Session: Active\n";
            let hasMovement = false;
            let inputSourceCount = 0;
            
            session.inputSources.forEach(inputSource => {
                inputSourceCount++;
                debugInfo += `Controller ${inputSource.handedness}: ${inputSource.gamepad ? "Connected" : "No Gamepad"}\n`;

                // 普通は inputSource.gamepad を使うが、ブラウザによっては未提供なので
                // navigator.getGamepads() をフォールバックで参照する
                let gamepad = inputSource.gamepad;
                if (!gamepad && navigator.getGamepads) {
                    try {
                        const gps = navigator.getGamepads();
                        // idやaxes長で可能性のある gamepad を探す（最初の有効なものを選択）
                        for (let gi = 0; gi < gps.length; gi++) {
                            const g = gps[gi];
                            if (!g) continue;
                            // 目安：axesを持っているものを優先
                            if (g.axes && g.axes.length > 0) { gamepad = g; break; }
                        }
                    } catch (e) {
                        // ignore
                    }
                }
                if (gamepad) {
                    // 入力値の表示（全軸）
                    if (gamepad.axes) {
                        debugInfo += `Axes: [${gamepad.axes.map(v => v.toFixed(2)).join(", ")} ]\n`;
                    } else {
                        debugInfo += `Axes: none\n`;
                    }

                    // 自動軸検出: まだマッピングがなければ、スティックを動かしてもらい検出する
                    if (!axisMapping) {
                        detectionFrames++;
                        const axes = gamepad.axes || [];
                        const candidates = [];
                        for (let ai = 0; ai < axes.length; ai++) {
                            if (Math.abs(axes[ai]) > 0.15) candidates.push(ai);
                        }
                        if (candidates.length >= 2) {
                            axisMapping = { x: candidates[0], z: candidates[1] };
                            updateDebugPanel(`Debug Info:\nAxis mapping detected: x=${axisMapping.x}, z=${axisMapping.z}`);
                            console.log('Axis mapping detected', axisMapping);
                        } else if (detectionFrames > 120) {
                            // 検出に失敗したら初期推定（2要素なら0/1、4要素なら2/3）
                            if (axes.length >= 4) axisMapping = { x: 2, z: 3 };
                            else if (axes.length >= 2) axisMapping = { x: 0, z: 1 };
                            if (axisMapping) updateDebugPanel(`Debug Info:\nAxis mapping fallback: x=${axisMapping.x}, z=${axisMapping.z}`);
                        }
                    }

                    // 左スティックの値を取得（自動検出したインデックスを使う）
                    const axes = gamepad.axes || [];
                    let moveX = 0;
                    let moveZ = 0;
                    if (axisMapping) {
                        moveX = axes[axisMapping.x] || 0;
                        moveZ = axes[axisMapping.z] || 0;
                    } else {
                        // マッピング未定なら従来の推定を使う
                        if (axes.length >= 4) { moveX = axes[2]; moveZ = axes[3]; }
                        else if (axes.length >= 2) { moveX = axes[0]; moveZ = axes[1]; }
                    }

                    // デッドゾーン（小さな入力を無視）
                    if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
                        hasMovement = true;
                        // 左手のコントローラーだけで移動するようにする（handednessがleftの場合）
                        if (inputSource.handedness === 'left' || !inputSource.handedness) {
                            rig.position.x += moveX * MOVE_SPEED;
                            rig.position.z += moveZ * MOVE_SPEED;
                        }
                    }
                }
            });
            
            debugInfo += `Input Sources: ${inputSourceCount}\n`;
            debugInfo += `Rig: (${rig.position.x.toFixed(2)}, ${rig.position.z.toFixed(2)})\n`;
            debugInfo += `Moving: ${hasMovement ? "YES" : "NO"}`;
        } else {
            debugInfo += "XR Session: No Active Session";
        }
    } else {
        debugInfo += "XR Session: Not Presenting";
        // fallback: ブラウザの Gamepad API を参照して、コントローラーが見えているか確認
        try {
            const gps = navigator.getGamepads ? navigator.getGamepads() : [];
            const gpList = [];
            for (let i = 0; i < gps.length; i++) {
                const g = gps[i];
                if (!g) continue;
                gpList.push({ index: g.index, id: g.id, axes: g.axes ? Array.from(g.axes).map(v=>v.toFixed(2)) : [], buttons: g.buttons ? g.buttons.length : 0 });
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
        debugPanel.material && debugPanel.material.map && debugPanel.material.map.dispose();
    }
    debugText = text;
    // 少し小さめのフォントサイズで中央寄りに表示
    debugPanel = createTextMesh(text, 30, '#000000');  // 黒色に変更
    // カメラにアタッチして常に視界内に表示させる
    // 中央寄り・少し下に表示（ローカル座標）
    debugPanel.position.set(0, 0.15, -1.0);
    debugPanel.rotation.set(0, 0, 0);
    // 全体を縮小して見た目を小さくする
    debugPanel.scale.set(0.6, 0.6, 0.6);
    camera.add(debugPanel);
}

// ブラウザの Gamepad API をチェックして文字列で返す
function detectGamepadsString() {
    try {
        const gps = navigator.getGamepads ? navigator.getGamepads() : [];
        const gpList = [];
        for (let i = 0; i < gps.length; i++) {
            const g = gps[i];
            if (!g) continue;
            gpList.push({ index: g.index, id: g.id, axes: g.axes ? Array.from(g.axes).map(v=>v.toFixed(2)) : [], buttons: g.buttons ? g.buttons.length : 0 });
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
        // 詳細な接続情報を表示
        const data = event && event.data ? event.data : event;
        const gpInfo = detectGamepadsString();
        updateDebugPanel(`Debug Info:\nController 1 connected\n${JSON.stringify(data)}\n${gpInfo}`);
    });
    controller1.addEventListener('disconnected', () => {
        console.log('controller1 disconnected');
        updateDebugPanel('Debug Info:\nController 1 disconnected');
    });
    scene.add(controller1);

    controller2 = renderer.xr.getController(1);
    controller2.addEventListener('selectstart', onSelectStart);
    controller2.addEventListener('connected', (event) => {
        console.log('controller2 connected', event);
        const data = event && event.data ? event.data : event;
        const gpInfo = detectGamepadsString();
        updateDebugPanel(`Debug Info:\nController 2 connected\n${JSON.stringify(data)}\n${gpInfo}`);
    });
    controller2.addEventListener('disconnected', () => {
        console.log('controller2 disconnected');
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
                if (axes.length >= 2) {
                    // 一部のプラットフォームはaxesが2要素（スティック）で返る
                    let moveX = 0;
                    let moveZ = 0;
                    if (axes.length >= 4) {
                        moveX = axes[2];
                        moveZ = axes[3];
                    } else {
                        moveX = axes[0];
                        moveZ = axes[1];
                    }

                    // 大きな動きのみ反応（デッドゾーン）
                    if (Math.abs(moveX) > 0.1 || Math.abs(moveZ) > 0.1) {
                        rig.position.x += moveX * MOVE_SPEED;
                        rig.position.z += moveZ * MOVE_SPEED;
                        console.log('Movement detected:', moveX, moveZ);
                    }
                }
        }
    });
}
