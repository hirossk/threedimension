export function updateScore(score) {
    const el = document.getElementById('score');
    if (el) el.textContent = `スコア: ${score}`;
}

// タイマー変数（モジュールスコープ）
let startTime = null;
let timerInterval = null;

export function createInfoPanel() {
    const info = document.createElement('div');
    info.id = 'info';
    info.style.position = 'absolute';
    info.style.top = '10px';
    info.style.left = '10px';
    info.style.color = 'white';
    info.style.background = 'rgba(0,0,0,0.5)';
    info.style.padding = '10px';
    info.style.borderRadius = '5px';

    // タイマー表示用のパネル
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

    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score';
    scoreDiv.style.fontSize = '20px';
    scoreDiv.style.fontWeight = 'bold';
    scoreDiv.style.color = '#FFD700';
    scoreDiv.textContent = 'v0.080.08スコア: 0';
    info.appendChild(scoreDiv);

    const controls = document.createElement('div');
    controls.textContent = 'PC: WASD移動 / QE左右回転 / クリックで回答';
    info.appendChild(controls);

    const vr = document.createElement('div');
    vr.textContent = 'Quest 3: VRボタンでVRモード開始';
    info.appendChild(vr);

    document.body.appendChild(info);

    // タイマーを開始
    startTimer();
}

export function startTimer() {
    if (startTime === null) {
        startTime = Date.now();
        updateTimer();
        timerInterval = setInterval(updateTimer, 100); // 1/10秒ごとに更新
    }
}

export function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

function updateTimer() {
    const timerEl = document.getElementById('timer');
    if (!timerEl) return;

    const elapsed = Date.now() - startTime;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    const tenths = Math.floor((elapsed % 1000) / 100);

    timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${tenths}`;
}
