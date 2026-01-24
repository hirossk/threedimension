// ============================================================
// textMesh.js - 3Dテキストの作成
// ============================================================
// テキストパネル（看板）を作成します。
// 背景色やグラデーションは config.js で変更できます。
// ============================================================

import * as THREE from 'three';

// ============================================================
// config.js から設定を読み込み
// ============================================================
import { textPanelColors } from './config.js';

// ============================================================
// 3Dテキストメッシュを作成する関数
// ============================================================
// text: 表示するテキスト
// size: フォントサイズ（30〜150くらいが目安）
// color: テキストの色（'#RRGGBB'形式）
// ============================================================
export function createTextMesh(text, size, color) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 640;
    canvas.height = 256;

    // ============================================================
    // グラデーション背景（暖色系）
    // ============================================================
    // Step 6 で変更可能: textPanelColors（config.js）
    // ============================================================
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, textPanelColors.gradientStart);     // 開始色
    gradient.addColorStop(0.5, textPanelColors.gradientMiddle);  // 中間色
    gradient.addColorStop(1, textPanelColors.gradientEnd);       // 終了色
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ============================================================
    // 枠線を描画
    // ============================================================
    ctx.strokeStyle = textPanelColors.borderColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // ============================================================
    // テキストを描画
    // ============================================================
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

    // ============================================================
    // 3Dメッシュを作成
    // ============================================================
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide  // 両面表示
    });
    const geometry = new THREE.PlaneGeometry(2.5, 1);

    return new THREE.Mesh(geometry, material);
}
