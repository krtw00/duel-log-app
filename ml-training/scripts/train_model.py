#!/usr/bin/env python3
"""
画像分類モデルの学習スクリプト

MobileNetV2の転移学習でコイントス結果と勝敗を判定するモデルを作成
"""

import os
import sys
from pathlib import Path
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.preprocessing.image import ImageDataGenerator
import matplotlib.pyplot as plt

# プロジェクトパス
# Docker 環境と直接実行の両方に対応
if Path("/app/data").exists():
    # Docker環境
    DATA_DIR = Path("/app/data")
    MODELS_DIR = Path("/app/models")
else:
    # 直接実行
    PROJECT_ROOT = Path(__file__).parent.parent
    DATA_DIR = PROJECT_ROOT / "data"
    MODELS_DIR = PROJECT_ROOT / "models"

# 学習設定
CONFIG = {
    "image_size": 224,
    "batch_size": 32,
    "epochs": 30,
    "learning_rate": 0.001,
    "fine_tune_learning_rate": 0.0001,
    "fine_tune_epochs": 10,
    "validation_split": 0.2,
}


def create_model(num_classes: int) -> keras.Model:
    """MobileNetV2ベースの分類モデルを作成"""

    # ベースモデル（ImageNetで事前学習済み）
    base_model = MobileNetV2(
        weights="imagenet",
        include_top=False,
        input_shape=(CONFIG["image_size"], CONFIG["image_size"], 3),
    )

    # 最初はベースモデルを凍結
    base_model.trainable = False

    # 分類ヘッドを追加
    model = keras.Sequential([
        base_model,
        layers.GlobalAveragePooling2D(),
        layers.Dropout(0.3),
        layers.Dense(128, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="softmax"),
    ])

    return model, base_model


def train_classifier(task_type: str):
    """指定されたタスクタイプの分類器を学習"""

    print(f"\n{'='*60}")
    print(f"Training {task_type} classifier")
    print(f"{'='*60}")

    task_data_dir = DATA_DIR / task_type
    if not task_data_dir.exists():
        print(f"Error: {task_data_dir} does not exist")
        return None

    # クラス一覧を取得
    classes = sorted([d.name for d in task_data_dir.iterdir() if d.is_dir()])
    num_classes = len(classes)
    print(f"Classes: {classes}")

    if num_classes < 2:
        print(f"Error: Need at least 2 classes, found {num_classes}")
        return None

    # データジェネレーターを作成
    datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=CONFIG["validation_split"],
    )

    train_generator = datagen.flow_from_directory(
        task_data_dir,
        target_size=(CONFIG["image_size"], CONFIG["image_size"]),
        batch_size=CONFIG["batch_size"],
        class_mode="categorical",
        subset="training",
        shuffle=True,
    )

    val_generator = datagen.flow_from_directory(
        task_data_dir,
        target_size=(CONFIG["image_size"], CONFIG["image_size"]),
        batch_size=CONFIG["batch_size"],
        class_mode="categorical",
        subset="validation",
        shuffle=False,
    )

    print(f"Training samples: {train_generator.samples}")
    print(f"Validation samples: {val_generator.samples}")

    # モデルを作成
    model, base_model = create_model(num_classes)

    # フェーズ1: 分類ヘッドのみ学習
    print("\nPhase 1: Training classification head...")
    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["learning_rate"]),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history1 = model.fit(
        train_generator,
        epochs=CONFIG["epochs"],
        validation_data=val_generator,
        callbacks=[
            keras.callbacks.EarlyStopping(
                monitor="val_accuracy",
                patience=5,
                restore_best_weights=True,
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor="val_loss",
                factor=0.5,
                patience=3,
            ),
        ],
    )

    # フェーズ2: ファインチューニング（上位層のみ解凍）
    print("\nPhase 2: Fine-tuning top layers...")
    base_model.trainable = True

    # 最後の30層のみを学習可能に
    for layer in base_model.layers[:-30]:
        layer.trainable = False

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=CONFIG["fine_tune_learning_rate"]),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    history2 = model.fit(
        train_generator,
        epochs=CONFIG["fine_tune_epochs"],
        validation_data=val_generator,
        callbacks=[
            keras.callbacks.EarlyStopping(
                monitor="val_accuracy",
                patience=3,
                restore_best_weights=True,
            ),
        ],
    )

    # 評価
    print("\nEvaluating model...")
    loss, accuracy = model.evaluate(val_generator)
    print(f"Validation Loss: {loss:.4f}")
    print(f"Validation Accuracy: {accuracy:.4f}")

    # モデルを保存
    model_dir = MODELS_DIR / f"{task_type}-classifier"
    model_dir.mkdir(parents=True, exist_ok=True)

    # Keras形式で保存
    keras_path = model_dir / "model.keras"
    model.save(keras_path)
    print(f"Saved Keras model to: {keras_path}")

    # SavedModel形式で保存（TF.js変換用）
    saved_model_path = model_dir / "saved_model"
    model.export(str(saved_model_path))
    print(f"Saved SavedModel to: {saved_model_path}")

    # クラスラベルを保存
    labels_path = model_dir / "labels.json"
    with open(labels_path, "w") as f:
        json.dump({
            "labels": classes,
            "class_indices": train_generator.class_indices,
        }, f, indent=2)
    print(f"Saved labels to: {labels_path}")

    # 学習履歴をプロット
    plot_history(history1, history2, model_dir / "training_history.png")

    return model, classes


def plot_history(history1, history2, output_path: Path):
    """学習履歴をプロット"""
    fig, axes = plt.subplots(1, 2, figsize=(12, 4))

    # 損失
    axes[0].plot(history1.history["loss"], label="Train (Phase 1)")
    axes[0].plot(history1.history["val_loss"], label="Val (Phase 1)")
    if history2:
        offset = len(history1.history["loss"])
        epochs2 = range(offset, offset + len(history2.history["loss"]))
        axes[0].plot(epochs2, history2.history["loss"], label="Train (Phase 2)")
        axes[0].plot(epochs2, history2.history["val_loss"], label="Val (Phase 2)")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].set_title("Training Loss")
    axes[0].legend()

    # 精度
    axes[1].plot(history1.history["accuracy"], label="Train (Phase 1)")
    axes[1].plot(history1.history["val_accuracy"], label="Val (Phase 1)")
    if history2:
        offset = len(history1.history["accuracy"])
        epochs2 = range(offset, offset + len(history2.history["accuracy"]))
        axes[1].plot(epochs2, history2.history["accuracy"], label="Train (Phase 2)")
        axes[1].plot(epochs2, history2.history["val_accuracy"], label="Val (Phase 2)")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].set_title("Training Accuracy")
    axes[1].legend()

    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    print(f"Saved training history plot to: {output_path}")


def main():
    print("=" * 60)
    print("画像分類モデル学習スクリプト")
    print("=" * 60)
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU available: {len(tf.config.list_physical_devices('GPU')) > 0}")

    # GPUメモリを動的に確保
    gpus = tf.config.list_physical_devices('GPU')
    if gpus:
        for gpu in gpus:
            tf.config.experimental.set_memory_growth(gpu, True)

    # 各タスクのモデルを学習
    for task_type in ["coin", "result"]:
        train_classifier(task_type)

    print("\n" + "=" * 60)
    print("学習完了！")
    print("=" * 60)
    print(f"\nモデルは {MODELS_DIR} に保存されました")
    print("次のステップ: convert_to_tfjs.py を実行してTF.js形式に変換")


if __name__ == "__main__":
    main()
