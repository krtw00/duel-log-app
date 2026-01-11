#!/usr/bin/env python3
"""
TensorFlow.js形式への変換スクリプト（直接Python APIを使用）
"""

import os
import sys
import shutil
import json
from pathlib import Path
import tensorflow as tf

# プロジェクトパス
if Path("/app/models").exists():
    # Docker環境
    MODELS_DIR = Path("/app/models")
    FRONTEND_MODELS_DIR = Path("/app/frontend-models")
else:
    # 直接実行
    PROJECT_ROOT = Path(__file__).parent.parent
    MODELS_DIR = PROJECT_ROOT / "models"
    FRONTEND_MODELS_DIR = PROJECT_ROOT.parent / "frontend" / "public" / "models"


def convert_model(task_type: str):
    """指定されたタスクタイプのモデルをTF.js形式に変換"""

    print(f"\n{'='*60}")
    print(f"Converting {task_type} classifier to TF.js format")
    print(f"{'='*60}")

    model_dir = MODELS_DIR / f"{task_type}-classifier"
    keras_model_path = model_dir / "model.keras"
    
    if not keras_model_path.exists():
        print(f"Error: {keras_model_path} does not exist")
        print("Please run train_model.py first")
        return False

    # モデルをロード
    print(f"Loading Keras model from {keras_model_path}")
    model = tf.keras.models.load_model(keras_model_path)
    
    # 出力ディレクトリ
    tfjs_output_dir = model_dir / "tfjs"
    if tfjs_output_dir.exists():
        shutil.rmtree(tfjs_output_dir)
    tfjs_output_dir.mkdir(parents=True, exist_ok=True)

    # TensorFlow.js形式で保存
    print(f"Converting to TF.js format...")
    try:
        import tensorflowjs as tfjs
        tfjs.converters.save_keras_model(model, str(tfjs_output_dir))
        print(f"Conversion successful!")
        print(f"Output: {tfjs_output_dir}")
    except Exception as e:
        print(f"Error during conversion: {e}")
        return False

    # ラベル情報をコピー
    labels_src = model_dir / "labels.json"
    labels_dst = tfjs_output_dir / "labels.json"
    if labels_src.exists():
        shutil.copy(labels_src, labels_dst)
        print(f"Copied labels.json")

    return True


def deploy_to_frontend():
    """変換したモデルをフロントエンドにデプロイ"""

    print(f"\n{'='*60}")
    print("Deploying models to frontend")
    print(f"{'='*60}")

    FRONTEND_MODELS_DIR.mkdir(parents=True, exist_ok=True)

    for task_type in ["coin", "result"]:
        src_dir = MODELS_DIR / f"{task_type}-classifier" / "tfjs"
        dst_dir = FRONTEND_MODELS_DIR / f"{task_type}-classifier"

        if not src_dir.exists():
            print(f"Warning: {src_dir} does not exist, skipping")
            continue

        # 既存のディレクトリを削除
        if dst_dir.exists():
            shutil.rmtree(dst_dir)

        # コピー
        shutil.copytree(src_dir, dst_dir)
        print(f"Deployed {task_type}-classifier to {dst_dir}")

        # ファイル一覧を表示
        for f in dst_dir.iterdir():
            size = f.stat().st_size
            print(f"  {f.name}: {size:,} bytes")

    print(f"\nModels deployed to: {FRONTEND_MODELS_DIR}")


def create_model_metadata():
    """モデルのメタデータファイルを作成"""

    metadata = {
        "coin-classifier": {
            "modelUrl": "/models/coin-classifier/model.json",
            "inputSize": 224,
            "labels": [],
        },
        "result-classifier": {
            "modelUrl": "/models/result-classifier/model.json",
            "inputSize": 224,
            "labels": [],
        },
    }

    # ラベル情報を読み込み
    for task_type in ["coin", "result"]:
        labels_path = MODELS_DIR / f"{task_type}-classifier" / "labels.json"
        if labels_path.exists():
            with open(labels_path) as f:
                labels_data = json.load(f)
                metadata[f"{task_type}-classifier"]["labels"] = labels_data["labels"]

    # メタデータを保存
    metadata_path = FRONTEND_MODELS_DIR / "metadata.json"
    with open(metadata_path, "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"\nCreated metadata file: {metadata_path}")


def main():
    print("=" * 60)
    print("TensorFlow.js 変換スクリプト")
    print("=" * 60)

    # 各モデルを変換
    success = True
    for task_type in ["coin", "result"]:
        if not convert_model(task_type):
            success = False

    if not success:
        print("\nSome conversions failed. Please check the errors above.")
        sys.exit(1)

    # フロントエンドにデプロイ
    deploy_to_frontend()

    # メタデータ作成
    create_model_metadata()

    print("\n" + "=" * 60)
    print("変換完了！")
    print("=" * 60)
    print(f"\nモデルは {FRONTEND_MODELS_DIR} に配置されました")
    print("フロントエンドアプリケーションを再起動してモデルを使用できます")


if __name__ == "__main__":
    main()
