/**
 * TensorFlow.js を使った画面キャプチャ解析
 *
 * 機械学習モデルによる画像分類で、コイントス結果と勝敗を判定する
 * 学習済みモデルがない場合は色ベースのヒューリスティックを使用
 */
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { createLogger } from '@/utils/logger';
import {
  initTfjs,
  ImageClassifier,
  TFJS_CONFIG,
  extractRoiImageData,
  resizeImageData,
  classifyByColorHistogram,
  MODEL_INPUT_SIZE,
  logMemoryUsage,
} from '@/utils/tfjsImageClassification';
import { createCanvas } from '@/utils/screenAnalysis';
import type { RoiRatio } from '@/utils/screenAnalysis';

const logger = createLogger('ScreenCaptureAnalysisTfjs');

// 結果の型定義（既存と互換）
export type AnalysisResult = 'win' | 'lose';
export type CoinResult = 'win' | 'lose';
type ResultLockState = 'unlocked' | 'locked';

// 解析設定
const ANALYSIS_CONFIG = {
  scanFps: 5,
  normalizedWidth: 1280,
  warmupFrames: 10, // 開始後 10 フレーム（2秒）はスキップ
  // コイントス判定
  coin: {
    roi: TFJS_CONFIG.coin.roi,
    threshold: 0.9, // ML モデル用に高めに設定（誤検出防止）
    requiredStreak: 5, // 5 フレーム連続で検出が必要（誤検出防止）
    cooldownMs: 15000,
    activeMs: 20000,
  },
  // 勝敗判定
  result: {
    roi: TFJS_CONFIG.result.roi,
    threshold: 0.8, // ML モデル用に高めに設定
    requiredStreak: 3, // 3 フレーム連続で検出が必要
    cooldownMs: 12000,
  },
  // 色ベース判定用の設定（モデルがない場合のフォールバック）
  colorHeuristics: {
    coin: {
      // コイントス画面の特徴色
      win: { rgb: [255, 215, 0] as [number, number, number], tolerance: 80 }, // 金色系（先攻）
      lose: { rgb: [192, 192, 192] as [number, number, number], tolerance: 80 }, // 銀色系（後攻）
    },
    result: {
      // 勝敗画面の特徴色
      victory: { rgb: [255, 200, 50] as [number, number, number], tolerance: 100 }, // VICTORY の金色
      lose: { rgb: [100, 100, 180] as [number, number, number], tolerance: 100 }, // LOSE の青系
    },
  },
};

export function useScreenCaptureAnalysisTfjs() {
  // 状態
  const isRunning = ref(false);
  const errorMessage = ref<string | null>(null);
  const lastResult = ref<AnalysisResult | null>(null);
  const lastCoinResult = ref<CoinResult | null>(null);
  const turnChoiceAvailable = ref(false);
  const turnChoiceEventId = ref(0);
  const resultEventId = ref(0);
  const resultLockState = ref<ResultLockState>('unlocked');

  // 分類スコア（デバッグ用）
  const lastScores = ref({
    coinWin: 0,
    coinLose: 0,
    win: 0,
    lose: 0,
  });

  // 最後の予測ラベル（デバッグ用）
  const lastPredictedLabels = ref({
    coin: 'none',
    result: 'none',
  });

  // モデル状態
  const modelStatus = ref({
    tfjsReady: false,
    coinModelLoaded: false,
    resultModelLoaded: false,
    usingFallback: true, // モデルがない場合は色ベースヒューリスティックを使用
  });

  // キャプチャ関連
  let stream: MediaStream | null = null;
  let video: HTMLVideoElement | null = null;
  let canvas: HTMLCanvasElement | OffscreenCanvas | null = null;
  let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
  let intervalId: number | null = null;
  let drawParams: { sx: number; sy: number; sWidth: number; sHeight: number } | null = null;

  // 分類器
  let coinClassifier: ImageClassifier | null = null;
  let resultClassifier: ImageClassifier | null = null;

  // 連続検出用
  let coinStreak = 0;
  let coinCandidate: CoinResult | null = null;
  let resultStreak = 0;
  let resultCandidate: AnalysisResult | null = null;
  let coinCooldownUntil = 0;
  let coinActiveUntil = 0;
  let resultCooldownUntil = 0;
  let frameCount = 0;
  let coinDetectedOnce = false; // コインが一度でも検出されたか
  let captureStartTime = 0; // キャプチャ開始時刻

  // 不足テンプレート（互換性のため）
  const missingTemplates = computed(() => {
    const missing: string[] = [];
    if (!modelStatus.value.coinModelLoaded && !modelStatus.value.usingFallback) {
      missing.push('coin-model');
    }
    if (!modelStatus.value.resultModelLoaded && !modelStatus.value.usingFallback) {
      missing.push('result-model');
    }
    return missing;
  });

  // テンプレートエラー（互換性のため）
  const templateErrors = ref({
    coinWin: '',
    coinLose: '',
    win: '',
    lose: '',
  });

  const templateStatus = ref({
    coinWin: false,
    coinLose: false,
    win: false,
    lose: false,
  });

  /**
   * 状態リセット（次の対戦用）
   */
  const resetState = () => {
    lastResult.value = null;
    lastCoinResult.value = null;
    turnChoiceAvailable.value = false;
    lastScores.value = { coinWin: 0, coinLose: 0, win: 0, lose: 0 };
    coinStreak = 0;
    coinCandidate = null;
    resultStreak = 0;
    resultCandidate = null;
    coinCooldownUntil = 0;
    coinActiveUntil = 0;
    resultCooldownUntil = 0;
  };

  /**
   * 完全リセット（キャプチャ停止時）
   */
  const resetStateComplete = () => {
    resetState();
    turnChoiceEventId.value = 0;
    resultEventId.value = 0;
    resultLockState.value = 'unlocked';
    frameCount = 0;
    coinDetectedOnce = false;
    captureStartTime = 0;
  };

  /**
   * TensorFlow.js とモデルを初期化
   */
  const initModels = async () => {
    try {
      // TensorFlow.js 初期化
      await initTfjs();
      modelStatus.value.tfjsReady = true;
      logger.info('TensorFlow.js initialized');

      // コイン分類器を初期化
      coinClassifier = new ImageClassifier(TFJS_CONFIG.coin);
      const coinLoaded = await coinClassifier.load();
      modelStatus.value.coinModelLoaded = coinLoaded;

      // 勝敗分類器を初期化
      resultClassifier = new ImageClassifier(TFJS_CONFIG.result);
      const resultLoaded = await resultClassifier.load();
      modelStatus.value.resultModelLoaded = resultLoaded;

      // モデルがロードできなかった場合はフォールバックモード
      modelStatus.value.usingFallback = !coinLoaded || !resultLoaded;

      if (modelStatus.value.usingFallback) {
        logger.info('Using color heuristics fallback (models not available)');
      }

      // 互換性のためテンプレートステータスを更新
      templateStatus.value = {
        coinWin: true,
        coinLose: true,
        win: true,
        lose: true,
      };
    } catch (error) {
      logger.error('Failed to initialize models:', error);
      modelStatus.value.usingFallback = true;
    }
  };

  /**
   * ROI から画像データを抽出して分類
   */
  const classifyRoi = async (
    roi: RoiRatio,
    classifier: ImageClassifier | null,
    colorConfig: { label: string; rgb: [number, number, number]; tolerance: number }[],
  ): Promise<{ label: string; confidence: number }> => {
    if (!ctx || !canvas) {
      return { label: 'none', confidence: 0 };
    }

    // ROI を抽出
    const imageData = extractRoiImageData(ctx, roi, canvas.width, canvas.height);

    // モデルが使える場合は TensorFlow.js で分類
    if (classifier?.isLoaded && !modelStatus.value.usingFallback) {
      const resized = resizeImageData(imageData, MODEL_INPUT_SIZE);
      const result = await classifier.classify(resized);
      return result || { label: 'none', confidence: 0 };
    }

    // フォールバック：色ヒストグラムベースの判定
    return classifyByColorHistogram(imageData, {
      targetColors: colorConfig,
    });
  };

  /**
   * コイントス判定
   */
  const analyzeCoin = async (now: number) => {
    if (!ctx || !canvas) return;

    // スコア表示用に常に分類を実行
    const result = await classifyRoi(
      ANALYSIS_CONFIG.coin.roi,
      coinClassifier,
      [
        { label: 'win', ...ANALYSIS_CONFIG.colorHeuristics.coin.win },
        { label: 'lose', ...ANALYSIS_CONFIG.colorHeuristics.coin.lose },
      ],
    );

    // 予測ラベルを記録
    lastPredictedLabels.value = { ...lastPredictedLabels.value, coin: result.label };

    // スコア更新 - 常に更新（予測ラベルに関わらず信頼度を表示）
    if (result.label === 'win') {
      lastScores.value = { ...lastScores.value, coinWin: result.confidence, coinLose: 0 };
    } else if (result.label === 'lose') {
      lastScores.value = { ...lastScores.value, coinWin: 0, coinLose: result.confidence };
    } else {
      // 'none' の場合も信頼度を表示（デバッグ用）
      lastScores.value = { ...lastScores.value, coinWin: result.confidence, coinLose: 0 };
    }

    // 以下は検出判定のブロック条件（スコア更新後にチェック）
    if (now < coinCooldownUntil) return;

    // しきい値チェック
    if (result.confidence < ANALYSIS_CONFIG.coin.threshold || result.label === 'none') {
      coinStreak = 0;
      coinCandidate = null;
      return;
    }

    const candidate = result.label as CoinResult;
    if (coinCandidate && coinCandidate !== candidate) {
      coinStreak = 0;
    }

    coinCandidate = candidate;
    coinStreak += 1;

    if (coinStreak >= ANALYSIS_CONFIG.coin.requiredStreak) {
      lastCoinResult.value = candidate;
      coinStreak = 0;
      coinCandidate = null;
      turnChoiceAvailable.value = true;
      coinActiveUntil = now + ANALYSIS_CONFIG.coin.activeMs;
      coinCooldownUntil = now + ANALYSIS_CONFIG.coin.cooldownMs;
      turnChoiceEventId.value += 1;
      resultLockState.value = 'unlocked';
      coinDetectedOnce = true; // コインが検出されたことを記録
      logger.info(`Coin result detected: ${candidate} (confidence: ${result.confidence.toFixed(2)})`);
    }
  };

  // 勝敗判定を許可する最小経過時間（コインが検出されない場合のフォールバック）
  const MIN_TIME_BEFORE_RESULT_MS = 60000; // 60秒

  /**
   * 勝敗判定
   */
  const analyzeResult = async (now: number) => {
    if (!ctx || !canvas) return;

    // スコア表示用に常に分類を実行
    const result = await classifyRoi(
      ANALYSIS_CONFIG.result.roi,
      resultClassifier,
      [
        { label: 'victory', ...ANALYSIS_CONFIG.colorHeuristics.result.victory },
        { label: 'lose', ...ANALYSIS_CONFIG.colorHeuristics.result.lose },
      ],
    );

    // 予測ラベルを記録
    lastPredictedLabels.value = { ...lastPredictedLabels.value, result: result.label };

    // スコア更新（victory -> win に変換）- 常に更新
    if (result.label === 'victory') {
      lastScores.value = { ...lastScores.value, win: result.confidence, lose: 0 };
    } else if (result.label === 'lose') {
      lastScores.value = { ...lastScores.value, win: 0, lose: result.confidence };
    } else {
      // 'none' の場合も信頼度を表示（デバッグ用）
      lastScores.value = { ...lastScores.value, win: result.confidence, lose: 0 };
    }

    // 以下は検出判定のブロック条件（スコア更新後にチェック）
    if (now < resultCooldownUntil) return;
    if (resultLockState.value === 'locked') return;
    if (turnChoiceAvailable.value) return;

    // コインが検出されていない場合は、十分な時間が経過するまで勝敗判定をブロック
    // （コイン判定中に誤って勝敗を検出するのを防ぐ）
    if (!coinDetectedOnce) {
      const elapsed = now - captureStartTime;
      if (elapsed < MIN_TIME_BEFORE_RESULT_MS) {
        return; // まだコインが検出されていないのでスキップ
      }
    }

    // しきい値チェック
    if (result.confidence < ANALYSIS_CONFIG.result.threshold || result.label === 'none') {
      resultStreak = 0;
      resultCandidate = null;
      return;
    }

    // victory -> win に変換
    const candidate: AnalysisResult = result.label === 'victory' ? 'win' : 'lose';
    if (resultCandidate && resultCandidate !== candidate) {
      resultStreak = 0;
    }

    resultCandidate = candidate;
    resultStreak += 1;

    if (resultStreak >= ANALYSIS_CONFIG.result.requiredStreak) {
      lastResult.value = candidate;
      resultEventId.value += 1;
      resultStreak = 0;
      resultCandidate = null;
      resultCooldownUntil = now + ANALYSIS_CONFIG.result.cooldownMs;
      resultLockState.value = 'locked';
      logger.info(`Result detected: ${candidate} (confidence: ${result.confidence.toFixed(2)})`);
    }
  };

  /**
   * フレーム解析
   */
  const analyzeFrame = async () => {
    frameCount++;

    if (!ctx || !canvas || !video) {
      if (frameCount <= 3) {
        logger.warn(`analyzeFrame early return: ctx=${!!ctx}, canvas=${!!canvas}, video=${!!video}`);
      }
      return;
    }

    // ビデオフレームを Canvas に描画
    if (drawParams) {
      ctx.drawImage(
        video,
        drawParams.sx,
        drawParams.sy,
        drawParams.sWidth,
        drawParams.sHeight,
        0,
        0,
        canvas.width,
        canvas.height,
      );
    } else {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }

    const now = Date.now();

    // コイントス表示期間の終了チェック
    if (turnChoiceAvailable.value && now > coinActiveUntil) {
      turnChoiceAvailable.value = false;
    }

    // ウォームアップ期間中は解析をスキップ（誤検出防止）
    if (frameCount <= ANALYSIS_CONFIG.warmupFrames) {
      if (frameCount === ANALYSIS_CONFIG.warmupFrames) {
        logger.info(`Warmup complete after ${frameCount} frames, starting analysis`);
      }
      return;
    }

    // 定期ログ
    if (frameCount % 25 === 1) {
      logger.info(
        `Frame ${frameCount}: ${canvas.width}x${canvas.height}, ` +
          `tfjs=${modelStatus.value.tfjsReady}, fallback=${modelStatus.value.usingFallback}, ` +
          `scores=${JSON.stringify(lastScores.value)}`,
      );
      logMemoryUsage();
    }

    // 解析実行
    await analyzeCoin(now);
    await analyzeResult(now);
  };

  /**
   * キャプチャ開始
   */
  const startCapture = async () => {
    if (isRunning.value) return;
    errorMessage.value = null;
    resetStateComplete();

    try {
      // 画面共有を開始
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          frameRate: ANALYSIS_CONFIG.scanFps,
        },
        audio: false,
      });

      // ビデオ要素を作成
      video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;
      await video.play();

      const videoWidth = video.videoWidth || ANALYSIS_CONFIG.normalizedWidth;
      const videoHeight = video.videoHeight || Math.round((videoWidth * 9) / 16);

      // 16:9 にクロップ
      const targetAspect = 16 / 9;
      const videoAspect = videoWidth / videoHeight;
      let sx = 0;
      let sy = 0;
      let sWidth = videoWidth;
      let sHeight = videoHeight;

      if (Math.abs(videoAspect - targetAspect) > 0.01) {
        if (videoAspect > targetAspect) {
          sWidth = Math.round(videoHeight * targetAspect);
          sx = Math.round((videoWidth - sWidth) / 2);
        } else {
          sHeight = Math.round(videoWidth / targetAspect);
          sy = Math.round((videoHeight - sHeight) / 2);
        }
      }

      drawParams = { sx, sy, sWidth, sHeight };

      // Canvas 作成
      const canvasWidth = sWidth;
      const canvasHeight = sHeight;
      canvas = createCanvas(canvasWidth, canvasHeight);
      ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Failed to initialize canvas context');
      }

      logger.info(`Starting TF.js capture at resolution: ${canvasWidth}x${canvasHeight}`);

      // キャプチャ開始時刻を記録
      captureStartTime = Date.now();

      // モデル初期化（バックグラウンド）
      void initModels();

      // トラック終了時の処理
      const track = stream.getVideoTracks()[0];
      track.addEventListener('ended', () => {
        stopCapture();
      });

      isRunning.value = true;

      // 解析インターバル開始
      const intervalMs = 1000 / ANALYSIS_CONFIG.scanFps;
      logger.info(`Setting up analysis interval: ${intervalMs}ms (${ANALYSIS_CONFIG.scanFps} FPS)`);
      intervalId = window.setInterval(() => void analyzeFrame(), intervalMs);
    } catch (error) {
      logger.error('Failed to start capture:', error);
      errorMessage.value = '画面共有の開始に失敗しました';
      stopCapture();
    }
  };

  /**
   * キャプチャ停止
   */
  const stopCapture = () => {
    if (intervalId !== null) {
      window.clearInterval(intervalId);
      intervalId = null;
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }

    if (video) {
      video.srcObject = null;
      video = null;
    }

    // 分類器のリソース解放
    if (coinClassifier) {
      coinClassifier.dispose();
      coinClassifier = null;
    }
    if (resultClassifier) {
      resultClassifier.dispose();
      resultClassifier = null;
    }

    canvas = null;
    ctx = null;
    drawParams = null;
    isRunning.value = false;

    logger.info('Capture stopped');
  };

  /**
   * テンプレート読み込み（互換性のため）
   */
  const ensureTemplatesLoaded = async () => {
    await initModels();
  };

  /**
   * Canvas を Blob に変換するヘルパー
   */
  const canvasToBlob = async (
    targetCanvas: HTMLCanvasElement | OffscreenCanvas,
  ): Promise<Blob | null> => {
    if (targetCanvas instanceof HTMLCanvasElement) {
      return new Promise((resolve) => {
        targetCanvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } else if (targetCanvas instanceof OffscreenCanvas) {
      return await targetCanvas.convertToBlob({ type: 'image/png' });
    }
    return null;
  };

  // File System Access API 用のディレクトリハンドル
  let trainingDataDirHandle: FileSystemDirectoryHandle | null = null;

  /**
   * 学習データ保存先フォルダを選択
   */
  const selectTrainingDataFolder = async (): Promise<boolean> => {
    try {
      // @ts-expect-error - File System Access API
      trainingDataDirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
      });
      logger.info(`Training data folder selected: ${trainingDataDirHandle?.name}`);
      return true;
    } catch (error) {
      logger.error('Failed to select training data folder:', error);
      return false;
    }
  };

  /**
   * サブディレクトリを取得または作成
   */
  const getOrCreateSubDir = async (
    parentHandle: FileSystemDirectoryHandle,
    name: string,
  ): Promise<FileSystemDirectoryHandle> => {
    return await parentHandle.getDirectoryHandle(name, { create: true });
  };

  /**
   * ファイルを保存
   */
  const saveFileToDir = async (
    dirHandle: FileSystemDirectoryHandle,
    filename: string,
    blob: Blob,
  ): Promise<boolean> => {
    try {
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (error) {
      logger.error(`Failed to save file ${filename}:`, error);
      return false;
    }
  };

  /**
   * Blob をダウンロード（フォールバック用）
   */
  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * 学習データ保存先が設定済みか
   */
  const hasTrainingDataFolder = () => trainingDataDirHandle !== null;

  /**
   * デバッグ用: 現在のフレームとROI領域を保存
   * 学習データ収集に使用
   */
  const saveDebugImages = async (label: 'coin-win' | 'coin-lose' | 'coin-none' | 'result-win' | 'result-lose' | 'result-none') => {
    if (!canvas || !ctx) {
      logger.warn('Cannot save debug images: canvas not ready');
      return null;
    }

    const timestamp = Date.now();
    let savedCount = 0;

    try {
      // ROI を抽出
      const roiConfig = label.startsWith('coin') ? TFJS_CONFIG.coin : TFJS_CONFIG.result;
      const roiImageData = extractRoiImageData(ctx, roiConfig.roi, canvas.width, canvas.height);

      // ROI を HTMLCanvas に描画
      const roiHtmlCanvas = document.createElement('canvas');
      roiHtmlCanvas.width = roiImageData.width;
      roiHtmlCanvas.height = roiImageData.height;
      const roiCtx = roiHtmlCanvas.getContext('2d');
      if (!roiCtx) {
        logger.error('Failed to create ROI canvas context');
        return 0;
      }
      roiCtx.putImageData(roiImageData, 0, 0);
      const roiBlob = await canvasToBlob(roiHtmlCanvas);

      if (!roiBlob) {
        logger.error('Failed to create ROI blob');
        return 0;
      }

      // File System Access API が使える場合は直接保存
      if (trainingDataDirHandle) {
        // ラベルからディレクトリ構造を決定
        // coin-win -> coin/win, result-lose -> result/lose
        const [category, className] = label.split('-') as [string, string];
        const categoryDir = await getOrCreateSubDir(trainingDataDirHandle, category);
        const classDir = await getOrCreateSubDir(categoryDir, className === 'win' && category === 'result' ? 'victory' : className);

        // ROI のみ保存（学習に使用）
        const roiFilename = `${className}_${timestamp}.png`;
        if (await saveFileToDir(classDir, roiFilename, roiBlob)) {
          savedCount++;
          logger.info(`Saved to ${category}/${className}/${roiFilename}`);
        }
      } else {
        // フォールバック: ダウンロード
        downloadBlob(roiBlob, `${label}_${timestamp}_roi.png`);
        savedCount++;
      }

      logger.info(`Debug images captured: ${label} (${savedCount} images)`);
    } catch (error) {
      logger.error('Failed to save debug images:', error);
    }

    return savedCount;
  };

  // ライフサイクル
  onMounted(() => {
    void initModels();
  });

  onBeforeUnmount(() => {
    stopCapture();
  });

  return {
    // 状態（既存と互換）
    isRunning,
    errorMessage,
    lastResult,
    lastCoinResult,
    turnChoiceAvailable,
    turnChoiceEventId,
    resultEventId,
    resultLockState,
    lastScores,
    templateStatus,
    missingTemplates,
    templateErrors,

    // TF.js 固有
    modelStatus,
    lastPredictedLabels,

    // メソッド
    startCapture,
    stopCapture,
    resetState,
    ensureTemplatesLoaded,
    saveDebugImages,
    selectTrainingDataFolder,
    hasTrainingDataFolder,
  };
}
