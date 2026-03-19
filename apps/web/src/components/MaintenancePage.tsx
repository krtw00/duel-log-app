import { Wrench } from 'lucide-react';
import { DuelLogBrand } from './brand/DuelLogBrand.js';

export function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-dark-1 to-brand-dark-2 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        {/* アイコン */}
        <div className="mb-8">
          <div className="mb-5 flex justify-center">
            <DuelLogBrand
              className="flex flex-col items-center gap-3"
              markClassName="h-16 w-16"
              labelClassName="text-xl font-semibold tracking-[0.24em] uppercase text-white"
            />
          </div>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
            <Wrench className="w-10 h-10 text-brand-cyan animate-pulse" />
          </div>
        </div>

        {/* タイトル */}
        <h1 className="text-3xl font-bold text-white mb-4">メンテナンス中</h1>

        {/* メッセージ */}
        <p className="text-white/70 mb-8 leading-relaxed">
          現在、システムメンテナンスを実施しております。
          <br />
          ご不便をおかけして申し訳ございません。
          <br />
          しばらくお待ちください。
        </p>

        {/* ステータスカード */}
        <div className="bg-brand-dark-3/50 border border-white/10 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-2 text-brand-cyan mb-2">
            <div className="w-2 h-2 bg-brand-cyan rounded-full animate-ping" />
            <span className="text-sm font-medium">作業中</span>
          </div>
          <p className="text-white/50 text-sm">
            メンテナンス完了後、自動的にサービスが再開されます
          </p>
        </div>

        {/* フッター */}
        <div className="text-white/40 text-sm">
          <p>Service maintenance in progress</p>
        </div>
      </div>
    </div>
  );
}
