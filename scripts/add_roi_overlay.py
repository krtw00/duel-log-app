#!/usr/bin/env python3
"""
デバッグ画像にROI範囲をオーバーレイするスクリプト

保存済みのフル画像にROI枠を描画して確認用画像を生成する。
"""

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# ROI設定（Worker側と同じ値）
# 各位置は実際の画像から計測
ROI_CONFIG = {
    "left_crown": {"x": 0.05, "y": 0.72, "width": 0.12, "height": 0.13, "color": (0, 100, 255), "label": "L-Crown"},
    "right_crown": {"x": 0.83, "y": 0.72, "width": 0.12, "height": 0.13, "color": (255, 50, 50), "label": "R-Crown"},
    "coin": {"x": 0.25, "y": 0.62, "width": 0.50, "height": 0.10, "color": (50, 200, 50), "label": "Coin"},
    "ok_button": {"x": 0.40, "y": 0.87, "width": 0.20, "height": 0.07, "color": (255, 200, 0), "label": "OK-Btn"},
}


def add_roi_overlay(image_path: Path, output_path: Path | None = None) -> Path:
    """画像にROI枠を描画"""
    img = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    width, height = img.size

    for name, roi in ROI_CONFIG.items():
        x = int(roi["x"] * width)
        y = int(roi["y"] * height)
        w = int(roi["width"] * width)
        h = int(roi["height"] * height)
        color = roi["color"]
        label = roi["label"]

        # 枠線を描画
        draw.rectangle([x, y, x + w, y + h], outline=color, width=2)

        # 半透明の塗りつぶし（PILでは直接できないので枠のみ）

        # ラベルを描画
        draw.text((x + 2, y + 2), label, fill=color)

    # 出力パスを決定
    if output_path is None:
        output_path = image_path.parent / f"{image_path.stem}_roi_overlay{image_path.suffix}"

    img.save(output_path, quality=85)
    return output_path


def process_directory(dir_path: Path, pattern: str = "*full*.jpg") -> list[Path]:
    """ディレクトリ内のフル画像にオーバーレイを追加"""
    results = []
    for image_path in dir_path.glob(pattern):
        # 既にオーバーレイ済みはスキップ
        if "_roi_overlay" in image_path.name:
            continue

        output_path = add_roi_overlay(image_path)
        results.append(output_path)
        print(f"Created: {output_path.name}")

    return results


def main():
    if len(sys.argv) < 2:
        # デフォルト: 最新のデバッグ画像ディレクトリを処理
        debug_dir = Path(__file__).parent.parent / "backend" / "logs" / "debug-images"

        # 最新のセッションディレクトリを取得
        sessions = sorted(debug_dir.iterdir(), reverse=True)
        if not sessions:
            print("No debug image sessions found")
            sys.exit(1)

        latest_session = sessions[0]
        print(f"Processing latest session: {latest_session.name}")
        results = process_directory(latest_session)
        print(f"\nProcessed {len(results)} images")
    else:
        path = Path(sys.argv[1])
        if path.is_file():
            # 単一ファイル
            output = add_roi_overlay(path)
            print(f"Created: {output}")
        elif path.is_dir():
            # ディレクトリ
            results = process_directory(path)
            print(f"\nProcessed {len(results)} images")
        else:
            print(f"Path not found: {path}")
            sys.exit(1)


if __name__ == "__main__":
    main()
