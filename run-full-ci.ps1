#Requires -Version 5.1
<#
.SYNOPSIS
    環境構築、依存関係のインストール、バックエンドとフロントエンドの
    テストを含む、完全なローカルCIチェックを実行します。
#>

param()

# エラーが発生したらスクリプトを停止する
$ErrorActionPreference = 'Stop'
# スクリプトの場所を取得
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

# セクションヘッダーを出力する関数
function Write-SectionHeader {
    param( [string]$Message )
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host $Message -ForegroundColor Cyan
    Write-Host "--------------------------------------------------" -ForegroundColor Cyan
    Write-Host ""
}

try {
    # 作業ディレクトリをスクリプトの場所に変更
    Set-Location -Path $PSScriptRoot

    Write-SectionHeader "[1/4] 環境チェック中..."

    # Pythonのチェック
    try {
        $pythonVersion = (python --version 2>&1)
        Write-Host "✅ Pythonが見つかりました: $pythonVersion" -ForegroundColor Green
    }
    catch {
        throw "Pythonがインストールされていないか、PATHに含まれていません。Python 3.11以上をインストールしてください。"
    }

    # Node.jsのチェック
    try {
        $nodeVersion = (node --version)
        Write-Host "✅ Node.jsが見つかりました: $nodeVersion" -ForegroundColor Green
    }
    catch {
        throw "Node.jsがインストールされていないか、PATHに含まれていません。Node.js 20以上をインストールしてください。"
    }
    Write-Host ""

    # --- バックエンドのセットアップとテスト ---
    Write-SectionHeader "[2/4] バックエンドのセットアップとテストを実行中..."

    # 仮想環境がなければ作成
    if (-not (Test-Path -Path ".\venv")) {
        Write-Host "Python仮想環境が見つかりません。作成中..." -ForegroundColor Yellow
        python -m venv venv
        if (-not (Test-Path -Path ".\venv\Scripts\Activate.ps1")) {
            throw "Python仮想環境の作成に失敗しました。'python -m venv venv' を手動で実行して問題を確認してください。Windows Storeのpython.exeスタブが原因である可能性があります。"
        }
        Write-Host "✅ 仮想環境を作成しました。" -ForegroundColor Green
    }

    # 仮想環境を有効化
    . .\venv\Scripts\Activate.ps1
    Write-Host "✅ 仮想環境を有効化しました。"

    # 依存関係のインストール
    Write-Host "バックエンドの依存関係をインストール中..." -ForegroundColor Yellow
    python.exe -m pip install --upgrade pip -q
    pip install --no-cache-dir -r backend\requirements.txt -q
    Write-Host "✅ バックエンドの依存関係は最新です。" -ForegroundColor Green

    # バックエンドのテストを実行
    Write-Host "バックエンドのテストを実行中..." -ForegroundColor Yellow
    Push-Location -Path ".\backend"
    try {
        $env:PYTHONPATH = "."
        $env:DATABASE_URL = "sqlite:///./test.db"
        $env:SECRET_KEY = "a_very_secure_and_long_32_char_test_secret_key"
        $env:DEBUG = "true"
        
        pytest --tb=short --quiet
        if ($LASTEXITCODE -ne 0) { throw "Pytest failed with exit code $LASTEXITCODE" }
    }
    finally {
        Pop-Location
    }
    Write-Host "✅ バックエンドのテストに成功しました!" -ForegroundColor Green
    Write-Host ""

    # --- フロントエンドのセットアップとテスト ---
    Write-SectionHeader "[3/4] フロントエンドのセットアップとテストを実行中..."
    
    Push-Location -Path ".\frontend"
    try {
        # node_modulesがなければ依存関係をインストール
        if (-not (Test-Path -Path ".\node_modules")) {
            Write-Host "node_modulesが見つかりません。依存関係をインストール中..." -ForegroundColor Yellow
            npm install
            Write-Host "✅ フロントエンドの依存関係をインストールしました。" -ForegroundColor Green
        }

        # フロントエンドのテストを実行
        Write-Host "フロントエンドのテストを実行中..." -ForegroundColor Yellow
        npm run test:unit
        if ($LASTEXITCODE -ne 0) { throw "NPM test failed with exit code $LASTEXITCODE" }
    }
    finally {
        Pop-Location
    }
    Write-Host "✅ フロントエンドのテストに成功しました!" -ForegroundColor Green
    Write-Host ""

    # --- 完了 ---
    Write-SectionHeader "[4/4] すべてのチェックが完了しました!"
    
    Write-Host "🎉 すべてのテストが成功しました! 🎉" -ForegroundColor Green
    Write-Host ""
    Write-Host "次のステップ:" -ForegroundColor Yellow
    Write-Host "  1. git add ."
    Write-Host '  2. git commit -m "your message"'
    Write-Host "  3. git push origin main"
    Write-Host ""
    Write-Host "GitHubにプッシュしても安全です!" -ForegroundColor Green

}
catch {
    Write-Host "❌ CIスクリプトが失敗しました!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    # 失敗を示すためにゼロ以外のコードで終了
    exit 1
}
finally {
    # 仮想環境が有効化されていればdeactivateを実行
    if (Get-Command 'deactivate' -ErrorAction SilentlyContinue) {
        Write-Host ""
        Write-Host "仮想環境を無効化しています..." -ForegroundColor Yellow
        deactivate
        Write-Host "✅ 仮想環境を無効化しました。" -ForegroundColor Green
    }
    Write-Host ""
    Read-Host -Prompt "Enterキーを押して終了します"
}
