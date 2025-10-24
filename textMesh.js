import * as THREE from 'three';

export function createTextMesh(text, size, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;
    
    // グラデーション背景（暖色系）
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#FFE5B4');  // ピーチ
    gradient.addColorStop(0.5, '#FFD4A3'); // 薄いオレンジ
    gradient.addColorStop(1, '#FFC996');  // 暖かいベージュ
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 枠線追加
    ctx.strokeStyle = '#E8B88B';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // テキスト描画（マージンを考慮）
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 長いテキストは自動で折り返し
    const maxWidth = canvas.width - 80; // 左右40pxずつマージン
    const words = text.split('');
    let line = '';
    let lines = [];
    
    for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i];
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
            lines.push(line);
            line = words[i];
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    
    // 複数行の場合は縦方向に配置
    const lineHeight = size * 1.2;
    const startY = (canvas.height - (lines.length - 1) * lineHeight) / 2;
    
    lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
    });
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        side: THREE.DoubleSide  // 両面表示
    });
    const geometry = new THREE.PlaneGeometry(2, 1);
    
    return new THREE.Mesh(geometry, material);
}
