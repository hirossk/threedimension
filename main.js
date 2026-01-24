// ============================================================
// main.js - アプリケーションのエントリポイント
// ============================================================
// このファイルはアプリケーションの起動処理を行います。
// 設定を変更したい場合は config.js を編集してください。
// ============================================================

import { scene, camera, renderer, handleResize } from './scene.js';
import { createInfoPanel } from './ui.js';
import { displayQuestion } from './quizController.js';

// ============================================================
// アプリケーションの初期化
// ============================================================

// UI パネルを作成
createInfoPanel();

// 最初の問題を表示
displayQuestion();

// リサイズ対応
window.addEventListener('resize', handleResize);
