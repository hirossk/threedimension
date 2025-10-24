import * as THREE from 'three';

export const raycaster = new THREE.Raycaster();
// export a simple global mouse vector used by input.js
export const __mouse = new THREE.Vector2();

export function mouseSetup(clientX, clientY) {
    __mouse.x = (clientX / window.innerWidth) * 2 - 1;
    __mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    // also expose on window for convenience
    window.__mouse = __mouse;
}
