export function updateScore(score) {
    const el = document.getElementById('score');
    if (el) el.textContent = `スコア: ${score}`;
}

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

    const scoreDiv = document.createElement('div');
    scoreDiv.id = 'score';
    scoreDiv.style.fontSize = '20px';
    scoreDiv.style.fontWeight = 'bold';
    scoreDiv.style.color = '#FFD700';
    scoreDiv.textContent = 'スコア: 0';
    info.appendChild(scoreDiv);

    const controls = document.createElement('div');
    controls.textContent = 'PC: WASD移動 / QE左右回転 / クリックで回答';
    info.appendChild(controls);

    const vr = document.createElement('div');
    vr.textContent = 'Quest 3: VRボタンでVRモード開始';
    info.appendChild(vr);

    document.body.appendChild(info);
}
