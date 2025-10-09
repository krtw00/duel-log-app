<template>
  <v-card class="stat-card" :class="`stat-card--${color}`">
    <div class="stat-card__glow"></div>
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between">
        <div>
          <p class="stat-card__title text-caption text-grey mb-2">{{ title }}</p>
          <p class="stat-card__value text-h4 font-weight-bold">{{ value }}</p>
        </div>
        <div class="stat-card__icon-wrapper">
          <v-icon
            :icon="icon"
            size="40"
            :class="`text-${color}`"
            style="-webkit-text-fill-color: initial"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
}>();
</script>

<style scoped lang="scss">
.stat-card {
  background: rgba(18, 22, 46, 0.95) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 217, 255, 0.1);
  border-radius: 12px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(0, 217, 255, 0.3);

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

  &__title {
    text-transform: uppercase;
    letter-spacing: 1px;
    font-size: 20px !important;
    white-space: nowrap;
  }

  &__value {
    background: linear-gradient(135deg, #e4e7ec 0%, rgba(228, 231, 236, 0.7) 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  &__icon-wrapper {
    width: 70px;
    height: 70px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 217, 255, 0.05);
    border-radius: 50%;
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
