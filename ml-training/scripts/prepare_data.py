#!/usr/bin/env python3
"""
学習データの準備スクリプト

既存のスクリーンショットからROIを切り出し、
データ拡張を行って学習データを生成する
"""

import os
import sys
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import albumentations as A
from tqdm import tqdm

# プロジェクトルート
# Docker 環境と直接実行の両方に対応
if Path("/app/screen-analysis").exists():
    # Docker環境
    SCREEN_ANALYSIS_DIR = Path("/app/screen-analysis")
    DATA_DIR = Path("/app/data")
else:
    # 直接実行
    PROJECT_ROOT = Path(__file__).parent.parent.parent
    SCREEN_ANALYSIS_DIR = PROJECT_ROOT / "frontend" / "public" / "screen-analysis"
    DATA_DIR = Path(__file__).parent.parent / "data"

# ROI設定（比率）- screenAnalysis.ts と同じ
ROI_CONFIG = {
    "coin": {
        "x": 0.28,
        "y": 0.58,
        "width": 0.44,
        "height": 0.12,
    },
    "result": {
        "x": 0.05,
        "y": 0.2,
        "width": 0.9,
        "height": 0.4,
    },
}

# 出力サイズ
OUTPUT_SIZE = 224

# データ拡張の設定
def get_augmentation_pipeline():
    """データ拡張パイプラインを作成"""
    return A.Compose([
        # 明度・コントラスト変化
        A.RandomBrightnessContrast(
            brightness_limit=0.3,
            contrast_limit=0.3,
            p=0.8
        ),
        # 色相・彩度変化
        A.HueSaturationValue(
            hue_shift_limit=10,
            sat_shift_limit=30,
            val_shift_limit=30,
            p=0.7
        ),
        # ガウシアンノイズ
        A.GaussNoise(
            var_limit=(10.0, 50.0),
            p=0.5
        ),
        # ガウシアンブラー
        A.GaussianBlur(
            blur_limit=(3, 7),
            p=0.3
        ),
        # JPEG圧縮アーティファクト（ストリーミングをシミュレート）
        A.ImageCompression(
            quality_lower=60,
            quality_upper=95,
            p=0.5
        ),
        # 軽微な回転
        A.Rotate(
            limit=3,
            border_mode=cv2.BORDER_CONSTANT,
            p=0.3
        ),
        # 軽微なスケール変化
        A.RandomScale(
            scale_limit=0.1,
            p=0.3
        ),
    ])


def extract_roi(image: np.ndarray, roi_config: dict) -> np.ndarray:
    """画像からROIを切り出す"""
    h, w = image.shape[:2]
    x = int(roi_config["x"] * w)
    y = int(roi_config["y"] * h)
    width = int(roi_config["width"] * w)
    height = int(roi_config["height"] * h)

    # 範囲チェック
    x = max(0, min(x, w - 1))
    y = max(0, min(y, h - 1))
    width = min(width, w - x)
    height = min(height, h - y)

    return image[y:y+height, x:x+width]


def resize_to_square(image: np.ndarray, size: int) -> np.ndarray:
    """画像を正方形にリサイズ（アスペクト比を維持しつつパディング）"""
    h, w = image.shape[:2]

    # アスペクト比を維持してリサイズ
    scale = size / max(h, w)
    new_w = int(w * scale)
    new_h = int(h * scale)
    resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_AREA)

    # パディングして正方形に
    result = np.zeros((size, size, 3), dtype=np.uint8)
    x_offset = (size - new_w) // 2
    y_offset = (size - new_h) // 2
    result[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized

    return result


def generate_augmented_images(
    image: np.ndarray,
    num_augmented: int,
    augmentation_pipeline: A.Compose
) -> list[np.ndarray]:
    """データ拡張で画像を生成"""
    images = [image]  # 元画像も含める

    for _ in range(num_augmented - 1):
        augmented = augmentation_pipeline(image=image)["image"]
        images.append(augmented)

    return images


def process_raw_images():
    """raw画像からROIを切り出してデータを生成"""

    # 元画像のマッピング
    raw_images = {
        "coin": {
            "win": "raw-coin-win-1800p.png",
            "lose": "raw-coin-lose-1800p.png",
        },
        "result": {
            "victory": "raw-result-win-1800p.png",
            "lose": "raw-result-lose-1800p.png",
        },
    }

    augmentation = get_augmentation_pipeline()
    num_augmented_per_image = 100  # 各元画像から生成する拡張画像数

    for task_type, labels in raw_images.items():
        roi_config = ROI_CONFIG[task_type]

        for label, filename in labels.items():
            image_path = SCREEN_ANALYSIS_DIR / filename
            output_dir = DATA_DIR / task_type / label
            output_dir.mkdir(parents=True, exist_ok=True)

            if not image_path.exists():
                print(f"Warning: {image_path} not found, skipping")
                continue

            print(f"Processing {task_type}/{label}: {filename}")

            # 画像を読み込み
            image = cv2.imread(str(image_path))
            if image is None:
                print(f"Error: Failed to load {image_path}")
                continue

            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

            # ROIを切り出し
            roi = extract_roi(image, roi_config)

            # 正方形にリサイズ
            roi_resized = resize_to_square(roi, OUTPUT_SIZE)

            # データ拡張
            augmented_images = generate_augmented_images(
                roi_resized,
                num_augmented_per_image,
                augmentation
            )

            # 保存
            for i, aug_image in enumerate(tqdm(augmented_images, desc=f"  {label}")):
                output_path = output_dir / f"{label}_{i:04d}.png"
                # RGB -> BGR に戻して保存
                cv2.imwrite(str(output_path), cv2.cvtColor(aug_image, cv2.COLOR_RGB2BGR))

            print(f"  Generated {len(augmented_images)} images")


def generate_none_class():
    """
    'none'クラス用の画像を生成
    実際のゲーム画面の他の部分や、ランダムなパターンを使用
    """
    print("\nGenerating 'none' class images...")

    # raw画像から非ROI領域を切り出して使用
    raw_images = [
        "raw-coin-win-1800p.png",
        "raw-result-win-1800p.png",
    ]

    augmentation = get_augmentation_pipeline()
    num_per_image = 50

    for task_type in ["coin", "result"]:
        output_dir = DATA_DIR / task_type / "none"
        output_dir.mkdir(parents=True, exist_ok=True)

        image_idx = 0

        for filename in raw_images:
            image_path = SCREEN_ANALYSIS_DIR / filename
            if not image_path.exists():
                continue

            image = cv2.imread(str(image_path))
            if image is None:
                continue

            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            h, w = image.shape[:2]

            # ROI以外の領域からランダムに切り出し
            roi_config = ROI_CONFIG[task_type]
            roi_x = int(roi_config["x"] * w)
            roi_y = int(roi_config["y"] * h)
            roi_w = int(roi_config["width"] * w)
            roi_h = int(roi_config["height"] * h)

            for _ in range(num_per_image):
                # ROIと重ならない領域からランダムに切り出し
                attempts = 0
                while attempts < 100:
                    patch_size = min(roi_w, roi_h)
                    x = np.random.randint(0, w - patch_size)
                    y = np.random.randint(0, h - patch_size)

                    # ROIと重なっていないかチェック
                    if (x + patch_size < roi_x or x > roi_x + roi_w or
                        y + patch_size < roi_y or y > roi_y + roi_h):
                        break
                    attempts += 1

                if attempts >= 100:
                    continue

                patch = image[y:y+patch_size, x:x+patch_size]
                patch_resized = resize_to_square(patch, OUTPUT_SIZE)

                # データ拡張
                augmented = augmentation(image=patch_resized)["image"]

                output_path = output_dir / f"none_{image_idx:04d}.png"
                cv2.imwrite(str(output_path), cv2.cvtColor(augmented, cv2.COLOR_RGB2BGR))
                image_idx += 1

        print(f"  Generated {image_idx} 'none' images for {task_type}")


def main():
    print("=" * 60)
    print("学習データ準備スクリプト")
    print("=" * 60)

    # データディレクトリを確認
    print(f"\nScreen analysis dir: {SCREEN_ANALYSIS_DIR}")
    print(f"Data output dir: {DATA_DIR}")

    if not SCREEN_ANALYSIS_DIR.exists():
        print(f"Error: {SCREEN_ANALYSIS_DIR} does not exist")
        sys.exit(1)

    # raw画像からデータ生成
    process_raw_images()

    # noneクラスの生成
    generate_none_class()

    print("\n" + "=" * 60)
    print("データ準備完了！")
    print("=" * 60)

    # 生成されたデータの統計
    for task_type in ["coin", "result"]:
        print(f"\n{task_type}:")
        task_dir = DATA_DIR / task_type
        if task_dir.exists():
            for label_dir in sorted(task_dir.iterdir()):
                if label_dir.is_dir():
                    count = len(list(label_dir.glob("*.png")))
                    print(f"  {label_dir.name}: {count} images")


if __name__ == "__main__":
    main()
