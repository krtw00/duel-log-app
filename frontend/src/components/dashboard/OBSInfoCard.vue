<template>
  <v-row v-if="streamerModeEnabled" class="mb-4">
    <v-col cols="12">
      <v-card class="obs-card">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="primary">mdi-monitor-screenshot</v-icon>
          <span class="text-h6">OBS連携</span>
          <v-spacer />
          <v-btn
            color="primary"
            variant="elevated"
            prepend-icon="mdi-open-in-new"
            @click="$emit('open-settings')"
          >
            URLを取得
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-2 mb-3">
            配信者モードが有効です。OBSのブラウザソースで直近の試合の統計情報をリアルタイム表示できます。
          </p>
          <div class="d-flex flex-wrap ga-2">
            <v-chip color="success" variant="outlined" size="small">
              <v-icon start size="small">mdi-trophy</v-icon>
              勝率
            </v-chip>
            <v-chip color="warning" variant="outlined" size="small">
              <v-icon start size="small">mdi-lightning-bolt</v-icon>
              先攻勝率
            </v-chip>
            <v-chip color="secondary" variant="outlined" size="small">
              <v-icon start size="small">mdi-shield</v-icon>
              後攻勝率
            </v-chip>
            <v-chip :color="coinWinRateColor" variant="outlined" size="small">
              <v-icon start size="small">mdi-poker-chip</v-icon>
              コイン勝率
            </v-chip>
            <v-chip color="teal" variant="outlined" size="small">
              <v-icon start size="small">mdi-arrow-up-bold-hexagon-outline</v-icon>
              先攻率
            </v-chip>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
interface Props {
  streamerModeEnabled: boolean;
  coinWinRateColor: string;
}

defineProps<Props>();

defineEmits<{
  'open-settings': [];
}>();
</script>

<style scoped>
.obs-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
}
</style>
