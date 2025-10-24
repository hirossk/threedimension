import * as THREE from 'three';
import { scene } from './scene.js';
import { quizData } from './quizData.js';
import { createTextMesh } from './textMesh.js';
import { updateScore, stopTimer } from './ui.js';

// クイズ状態（モジュール内で管理）
export let currentQuiz = 0;
export let score = 0;
export let answerBoxes = [];
let questionMesh = null;
let textMeshes = [];

export function displayQuestion() {
    if (currentQuiz >= quizData.length) {
        showResult();
        return;
    }

    if (questionMesh) scene.remove(questionMesh);
    answerBoxes.forEach(box => scene.remove(box));
    textMeshes.forEach(t => scene.remove(t));
    answerBoxes = [];
    textMeshes = [];

    const quiz = quizData[currentQuiz];

    // ランダムな位置を生成（背後や遠方）
    const randomAngle = Math.random() * Math.PI * 2; // 0-360度
    const randomDistance = 15 + Math.random() * 10; // 15-25の距離
    const x = Math.sin(randomAngle) * randomDistance;
    const z = Math.cos(randomAngle) * randomDistance;
    
    // タイトルと問題を新しい位置に配置
    const titleMesh = createTextMesh('この漢字の読みは？', 60, '#2C3E50');
    titleMesh.position.set(x, 3.5, z);
    titleMesh.lookAt(0, 3.5, 0); // プレイヤーの方向を向く
    scene.add(titleMesh);
    textMeshes.push(titleMesh);

    questionMesh = createTextMesh(quiz.kanji, 120, '#E74C3C');
    questionMesh.position.set(x, 2.5, z);
    questionMesh.lookAt(0, 2.5, 0); // プレイヤーの方向を向く
    scene.add(questionMesh);

    // 選択肢の配列を作成してシャッフル
    const choices = quiz.readings.map((reading, i) => ({
        text: reading,
        isCorrect: i === quiz.correct
    }));
    
    // Fisher-Yatesシャッフルアルゴリズムで選択肢をシャッフル
    for (let i = choices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    const colors = [0x66BB6A, 0x42A5F5, 0xFFA726];
    choices.forEach((item, i) => {
        // 選択肢を問題の手前に配置（扇形）
        const baseAngle = Math.atan2(x, z); // 問題の位置に基づく基準角度
        // 問題の正面側に120度の扇形を作る（-60度から+60度）
        const spread = Math.PI / 3; // 60度
        const angle = baseAngle + ((i - 1) * spread); 
        const radius = 4; // 問題からの距離
        
        // 問題から見て手前側に選択肢を配置
        const toPlayerVector = new THREE.Vector3(-x, 0, -z).normalize();
        const rightVector = new THREE.Vector3(-z, 0, x).normalize();
        const boxPosition = new THREE.Vector3(x, 0, z)
            .add(toPlayerVector.multiplyScalar(radius * 0.8)) // 手前に
            .add(rightVector.multiplyScalar(radius * Math.sin((i - 1) * spread))); // 左右に広げる

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1, 0.5),
            new THREE.MeshStandardMaterial({ color: colors[i] })
        );
        box.position.set(boxPosition.x, 1.5, boxPosition.z);
        // 箱を問題とは反対の方向に向ける
        box.lookAt(
            box.position.x + (box.position.x - x),
            1.5,
            box.position.z + (box.position.z - z)
        );
        box.userData = { isAnswer: true, correct: item.isCorrect, index: i };
        scene.add(box);
        answerBoxes.push(box);

        const text = createTextMesh(item.text, 80, '#2C3E50');
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

export function showResult() {
    if (questionMesh) scene.remove(questionMesh);
    answerBoxes.forEach(box => scene.remove(box));
    textMeshes.forEach(t => scene.remove(t));
    answerBoxes = [];
    textMeshes = [];
    
    // タイマーを停止
    stopTimer();

    const title = createTextMesh('クイズ終了！', 80, '#2C3E50');
    title.position.set(0, 2.5, 0);
    scene.add(title);

    questionMesh = createTextMesh(`スコア: ${score}/${quizData.length}`, 100, '#E74C3C');
    questionMesh.position.set(0, 1.5, 0);
    scene.add(questionMesh);
}

export function markAnswer(selected) {
    // selected: THREE.Mesh
    if (!selected || !selected.userData || !selected.userData.isAnswer) return false;
    if (selected.userData.correct) {
        score++;
        updateScore(score);
    }
    currentQuiz++;
    setTimeout(displayQuestion, 500);
    return true;
}
