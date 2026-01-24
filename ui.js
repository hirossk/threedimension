// ============================================================
// ui.js - UIパネルの作成
// ============================================================
// スコア表示、タイマー、操作説明などのUIを管理します。
// 表示テキストは config.js で変更できます。
// ============================================================

// ============================================================
// config.js から設定を読み込み
// ============================================================
import { uiText } from './config.js';

// ============================================================
// スコアを更新する関数
// ============================================================
export function updateScore(score) {
    const el = document.getElementById('score');
    if (el) el.textContent = `スコア: ${score}`;
}

// タイマー変数（モジュールスコープ）
let startTime = null;
let timerInterval = null;

// ============================================================
// UIパネルを作成する関数
// ============================================================
export function createInfoPanel() {
    // ============================================================
    // 左上の情報パネル
    // ============================================================
    const info = document.createElement('div');
    info.id = 'info';
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.left = '10px';
    info.style.color = 'white';
    info.style.background = 'rgba(0,0,0,0.5)';
    info.style.padding = '10px';
    info.style.borderRadius = '5px';

    // ============================================================
    // 右上のタイマーパネル
    // ============================================================
    const timerPanel = document.createElement('div');
    timerPanel.id = 'timer';
    timerPanel.style.position = 'absolute';
    timerPanel.style.top = '10px';
    timerPanel.style.right = '10px';
    timerPanel.style.color = 'white';
    timerPanel.style.background = 'rgba(0,0,0,0.5)';
    timerPanel.style.padding = '10px';
    timerPanel.style.borderRadius = '5px';
    timerPanel.style.fontSize = '24px';
    timerPanel.style.fontFamily = 'monospace';
    timerPanel.textContent = '00:00.0';
    document.body.appendChild(timerPanel);

    // ============================================================
    // スコア表示
    // ============================================================
    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score';
    scoreDiv.style.fontSize = '20px';
    scoreDiv.style.fontWeight = 'bold';
    scoreDiv.style.color = '#FFD700';  // 金色
    scoreDiv.textContent = `${uiText.version} スコア: 0`;
    info.appendChild(scoreDiv);

    // ============================================================
    // PC操作説明
    // ============================================================
    // uiText.pcControls で変更可能
    // ============================================================
    const controls = document.createElement('div');
    controls.textContent = uiText.pcControls;
    info.appendChild(controls);

    // ============================================================
    // VR操作説明
    // ============================================================
    // uiText.vrControls で変更可能
    // ============================================================
    const vr = document.createElement('div');
    vr.textContent = uiText.vrControls;
    info.appendChild(vr);

    document.body.appendChild(info);

    // タイマーを開始
    startTimer();
}

// ============================================================
// タイマーを開始する関数
// ============================================================
export function startTimer() {
    if (startTime === null) {
        startTime = Date.now();
        updateTimer();
        timerInterval = setInterval(updateTimer, 100); // 1/10秒ごとに更新
    }
}

// ============================================================
// タイマーを停止する関数
// ============================================================
export function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// ============================================================
// タイマー表示を更新する関数（内部使用）
// ============================================================
function updateTimer() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const tenths = Math.floor((elapsed % 1000) / 100);

    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}
