# 3Dクイズワールドを作ろう！ - プログラミング体験ワークシート

## はじめに

このワークシートでは、Three.jsを使った3Dクイズゲームをカスタマイズします。
`config.js` ファイルを編集するだけで、あなただけのオリジナルクイズワールドが作れます！

### 準備

1. テキストエディタで `config.js` を開く
2. 変更したら保存（Ctrl + S）
3. ブラウザをリロード（F5）して確認！

---

## Step 1: 自分だけのクイズを作ろう！

**難易度: ★☆☆☆☆（かんたん）**

### やること
クイズの問題と答えを自分で作ります。

### 変更する場所
`config.js` の **18〜26行目** あたり

### 現在のコード
```javascript
export const quizData = [
    { kanji: "確認", readings: ["かくにん", "かんご", "こくご"], correct: 0 },
    { kanji: "読書", readings: ["どくしょ", "よみしょ", "とくしょ"], correct: 0 },
    // ...
];
```

### 書き方のルール
```javascript
{ kanji: "問題", readings: ["正解", "不正解1", "不正解2"], correct: 0 }
```

- `kanji`: 問題として表示される文字
- `readings`: 3つの選択肢
- `correct`: 正解の位置（0 = 1番目、1 = 2番目、2 = 3番目）

### チャレンジ！
下の空欄を埋めて、自分だけのクイズを作ってみよう！

```javascript
{ kanji: "________", readings: ["________", "________", "________"], correct: ___ },
```

### サンプル問題集

**動物クイズ**
```javascript
{ kanji: "犬", readings: ["いぬ", "ねこ", "とり"], correct: 0 },
{ kanji: "猫", readings: ["うま", "ねこ", "さる"], correct: 1 },
{ kanji: "鳥", readings: ["とり", "むし", "さかな"], correct: 0 },
```

**食べ物クイズ**
```javascript
{ kanji: "寿司", readings: ["すし", "ラーメン", "うどん"], correct: 0 },
{ kanji: "餃子", readings: ["カレー", "ぎょうざ", "そば"], correct: 1 },
```

**英単語クイズ（応用）**
```javascript
{ kanji: "Apple", readings: ["りんご", "みかん", "ぶどう"], correct: 0 },
{ kanji: "Cat", readings: ["いぬ", "ねこ", "うさぎ"], correct: 1 },
```

---

## Step 2: 空と地面の色を変えよう！

**難易度: ★☆☆☆☆（かんたん）**

### やること
3Dワールドの空と地面の色を変えます。世界が一瞬で変わる魔法！

### 変更する場所
`config.js` の **38〜43行目** あたり

### 現在のコード
```javascript
export const colors = {
    skyColor: 0x87CEEB,      // 空色
    groundColor: 0x228B22,   // 森の緑
};
```

### 色の書き方
色は `0x` + 6桁の英数字で表します。

### よく使う色一覧

| 色の名前 | コード | 見た目 |
|---------|--------|--------|
| 赤 | `0xFF0000` | 情熱的！ |
| 緑 | `0x00FF00` | 自然！ |
| 青 | `0x0000FF` | クール！ |
| 黄色 | `0xFFFF00` | 明るい！ |
| オレンジ | `0xFFA500` | 元気！ |
| ピンク | `0xFFC0CB` | かわいい！ |
| 紫 | `0x800080` | ミステリアス！ |
| 水色 | `0x00FFFF` | さわやか！ |
| 白 | `0xFFFFFF` | シンプル！ |
| 黒 | `0x000000` | クール！ |
| 空色 | `0x87CEEB` | デフォルト |
| 森の緑 | `0x228B22` | デフォルト |
| 夕焼け | `0xFF6B35` | ロマンチック！ |
| 夜空 | `0x191970` | 神秘的！ |
| 砂漠 | `0xC2B280` | 冒険！ |

### チャレンジ！
好きな組み合わせを選んで入力しよう！

**夕焼けの世界**
```javascript
skyColor: 0xFF6B35,      // 夕焼け色
groundColor: 0xC2B280,   // 砂の色
```

**夜の世界**
```javascript
skyColor: 0x191970,      // 夜空
groundColor: 0x2F4F4F,   // 暗い緑
```

**お菓子の世界**
```javascript
skyColor: 0xFFC0CB,      // ピンク
groundColor: 0x98FB98,   // 薄緑
```

---

## Step 3: 回答ボタンの色を変えよう！

**難易度: ★★☆☆☆（ふつう）**

### やること
3つの選択肢ボタンの色を変えます。

### 変更する場所
`config.js` の **51〜55行目** あたり

### 現在のコード
```javascript
export const answerBoxColors = [
    0x66BB6A,   // 緑色（左のボタン）
    0x42A5F5,   // 青色（中央のボタン）
    0xFFA726    // オレンジ色（右のボタン）
];
```

### チャレンジ！
3つのボタンを好きな色に変えてみよう！

**虹色バージョン**
```javascript
export const answerBoxColors = [
    0xFF0000,   // 赤
    0xFFFF00,   // 黄色
    0x0000FF    // 青
];
```

**パステルバージョン**
```javascript
export const answerBoxColors = [
    0xFFB6C1,   // ライトピンク
    0xADD8E6,   // ライトブルー
    0x98FB98    // ペールグリーン
];
```

**モノクロバージョン**
```javascript
export const answerBoxColors = [
    0x333333,   // 濃いグレー
    0x666666,   // グレー
    0x999999    // 薄いグレー
];
```

---

## Step 4: 文字の色とサイズを変えよう！

**難易度: ★★☆☆☆（ふつう）**

### やること
クイズに表示される文字の色とサイズを変えます。

### 変更する場所
`config.js` の **64〜93行目** あたり

### 文字の色（現在のコード）
```javascript
export const textColors = {
    questionTitle: '#2C3E50',   // 「この漢字の読みは？」
    kanjiQuestion: '#E74C3C',   // 漢字（問題）
    answerText: '#2C3E50',      // 選択肢の文字
    resultTitle: '#2C3E50',     // 「クイズ終了！」
    resultScore: '#E74C3C',     // スコア表示
};
```

### 文字のサイズ（現在のコード）
```javascript
export const textSizes = {
    questionTitle: 60,    // 「この漢字の読みは？」
    kanjiQuestion: 120,   // 漢字（問題）
    answerText: 80,       // 選択肢の文字
    resultTitle: 80,      // 「クイズ終了！」
    resultScore: 100,     // スコア表示
};
```

### 色の書き方（CSS形式）
文字の色は `'#'` + 6桁の英数字で表します。

| 色の名前 | コード |
|---------|--------|
| 赤 | `'#FF0000'` |
| 青 | `'#0000FF'` |
| 緑 | `'#00FF00'` |
| 黒 | `'#000000'` |
| 白 | `'#FFFFFF'` |
| 金色 | `'#FFD700'` |

### サイズの目安
- 30〜50: 小さい
- 60〜80: 普通
- 100〜150: 大きい

### チャレンジ！
漢字を大きく目立たせてみよう！

```javascript
export const textSizes = {
    questionTitle: 50,    // 少し小さく
    kanjiQuestion: 150,   // とても大きく！
    answerText: 70,       // 少し小さく
    resultTitle: 100,     // 大きく
    resultScore: 120,     // 大きく
};
```

---

## Step 5: ボックスの大きさと配置を変えよう！

**難易度: ★★★☆☆（ちょっと難しい）**

### やること
回答ボックスのサイズや位置を調整します。3D空間の座標を学びます！

### 変更する場所
`config.js` の **98〜119行目** あたり

### 現在のコード
```javascript
export const answerBox = {
    width: 1.5,       // 幅
    height: 1.0,      // 高さ
    depth: 0.5,       // 奥行き
    positionY: 1.5,   // 地面からの高さ
    radius: 4,        // 問題からの距離
    spread: Math.PI / 3,  // 広がり角度（60度）
};
```

### 3D座標の考え方
```
        Y（上）
        |
        |
        +------ X（右）
       /
      /
     Z（手前）
```

### チャレンジ！

**大きなボタン**
```javascript
width: 2.5,     // 幅を大きく
height: 1.5,    // 高さを大きく
depth: 0.8,     // 奥行きを大きく
```

**低い位置に配置**
```javascript
positionY: 0.8,   // 低い位置（目線より下）
```

**遠くに配置**
```javascript
radius: 8,        // 遠くに配置
```

**広く配置**
```javascript
spread: Math.PI / 2,   // 90度に広げる
```

---

## Step 6: エフェクトをカスタマイズしよう！

**難易度: ★★☆☆☆（ふつう）**

### やること
正解・不正解のときのエフェクト（色の変化、光る、大きくなる、キラキラ）を設定します。
デフォルトでエフェクトは有効になっています！

### 変更する場所
`config.js` の **effectSettings**（230行目あたり）

### 現在のコード（正解時の設定）
```javascript
export const effectSettings = {
    enabled: true,  // エフェクトを有効にする

    correct: {
        color: 0x00FF00,           // 緑色に変化
        emissiveColor: 0x00FF00,   // 緑色に光る
        emissiveIntensity: 0.8,    // 光の強さ
        scale: 1.3,                // 1.3倍に大きくなる
        showParticles: true,       // キラキラを表示
        particleColor: 0xFFD700,   // 金色のキラキラ
        particleCount: 20,         // キラキラの数
    },

    incorrect: {
        color: 0xFF0000,           // 赤色に変化
        emissiveColor: 0xFF0000,   // 赤色に光る
        emissiveIntensity: 0.3,    // 光の強さ（弱め）
        scale: 0.8,                // 0.8倍に小さくなる
        shake: true,               // ガタガタ揺れる
    },
};
```

### チャレンジ！

**正解でピンクにキラキラ**
```javascript
correct: {
    color: 0xFF69B4,           // ホットピンク
    emissiveColor: 0xFF1493,   // ディープピンク
    emissiveIntensity: 1.0,    // 強く光る
    scale: 1.5,                // 1.5倍に大きく
    showParticles: true,
    particleColor: 0xFFFFFF,   // 白いキラキラ
    particleCount: 30,         // たくさん
},
```

**不正解で真っ黒に**
```javascript
incorrect: {
    color: 0x000000,           // 真っ黒
    emissiveColor: 0x000000,
    emissiveIntensity: 0,
    scale: 0.5,                // 半分のサイズに
    shake: true,
},
```

**エフェクトを無効にする**
```javascript
enabled: false,  // これでエフェクトがオフになる
```

---

## Step 7: 壁（境界）を設定しよう！

**難易度: ★★☆☆☆（ふつう）**

### やること
プレイヤーが移動できる範囲を制限します。壁の見た目も変えられます！

### 変更する場所
`config.js` の **wallSettings**（270行目あたり）

### 現在のコード
```javascript
export const wallSettings = {
    enabled: true,           // 壁を有効にする
    boundaryRadius: 22,      // 移動可能な範囲（半径）
    visible: true,           // 壁を表示する
    height: 5,               // 壁の高さ
    color: 0x87CEEB,         // 壁の色（空色）
    opacity: 0.3,            // 透明度（0.0〜1.0）
    segments: 32,            // 壁の滑らかさ
};
```

### チャレンジ！

**見えない壁（透明）**
```javascript
visible: false,   // 壁は見えないけど、移動は制限される
```

**ピンクの壁**
```javascript
color: 0xFF69B4,     // ホットピンク
opacity: 0.5,        // 半透明
```

**狭い範囲に制限**
```javascript
boundaryRadius: 10,  // 狭い範囲でプレイ
```

**広い範囲に制限**
```javascript
boundaryRadius: 40,  // 広い範囲でプレイ
```

**高い壁**
```javascript
height: 10,          // 高い壁
```

---

## Step 8: if文を理解しよう！（上級）

**難易度: ★★★★☆（プログラミング！）**

### やること
プログラミングの基本「条件分岐」を学びます。
`quizController.js` を直接編集して、独自のエフェクトを追加できます！

### 変更する場所
`quizController.js` の **markAnswer関数**（335行目あたり）

### if文の仕組み
```javascript
if (条件) {
    // 条件が正しいときに実行される
} else {
    // 条件が正しくないときに実行される
}
```

### 現在のコード
```javascript
if (selected.userData.correct) {
    score++;
    updateScore(score);
    // config.js の effectSettings に基づいてエフェクトが実行される
} else {
    // 不正解時のエフェクト
}
```

### チャレンジ！
config.js のエフェクト設定に加えて、独自の処理を追加してみよう！

**コンソールにメッセージを表示**
```javascript
if (selected.userData.correct) {
    score++;
    updateScore(score);
    console.log('正解！すごい！');  // ← この行を追加
} else {
    console.log('残念...次がんばろう');  // ← この行を追加
}
```

---

## ボーナス: もっとカスタマイズしよう！

### テキストパネルの背景色を変える
`config.js` の **130〜143行目** あたり

```javascript
export const textPanelColors = {
    gradientStart: '#FFE5B4',   // 上部の色
    gradientMiddle: '#FFD4A3',  // 中間の色
    gradientEnd: '#FFC996',     // 下部の色
    borderColor: '#E8B88B',     // 枠線の色
};
```

**クールな青系**
```javascript
gradientStart: '#E0FFFF',
gradientMiddle: '#87CEEB',
gradientEnd: '#4169E1',
borderColor: '#000080',
```

**情熱の赤系**
```javascript
gradientStart: '#FFE4E1',
gradientMiddle: '#FF6B6B',
gradientEnd: '#DC143C',
borderColor: '#8B0000',
```

### 照明を変える（上級者向け）
`config.js` の **148〜167行目** あたり

```javascript
export const lighting = {
    mainLight: {
        color: 0xffffff,
        intensity: 1.0,
        position: { x: 5, y: 10, z: 5 }
    },
    // ...
};
```

**夕日のような暖かい光**
```javascript
mainLight: {
    color: 0xFFAA55,     // オレンジ色の光
    intensity: 1.2,      // 少し明るく
    position: { x: -10, y: 5, z: 0 }  // 横から
},
```

---

## トラブルシューティング

### 画面が真っ白になった！
- `config.js` のどこかで書き間違いがあります
- カンマ `,` やカッコ `{ }` が足りていないか確認しよう
- 元のファイルに戻してやり直そう

### 色が変わらない！
- `0x` を忘れていないか確認（`0xFF0000` が正解、`FF0000` は間違い）
- 保存したあとブラウザをリロード（F5）したか確認

### エラーが出た！
- ブラウザの開発者ツール（F12）でエラーメッセージを確認
- 大文字・小文字が正しいか確認
- クォーテーション `'` や `"` が正しく閉じているか確認

---

## 完成したら

1. 友達に遊んでもらおう！
2. VRモード（Meta Quest 3）で体験してみよう！
3. 自分だけのオリジナルクイズを作ってシェアしよう！

---

## 参考: ファイル構成

```
threedimension/
├── index.html      # HTMLファイル（変更不要）
├── main.js         # エントリポイント（変更不要）
├── config.js       # ★ 設定ファイル（ここを編集！）
├── scene.js        # 3Dシーン（上級者向け）
├── quizController.js  # クイズロジック（Step 6で編集）
├── textMesh.js     # テキスト描画（変更不要）
├── ui.js           # UI表示（変更不要）
└── quizData.js     # データ（config.jsに統合済み）
```

---

**お疲れ様でした！プログラミングを楽しんでください！**
