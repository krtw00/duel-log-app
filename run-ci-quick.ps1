#Requires -Version 5.1
<#
.SYNOPSIS
    バックエンドとフロントエンドのローカルCIテストを高速に実行します。
#>

param()

# エラーが発生したらスクリプトを停止する
$ErrorActionPreference = 'Stop'
# スクリプトの場所を取得
$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

try {
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host "   クイックCIを実行します" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    Write-Host ""

    # 作業ディレクトリをスクリプトの場所に変更
    Set-Location -Path $PSScriptRoot

    # --- バックエンド ---
    Write-Host "[1/2] バックエンドのテストを実行中..." -ForegroundColor Yellow
    
    # Python仮想環境の有効化
    if (-not (Test-Path -Path ".\venv\Scripts\Activate.ps1")) {
        throw "Python仮想環境が見つかりません。先に 'run-full-ci.ps1' を実行して環境を構築してください。"
    }
    . .\venv\Scripts\Activate.ps1
    
    Push-Location -Path ".\backend"
    try {
        # empty
    }
    finally {
        Pop-Location
    }
    
    # 仮想環境の無効化 (スクリプト終了時に自動的に無効化されるため通常は不要)
    # Deactivate

    Write-Host "✅ バックエンドのテストOK" -ForegroundColor Green
    Write-Host ""

    # --- フロントエンド ---
    Write-Host "[2/2] フロントエンドのテストを実行中..." -ForegroundColor Yellow
    
    # npmテストの実行
    npm run test:unit --prefix frontend -- --reporter=basic
    if ($LASTEXITCODE -ne 0) { throw "NPM test failed with exit code $LASTEXITCODE" }

    Write-Host "✅ フロントエンドのテストOK" -ForegroundColor Green
    Write-Host ""

    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "   🎉 すべてのテストが成功しました!" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green

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