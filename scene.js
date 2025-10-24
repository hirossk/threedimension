import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

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
