#!/usr/bin/env python3
"""
王冠テンプレート生成スクリプト

デバッグ画像から金色ピクセルを抽出し、テンプレート配列を生成する。
"""

import colorsys
import sys
from pathlib import Path

from PIL import Image


def rgb_to_hsv(r: int, g: int, b: int) -> tuple[float, float, float]:
    """RGB (0-255) → HSV (H:0-360, S:0-1, V:0-1)"""
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    return h * 360, s, v


def is_gold_pixel(r: int, g: int, b: int) -> bool:
    """金色ピクセルかどうか判定"""
    h, s, v = rgb_to_hsv(r, g, b)
    # 金色: H=15-55°, S>=50%, V>=40%（緩めの閾値）
    return 15 <= h <= 55 and s >= 0.50 and v >= 0.40


def generate_template(image_path: str, width: int = 12, height: int = 10) -> list[list[int]]:
    """画像からテンプレートを生成"""
    img = Image.open(image_path).convert("RGB")

    # 元画像サイズ
    orig_w, orig_h = img.size
    print(f"Original size: {orig_w}x{orig_h}")

    # まず金色マスクを生成（元サイズで）
    gold_mask = []
    gold_count = 0
    for y in range(orig_h):
        row = []
        for x in range(orig_w):
            r, g, b = img.getpixel((x, y))
            is_gold = is_gold_pixel(r, g, b)
            row.append(1 if is_gold else 0)
            if is_gold:
                gold_count += 1
        gold_mask.append(row)

    print(f"Gold pixels: {gold_count} / {orig_w * orig_h} ({gold_count * 100 / (orig_w * orig_h):.1f}%)")

    # テンプレートサイズにリサンプリング（ブロック平均）
    template = []
    block_w = orig_w / width
    block_h = orig_h / height

    for ty in range(height):
        row = []
        for tx in range(width):
            # ブロック内の金色ピクセル数をカウント
            start_x = int(tx * block_w)
            end_x = int((tx + 1) * block_w)
            start_y = int(ty * block_h)
            end_y = int((ty + 1) * block_h)

            gold_in_block = 0
            total_in_block = 0
            for y in range(start_y, end_y):
                for x in range(start_x, end_x):
                    if y < orig_h and x < orig_w:
                        gold_in_block += gold_mask[y][x]
                        total_in_block += 1

            # 50%以上が金色ならテンプレートで1
            ratio = gold_in_block / total_in_block if total_in_block > 0 else 0
            row.append(1 if ratio >= 0.5 else 0)
        template.append(row)

    return template


def print_template(template: list[list[int]], name: str = "CROWN_TEMPLATE") -> None:
    """テンプレートをTypeScript配列形式で出力"""
    print(f"\nconst {name} = [")
    for i, row in enumerate(template):
        row_str = "[" + ", ".join(str(v) for v in row) + "]"
        if i < len(template) - 1:
            row_str += ","
        print(f"  {row_str}  // 行{i}")
    print("];")


def visualize_template(template: list[list[int]]) -> None:
    """テンプレートを可視化"""
    print("\nVisualization:")
    for row in template:
        line = "".join("█" if v else "·" for v in row)
        print(f"  {line}")


def auto_crop_template(template: list[list[int]]) -> list[list[int]]:
    """空の行・列を除去してテンプレートをトリミング"""
    # 空でない行を探す
    non_empty_rows = [i for i, row in enumerate(template) if any(v == 1 for v in row)]
    if not non_empty_rows:
        return template

    # 空でない列を探す
    height = len(template)
    width = len(template[0]) if template else 0
    non_empty_cols = [j for j in range(width) if any(template[i][j] == 1 for i in range(height))]
    if not non_empty_cols:
        return template

    # トリミング（1ピクセルのマージンを追加）
    min_row = max(0, min(non_empty_rows) - 1)
    max_row = min(height - 1, max(non_empty_rows) + 1)
    min_col = max(0, min(non_empty_cols) - 1)
    max_col = min(width - 1, max(non_empty_cols) + 1)

    cropped = []
    for i in range(min_row, max_row + 1):
        cropped.append(template[i][min_col:max_col + 1])

    return cropped


def generate_averaged_template(image_paths: list[str], width: int = 12, height: int = 10) -> list[list[float]]:
    """複数画像から平均テンプレートを生成"""
    accumulated = [[0.0] * width for _ in range(height)]
    count = 0

    for path in image_paths:
        try:
            template = generate_template(path, width, height)
            for y in range(height):
                for x in range(width):
                    accumulated[y][x] += template[y][x]
            count += 1
        except Exception as e:
            print(f"Error processing {path}: {e}")

    if count == 0:
        return accumulated

    # 平均化
    for y in range(height):
        for x in range(width):
            accumulated[y][x] /= count

    return accumulated


def threshold_template(averaged: list[list[float]], threshold: float = 0.3) -> list[list[int]]:
    """平均テンプレートを2値化"""
    return [[1 if v >= threshold else 0 for v in row] for row in averaged]


def main():
    debug_dir = Path(__file__).parent.parent / "backend" / "logs" / "debug-images"

    if len(sys.argv) < 2:
        # 複数画像から平均テンプレートを生成
        crown_images = list(debug_dir.rglob("*rightCrownRoi_lose*.jpg"))[:10]  # 最大10枚

        if not crown_images:
            print("No crown images found")
            sys.exit(1)

        print(f"Processing {len(crown_images)} images...")
        averaged = generate_averaged_template([str(p) for p in crown_images])

        print("\n=== Averaged Template (float values) ===")
        for i, row in enumerate(averaged):
            row_str = " ".join(f"{v:.2f}" for v in row)
            print(f"  行{i}: {row_str}")

        # 30%閾値で2値化
        template = threshold_template(averaged, 0.3)
        print("\n=== Thresholded Template (>=30%) ===")
        visualize_template(template)

        # 自動トリミング
        cropped = auto_crop_template(template)
        print(f"\n=== Cropped Template ({len(cropped[0])}x{len(cropped)}) ===")
        visualize_template(cropped)
        print_template(cropped, "CROWN_TEMPLATE")

    else:
        image_path = sys.argv[1]

        # 単一画像からテンプレート生成
        template = generate_template(image_path)

        print("\n=== Original Template ===")
        visualize_template(template)

        # 自動トリミング
        cropped = auto_crop_template(template)
        print(f"\n=== Cropped Template ({len(cropped[0])}x{len(cropped)}) ===")
        visualize_template(cropped)
        print_template(cropped, "CROWN_TEMPLATE_CROPPED")


if __name__ == "__main__":
    main()
