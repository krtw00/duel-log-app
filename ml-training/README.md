# 画像分類モデル学習環境

TensorFlow.js で使用する画像分類モデルを学習するための環境です。

## セットアップ

### 1. Python仮想環境を作成

```bash
cd ml-training
python -m venv venv
source venv/bin/activate  # Linux/Mac
# または
venv\Scripts\activate  # Windows
```

### 2. 依存パッケージをインストール

```bash
pip install -r requirements.txt
```

## 学習手順

### 1. 学習データの準備

既存のスクリーンショットからROIを切り出し、データ拡張で学習データを生成します。

```bash
python scripts/prepare_data.py
```

これにより、以下のディレクトリ構造でデータが生成されます：

```
data/
├── coin/
│   ├── win/      # コイントス勝ち（先攻選択権獲得）
│   ├── lose/     # コイントス負け（後攻）
│   └── none/     # それ以外の画面
└── result/
    ├── victory/  # 勝利画面
    ├── lose/     # 敗北画面
    └── none/     # それ以外の画面
```

### 2. モデルの学習

MobileNetV2の転移学習でモデルを作成します。

```bash
python scripts/train_model.py
```

学習には以下の2フェーズがあります：
1. **Phase 1**: 分類ヘッドのみ学習（ベースモデルは凍結）
2. **Phase 2**: ファインチューニング（上位層のみ解凍）

学習結果は `models/` ディレクトリに保存されます。

### 3. TensorFlow.js形式に変換

```bash
python scripts/convert_to_tfjs.py
```

変換されたモデルは自動的に `frontend/public/models/` にデプロイされます。

## ディレクトリ構造

```
ml-training/
├── README.md
├── requirements.txt
├── data/                    # 学習データ
│   ├── coin/
│   │   ├── win/
│   │   ├── lose/
│   │   └── none/
│   └── result/
│       ├── victory/
│       ├── lose/
│       └── none/
├── models/                  # 学習済みモデル
│   ├── coin-classifier/
│   │   ├── model.keras
│   │   ├── saved_model/
│   │   ├── tfjs/
│   │   └── labels.json
│   └── result-classifier/
│       ├── model.keras
│       ├── saved_model/
│       ├── tfjs/
│       └── labels.json
└── scripts/
    ├── prepare_data.py      # データ準備
    ├── train_model.py       # モデル学習
    └── convert_to_tfjs.py   # TF.js変換
```

## カスタムデータの追加

### 追加の学習画像を用意する場合

1. フルスクリーンショット（3200x1800推奨）を用意
2. `frontend/public/screen-analysis/` に配置
3. `scripts/prepare_data.py` の `raw_images` 辞書に追加
4. 再度 `prepare_data.py` を実行

### 手動でROI画像を追加する場合

1. 224x224 のPNG画像を用意
2. 適切なクラスディレクトリに配置：
   - `data/coin/win/`, `data/coin/lose/`, `data/coin/none/`
   - `data/result/victory/`, `data/result/lose/`, `data/result/none/`

## モデル仕様

- **入力サイズ**: 224x224 RGB
- **出力**: クラス確率（softmax）
- **ベースモデル**: MobileNetV2（ImageNet事前学習）

### コイン分類器
- クラス: `lose`, `none`, `win`
- 用途: コイントス結果の判定

### 勝敗分類器
- クラス: `lose`, `none`, `victory`
- 用途: 対戦結果の判定

## トラブルシューティング

### GPU が認識されない

```bash
# CUDA と cuDNN のバージョンを確認
nvidia-smi
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

### メモリ不足

`train_model.py` の `CONFIG["batch_size"]` を小さくしてください。

### TF.js 変換エラー

```bash
# tensorflowjs を最新版に更新
pip install --upgrade tensorflowjs
```
