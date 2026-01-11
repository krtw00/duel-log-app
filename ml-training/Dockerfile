# TensorFlow 学習環境
FROM tensorflow/tensorflow:2.15.0

WORKDIR /app

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Python パッケージをインストール（TensorFlow 2.15.0 との互換性を維持）
RUN pip install --no-cache-dir \
    tensorflowjs==4.15.0 \
    pillow>=10.0.0 \
    opencv-python>=4.8.0 \
    albumentations>=1.3.0 \
    matplotlib>=3.7.0 \
    tqdm>=4.65.0

# スクリプトをコピー
COPY scripts/ scripts/

# データとモデルのボリュームマウント用
VOLUME ["/app/data", "/app/models", "/app/screen-analysis"]

CMD ["bash"]
