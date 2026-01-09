import { scene, camera, renderer, handleResize } from './scene.js';
import { createInfoPanel } from './ui.js';
import { displayQuestion } from './quizController.js';
// import { updateMovement, addControllerToScene } from './input.js';

// UI 作成
createInfoPanel();

// 初期表示
displayQuestion();

// VR コントローラをシーンに追加
addControllerToScene(scene);

// レンダーループ
renderer.setAnimationLoop(() => {
    // updateMovement();
    renderer.render(scene, camera);
});

// リサイズ対応
window.addEventListener('resize', handleResize);
