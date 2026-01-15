<template>
  <v-card class="stat-card" :class="`stat-card--${color}`">
    <div class="stat-card__glow"></div>
    <v-card-text class="pa-4">
      <div class="d-flex align-center justify-space-between">
        <div>
          <p class="stat-card__title text-caption mb-2">{{ title }}</p>
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
