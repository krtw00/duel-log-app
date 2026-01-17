<template>
  <v-card
    class="stat-card"
    :class="[`stat-card--${color}`, { 'stat-card--large': size === 'large' }]"
  >
    <div class="stat-card__glow"></div>
    <v-card-text :class="size === 'large' ? 'pa-5' : 'pa-4'">
      <div class="d-flex align-center justify-space-between">
        <div class="stat-card__content">
          <p class="stat-card__title text-caption mb-1">{{ title }}</p>
          <p
            class="stat-card__value font-weight-bold"
            :class="size === 'large' ? 'text-h3' : 'text-h4'"
          >
            {{ value }}
          </p>
          <!-- サブタイトル（オプション） -->
          <p v-if="subtitle" class="stat-card__subtitle text-caption">
            {{ subtitle }}
          </p>
          <!-- トレンドインジケーター（オプション） -->
          <div v-if="trend !== undefined" class="stat-card__trend" :class="trendClass">
            <v-icon :icon="trendIcon" size="14" />
            <span>{{ Math.abs(trend).toFixed(1) }}%</span>
          </div>
        </div>
        <div
          class="stat-card__icon-wrapper"
          :class="{ 'stat-card__icon-wrapper--large': size === 'large' }"
        >
          <v-icon
            :icon="icon"
            :size="size === 'large' ? 56 : 40"
            :class="`text-${color}`"
            style="-webkit-text-fill-color: initial"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
  trend?: number; // パーセンテージ変化（正は増加、負は減少）
  size?: 'default' | 'large'; // カードサイズ（largeは主要KPI用）
}

const props = defineProps<Props>();

const trendIcon = computed(() => {
  if (props.trend === undefined || props.trend === 0) return 'mdi-minus';
  return props.trend > 0 ? 'mdi-trending-up' : 'mdi-trending-down';
});

const trendClass = computed(() => {
  if (props.trend === undefined || props.trend === 0) return 'trend-neutral';
  return props.trend > 0 ? 'trend-up' : 'trend-down';
});
</script>

<style scoped lang="scss">
.stat-card {
  backdrop-filter: blur(10px);
  border: 1px solid rgba(128, 128, 128, 0.2);
  border-radius: 12px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    opacity: 0.9;

    .stat-card__glow {
      opacity: 1;
    }
  }

  &__glow {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0.5;
    transition: opacity 0.3s ease;
  }

  &--primary .stat-card__glow {
    background: linear-gradient(90deg, #00d9ff, #0095ff);
  }

  &--success .stat-card__glow {
    background: linear-gradient(90deg, #00e676, #00c853);
  }

  &--warning .stat-card__glow {
    background: linear-gradient(90deg, #ffaa00, #ff6d00);
  }

  &--secondary .stat-card__glow {
    background: linear-gradient(90deg, #b536ff, #8e24aa);
  }

  &--yellow .stat-card__glow {
    background: linear-gradient(90deg, #ffee58, #fdd835);
  }

  &--teal .stat-card__glow {
    background: linear-gradient(90deg, #4db6ac, #00897b);
  }

  &--black .stat-card__glow {
    background: linear-gradient(90deg, #424242, #212121);
  }

  &__title {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 20px !important;
    white-space: nowrap;
    color: rgba(var(--v-theme-on-surface), 0.72);
  }

  &__value {
    color: rgb(var(--v-theme-on-surface));
    font-weight: 900;
    line-height: 1.2;
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__subtitle {
    margin-top: 2px;
    color: rgba(var(--v-theme-on-surface), 0.6);
    font-size: 11px !important;
  }

  &__trend {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;

    &.trend-up {
      color: rgb(var(--v-theme-success));
      background-color: rgba(var(--v-theme-success), 0.12);
    }

    &.trend-down {
      color: rgb(var(--v-theme-error));
      background-color: rgba(var(--v-theme-error), 0.12);
    }

    &.trend-neutral {
      color: rgba(var(--v-theme-on-surface), 0.6);
      background-color: rgba(var(--v-theme-on-surface), 0.08);
    }
  }

  &__icon-wrapper {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(var(--v-theme-on-surface), 0.08);
    border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
    border-radius: 50%;

    &--large {
      width: 90px;
      height: 90px;
    }
  }

  // Large size variant (主要KPI用)
  &--large {
    .stat-card__title {
      font-size: 14px !important;
      letter-spacing: 1.2px;
    }

    .stat-card__value {
      font-size: 2.75rem !important;
      line-height: 1.1;
    }

    .stat-card__subtitle {
      font-size: 13px !important;
      margin-top: 4px;
    }

    .stat-card__trend {
      font-size: 13px;
      padding: 3px 8px;
      margin-top: 8px;
    }
  }
}

// スマホ対応
@media (max-width: 599px) {
  .stat-card {
    &__title {
      font-size: 10px !important;
      letter-spacing: 0.5px;
    }

    &__value {
      font-size: 1.5rem !important;
    }

    &__subtitle {
      font-size: 9px !important;
    }

    &__trend {
      font-size: 9px;
      padding: 1px 4px;
    }

    &__icon-wrapper {
      width: 50px;
      height: 50px;

      .v-icon {
        font-size: 28px !important;
      }
    }
  }
}
</style>
