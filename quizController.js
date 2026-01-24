// ============================================================
// quizController.js - クイズのロジック
// ============================================================
// クイズの問題表示、回答判定、スコア管理を行います。
// 色やサイズの設定は config.js で変更できます。
// ============================================================

import * as THREE from 'three';
import { scene } from './scene.js';
import { quizData } from './quizData.js';
import { createTextMesh } from './textMesh.js';
import { updateScore, stopTimer } from './ui.js';

// ============================================================
// config.js から設定を読み込み
// ============================================================
import {
    answerBoxColors,
    textColors,
    textSizes,
    answerBox,
    questionPosition,
    gameSettings,
    uiText,
    effectSettings
} from './config.js';

// クイズ状態（モジュール内で管理）
export let currentQuiz = 0;
export let score = 0;
export let answerBoxes = [];
let questionMesh = null;
let textMeshes = [];
let particles = []; // パーティクル用

// ============================================================
// パーティクル（キラキラ）を削除する関数
// ============================================================
function clearParticles() {
    particles.forEach(p => scene.remove(p));
    particles = [];
}

// ============================================================
// 正解時のパーティクルエフェクトを作成する関数
// ============================================================
function createParticleEffect(position) {
    if (!effectSettings.enabled || !effectSettings.correct.showParticles) return;

    const count = effectSettings.correct.particleCount;
    const color = effectSettings.correct.particleColor;

    for (let i = 0; i < count; i++) {
        const geometry = new THREE.SphereGeometry(0.05, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);

        // ランダムな位置に配置
        particle.position.copy(position);
        particle.position.x += (Math.random() - 0.5) * 2;
        particle.position.y += (Math.random() - 0.5) * 2;
        particle.position.z += (Math.random() - 0.5) * 2;

        // 速度を設定
        particle.userData.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            Math.random() * 0.1 + 0.05,
            (Math.random() - 0.5) * 0.1
        );
        particle.userData.life = 1.0;

        scene.add(particle);
        particles.push(particle);
    }

    // パーティクルをアニメーション
    animateParticles();
}

// ============================================================
// パーティクルをアニメーションする関数
// ============================================================
function animateParticles() {
    if (particles.length === 0) return;

    particles.forEach((particle, index) => {
        particle.position.add(particle.userData.velocity);
        particle.userData.life -= 0.02;
        particle.material.opacity = particle.userData.life;

        if (particle.userData.life <= 0) {
            scene.remove(particle);
            particles.splice(index, 1);
        }
    });

    if (particles.length > 0) {
        requestAnimationFrame(animateParticles);
    }
}

// ============================================================
// 不正解時の揺れエフェクト
// ============================================================
function shakeEffect(mesh) {
    if (!effectSettings.enabled || !effectSettings.incorrect.shake) return;

    const originalPosition = mesh.position.clone();
    let shakeCount = 0;
    const maxShakes = 10;

    function shake() {
        if (shakeCount >= maxShakes) {
            mesh.position.copy(originalPosition);
            return;
        }

        mesh.position.x = originalPosition.x + (Math.random() - 0.5) * 0.2;
        mesh.position.z = originalPosition.z + (Math.random() - 0.5) * 0.2;
        shakeCount++;

        setTimeout(shake, 30);
    }

    shake();
}

// ============================================================
// 問題を表示する関数
// ============================================================
export function displayQuestion() {
    // 全問終了したら結果を表示
    if (currentQuiz >= quizData.length) {
        showResult();
        return;
    }

    // 前の問題を削除
    if (questionMesh) scene.remove(questionMesh);
    answerBoxes.forEach(box => scene.remove(box));
    textMeshes.forEach(t => scene.remove(t));
    clearParticles();
    answerBoxes = [];
    textMeshes = [];

    const quiz = quizData[currentQuiz];

    // ============================================================
    // 問題の位置をランダムに決定
    // ============================================================
    // Step 5 で変更可能: questionPosition（config.js）
    // ============================================================
    const randomAngle = Math.random() * Math.PI * 2; // 0-360度
    const randomDistance = questionPosition.minDistance +
        Math.random() * (questionPosition.maxDistance - questionPosition.minDistance);
    const x = Math.sin(randomAngle) * randomDistance;
    const z = Math.cos(randomAngle) * randomDistance;

    // ============================================================
    // タイトル（「この漢字の読みは？」）を表示
    // ============================================================
    // Step 4 で変更可能: textColors.questionTitle, textSizes.questionTitle
    // ============================================================
    const titleMesh = createTextMesh(
        uiText.questionPrompt,
        textSizes.questionTitle,
        textColors.questionTitle
    );
    titleMesh.position.set(x, questionPosition.titleHeight, z);
    titleMesh.lookAt(0, questionPosition.titleHeight, 0); // プレイヤーの方向を向く
    scene.add(titleMesh);
    textMeshes.push(titleMesh);

    // ============================================================
    // 漢字（問題）を表示
    // ============================================================
    // Step 4 で変更可能: textColors.kanjiQuestion, textSizes.kanjiQuestion
    // ============================================================
    questionMesh = createTextMesh(
        quiz.kanji,
        textSizes.kanjiQuestion,
        textColors.kanjiQuestion
    );
    questionMesh.position.set(x, questionPosition.kanjiHeight, z);
    questionMesh.lookAt(0, questionPosition.kanjiHeight, 0); // プレイヤーの方向を向く
    scene.add(questionMesh);

    // ============================================================
    // 選択肢をシャッフル
    // ============================================================
    const choices = quiz.readings.map((reading, i) => ({
        text: reading,
        isCorrect: i === quiz.correct
    }));

    // Fisher-Yatesシャッフルアルゴリズムで選択肢をシャッフル
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }

    // ============================================================
    // 選択肢ボックスを作成
    // ============================================================
    // Step 3 で変更可能: answerBoxColors（config.js）
    // Step 5 で変更可能: answerBox（config.js）
    // ============================================================
    choices.forEach((item, i) => {
        // 選択肢を問題の手前に配置（扇形）
        const baseAngle = Math.atan2(x, z); // 問題の位置に基づく基準角度
        // 問題の正面側に配置
        const spread = answerBox.spread;
        const angle = baseAngle + ((i - 1) * spread);
        const radius = answerBox.radius;

        // 問題から見て手前側に選択肢を配置
        const toPlayerVector = new THREE.Vector3(-x, 0, -z).normalize();
        const rightVector = new THREE.Vector3(-z, 0, x).normalize();
        const boxPosition = new THREE.Vector3(x, 0, z)
            .add(toPlayerVector.multiplyScalar(radius * 0.8)) // 手前に
            .add(rightVector.multiplyScalar(radius * Math.sin((i - 1) * spread))); // 左右に広げる

        // ============================================================
        // ボックスを作成
        // ============================================================
        // Step 3: answerBoxColors[i] でボタンの色を変更
        // Step 5: answerBox.width, height, depth でサイズを変更
        // ============================================================
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(
                answerBox.width,
                answerBox.height,
                answerBox.depth
            ),
            new THREE.MeshStandardMaterial({ color: answerBoxColors[i] })
        );
        box.position.set(boxPosition.x, answerBox.positionY, boxPosition.z);

        // 箱を問題とは反対の方向に向ける
        box.lookAt(
            box.position.x + (box.position.x - x),
            answerBox.positionY,
            box.position.z + (box.position.z - z)
        );
        box.userData = { isAnswer: true, correct: item.isCorrect, index: i };
        scene.add(box);
        answerBoxes.push(box);

        // ============================================================
        // 選択肢のテキストを表示
        // ============================================================
        // Step 4 で変更可能: textColors.answerText, textSizes.answerText
        // ============================================================
        const text = createTextMesh(
            item.text,
            textSizes.answerText,
            textColors.answerText
        );
        text.position.copy(box.position);
        text.position.y = box.position.y;

        // 問題の位置から選択肢への方向ベクトルを計算
        const toBoxVector = new THREE.Vector3()
            .subVectors(box.position, new THREE.Vector3(x, box.position.y, z))
            .normalize();

        // テキストを選択肢の箱の前面に配置
        text.position.add(toBoxVector.multiplyScalar(0.26));

        // テキストを問題とは反対の方向に向ける（180度回転）
        text.lookAt(
            text.position.x + (text.position.x - x),
            text.position.y,
            text.position.z + (text.position.z - z)
        );
        scene.add(text);
        textMeshes.push(text);
    });
}

// ============================================================
// 結果を表示する関数
// ============================================================
export function showResult() {
    if (questionMesh) scene.remove(questionMesh);
    answerBoxes.forEach(box => scene.remove(box));
    textMeshes.forEach(t => scene.remove(t));
    clearParticles();
    answerBoxes = [];
    textMeshes = [];

    // タイマーを停止
    stopTimer();

    // ============================================================
    // 「クイズ終了！」を表示
    // ============================================================
    // Step 4 で変更可能: textColors.resultTitle, textSizes.resultTitle
    // ============================================================
    const title = createTextMesh(
        uiText.quizComplete,
        textSizes.resultTitle,
        textColors.resultTitle
    );
    title.position.set(0, 2.5, 0);
    scene.add(title);

    // ============================================================
    // スコアを表示
    // ============================================================
    // Step 4 で変更可能: textColors.resultScore, textSizes.resultScore
    // ============================================================
    const scoreText = uiText.scoreFormat
        .replace('{score}', score)
        .replace('{total}', quizData.length);

    questionMesh = createTextMesh(
        scoreText,
        textSizes.resultScore,
        textColors.resultScore
    );
    questionMesh.position.set(0, 1.5, 0);
    scene.add(questionMesh);
}

// ============================================================
// 回答を判定する関数
// ============================================================
// Step 6 で変更可能: effectSettings（config.js）でエフェクトをカスタマイズ
// ============================================================
export function markAnswer(selected) {
    // selected: THREE.Mesh
    if (!selected || !selected.userData || !selected.userData.isAnswer) return false;

    // ============================================================
    // 正解の場合の処理
    // ============================================================
    if (selected.userData.correct) {
        score++;
        updateScore(score);

        // エフェクトが有効な場合
        if (effectSettings.enabled) {
            const effect = effectSettings.correct;

            // 色を変更
            selected.material.color.setHex(effect.color);

            // 発光エフェクト
            selected.material.emissive = new THREE.Color(effect.emissiveColor);
            selected.material.emissiveIntensity = effect.emissiveIntensity;

            // サイズを変更
            selected.scale.set(effect.scale, effect.scale, effect.scale);

            // パーティクルエフェクト
            createParticleEffect(selected.position);
        }
    } else {
        // ============================================================
        // 不正解の場合の処理
        // ============================================================

        // エフェクトが有効な場合
        if (effectSettings.enabled) {
            const effect = effectSettings.incorrect;

            // 色を変更
            selected.material.color.setHex(effect.color);

            // 発光エフェクト
            selected.material.emissive = new THREE.Color(effect.emissiveColor);
            selected.material.emissiveIntensity = effect.emissiveIntensity;

            // サイズを変更
            selected.scale.set(effect.scale, effect.scale, effect.scale);

            // 揺れエフェクト
            shakeEffect(selected);
        }
    }

    currentQuiz++;

    // ============================================================
    // 次の問題を表示（遅延あり）
    // ============================================================
    // gameSettings.nextQuestionDelay で遅延時間を変更可能
    // ============================================================
    setTimeout(displayQuestion, gameSettings.nextQuestionDelay);
    return true;
}
