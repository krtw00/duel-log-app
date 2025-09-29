<script setup>
import { ref } from 'vue'
// axios がインストールされていることを前提とします
import axios from 'axios'

defineProps({
  msg: String,
})

const count = ref(0)
const apiMessage = ref('データ未送信') // APIの結果を表示するためのリアクティブ変数

// ★★★ 追記する API通信ロジック ★★★
const fetchData = async () => {
  // 環境変数からAPIのベースURLを読み込む (Viteの正しい方法)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  if (!API_BASE_URL) {
    apiMessage.value = 'エラー: VITE_API_BASE_URLが設定されていません。';
    console.error('VITE_API_BASE_URL is not defined in import.meta.env');
    return;
  }
  
  apiMessage.value = 'APIに接続中...';

  try {
    // バックエンドの /api/test などのエンドポイントを想定
    const response = await axios.get(`${API_BASE_URL}/test`); 
    
    // バックエンドから受け取ったデータを表示
    apiMessage.value = `成功: ${response.data.message || 'データを受信しました'}`;

  } catch (error) {
    // 接続失敗やCORSエラーなどの表示
    console.error('API通信エラー:', error);
    apiMessage.value = `接続エラー: ${error.message}`;
  }
}
// ★★★ 追記終わり ★★★
</script>

<template>
  <h1>{{ msg }}</h1>

  <div class="card">
    <button type="button" @click="count++">count is {{ count }}</button>
    
    <button type="button" @click="fetchData">APIからデータを取得</button>
    <p>APIステータス: <strong>{{ apiMessage }}</strong></p>
    
    <p>
      Edit
      <code>components/HelloWorld.vue</code> to test HMR
    </p>
  </div>
</template>