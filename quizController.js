import * as THREE from 'three';
import { scene } from './scene.js';
import { quizData } from './quizData.js';
import { createTextMesh } from './textMesh.js';
import { updateScore } from './ui.js';

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

    const titleMesh = createTextMesh('この漢字の読みは？', 60, '#2C3E50');
    titleMesh.position.set(0, 3.5, 0);
    scene.add(titleMesh);
    textMeshes.push(titleMesh);

    questionMesh = createTextMesh(quiz.kanji, 120, '#E74C3C');
    questionMesh.position.set(0, 2.5, 0);
    scene.add(questionMesh);

    const shuffled = [...quiz.readings].map((reading, i) => ({ text: reading, isCorrect: i === quiz.correct }));
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const colors = [0x66BB6A, 0x42A5F5, 0xFFA726];
    shuffled.forEach((item, i) => {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 1, 0.5),
            new THREE.MeshStandardMaterial({ color: colors[i] })
        );
        box.position.set((i - 1) * 2.5, 1.5, -2);
        box.userData = { isAnswer: true, correct: item.isCorrect, index: i };
        scene.add(box);
        answerBoxes.push(box);

        const text = createTextMesh(item.text, 80, '#2C3E50');
        text.position.set(box.position.x, box.position.y, box.position.z + 0.26);
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
