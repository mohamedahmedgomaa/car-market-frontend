<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode: {
    type: String,
    default: 'table', // 'page' | 'table' | 'inline'
  },
  title: {
    type: String,
    default: 'جاري تحميل البيانات...',
  },
  subtitle: {
    type: String,
    default: 'لحظات ونكون جاهزين بأحدث العروض والتفاصيل',
  },
  height: {
    type: [String, Number],
    default: null,
  },
})

const containerStyle = computed(() => {
  if (props.mode === 'page') {
    return {
      position: 'fixed',
      inset: '0',
      zIndex: 99999,
    }
  }
  if (props.height) {
    return {
      minHeight: typeof props.height === 'number' ? `${props.height}px` : props.height,
    }
  }
  return {
    minHeight: props.mode === 'table' ? '280px' : '160px',
  }
})
</script>

<template>
  <div
    class="car-motion-loader-container d-flex flex-column align-center justify-center"
    :class="[
      `loader-mode-${mode}`,
      mode === 'page' ? 'page-backdrop' : 'table-wrapper py-8 px-4',
    ]"
    :style="containerStyle"
  >
    <!-- Brand Logo in Page Mode -->
    <div v-if="mode === 'page'" class="loader-brand-header mb-3 text-center">
      <div class="brand-logo-glow-wrapper">
        <img
          src="/images/logo/logo-dark.png"
          alt="NegmCars"
          class="brand-logo-img"
        />
      </div>
    </div>

    <!-- Brand / Stage Container -->
    <div class="animation-stage position-relative">
      <!-- Ambient Road Glow Behind Car -->
      <div class="ambient-glow" />

      <!-- Speed Wind Streaks -->
      <div class="speed-lines">
        <span class="line line-1" />
        <span class="line line-2" />
        <span class="line line-3" />
        <span class="line line-4" />
      </div>

      <!-- Animated Car SVG -->
      <div class="car-wrapper">
        <svg
          class="sports-car-svg rolls-royce-svg"
          viewBox="0 0 340 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <!-- Rolls-Royce Two-Tone Upper: Liquid Platinum / Polished Silver -->
            <linearGradient id="rrUpperSilver" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#cbd5e1" />
              <stop offset="25%" stop-color="#f8fafc" />
              <stop offset="55%" stop-color="#e2e8f0" />
              <stop offset="85%" stop-color="#ffffff" />
              <stop offset="100%" stop-color="#94a3b8" />
            </linearGradient>

            <!-- Rolls-Royce Two-Tone Lower: Royal Obsidian Black & Deep Sapphire -->
            <linearGradient id="rrLowerBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0b101d" />
              <stop offset="30%" stop-color="#141c2e" />
              <stop offset="65%" stop-color="#1e293b" />
              <stop offset="85%" stop-color="#243048" />
              <stop offset="100%" stop-color="#0f172a" />
            </linearGradient>

            <!-- Rolls-Royce Signature Handcrafted Coachline (Gold / Brand Amber) -->
            <linearGradient id="rrCoachline" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ff8800" />
              <stop offset="50%" stop-color="#ffb703" />
              <stop offset="100%" stop-color="#ff6b00" />
            </linearGradient>

            <!-- Privacy Glass Window Tint -->
            <linearGradient id="rrWindowTint" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#090d16" stop-opacity="0.96" />
              <stop offset="100%" stop-color="#171e2e" stop-opacity="0.88" />
            </linearGradient>

            <!-- Pantheon Chrome Grille Gradient -->
            <linearGradient id="rrGrilleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="20%" stop-color="#94a3b8" />
              <stop offset="50%" stop-color="#f1f5f9" />
              <stop offset="80%" stop-color="#64748b" />
              <stop offset="100%" stop-color="#e2e8f0" />
            </linearGradient>

            <!-- Chrome Trim Highlights -->
            <linearGradient id="rrChrome" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#94a3b8" />
              <stop offset="35%" stop-color="#ffffff" />
              <stop offset="70%" stop-color="#cbd5e1" />
              <stop offset="100%" stop-color="#64748b" />
            </linearGradient>

            <!-- Headlight Cone Gradient -->
            <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#ffd599" stop-opacity="0.9" />
              <stop offset="35%" stop-color="#ffaa33" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#ff6b00" stop-opacity="0" />
            </linearGradient>

            <!-- Taillight Laser Streak -->
            <linearGradient id="taillightStreak" x1="100%" y1="0%" x2="0%" y2="0%">
              <stop offset="0%" stop-color="#ff1a1a" stop-opacity="0.95" />
              <stop offset="100%" stop-color="#ff1a1a" stop-opacity="0" />
            </linearGradient>

            <!-- Rolls-Royce Luxury Rim Gradient -->
            <radialGradient id="rrRimGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#ffffff" />
              <stop offset="40%" stop-color="#cbd5e1" />
              <stop offset="70%" stop-color="#334155" />
              <stop offset="95%" stop-color="#0f172a" />
              <stop offset="100%" stop-color="#020617" />
            </radialGradient>
          </defs>

          <!-- Headlight Projector Beams Casting Ahead from Pantheon Grille -->
          <polygon
            points="292,62 340,48 340,95 292,76"
            fill="url(#headlightBeam)"
            class="light-beam"
          />

          <!-- Taillight Motion Streak Trailing Behind -->
          <polygon
            points="48,60 0,55 0,72 48,68"
            fill="url(#taillightStreak)"
            class="tail-streak"
          />

          <!-- Rolls-Royce Chassis & Body -->
          <g class="chassis-group">
            <!-- Ground Shadow under Majestic Wheelbase -->
            <ellipse cx="170" cy="98" rx="122" ry="7" fill="rgba(0,0,0,0.55)" class="ground-shadow" />

            <!-- Underbody Chassis & Exhaust Silencer -->
            <path
              d="M 46 81 L 68 81 Q 88 81 92 78 L 235 78 Q 238 81 258 81 L 288 81 Q 295 81 294 76 L 290 73 L 46 73 Z"
              fill="#090d16"
            />

            <!-- Lower Body Section: Obsidian Black / Sapphire (Doors, Wings, Bumpers) -->
            <path
              d="M 44 76 
                 L 41 62 
                 C 41 57, 44 54, 52 54 
                 L 90 54 
                 L 190 54 
                 L 282 54 
                 C 290 54, 294 56, 294 62 
                 L 294 76 
                 C 294 80, 288 81, 280 81 
                 C 275 70, 265 64, 252 64 
                 C 239 64, 229 70, 224 81 
                 L 112 81 
                 C 107 70, 97 64, 84 64 
                 C 71 64, 61 70, 56 81 
                 L 46 81 
                 C 43 81, 44 78, 44 76 Z"
              fill="url(#rrLowerBody)"
            />

            <!-- Lower Chrome Rocker Sill Moulding -->
            <path
              d="M 114 78 L 222 78 L 222 80 L 114 80 Z"
              fill="url(#rrChrome)"
            />

            <!-- Upper Body Section: Liquid Platinum / Polished Silver (Bonnet, Roof, C-Pillar) -->
            <path
              d="M 52 54 
                 L 86 53 
                 C 94 53, 106 42, 118 31 
                 C 124 26, 134 26, 145 26 
                 L 182 26 
                 C 192 26, 202 34, 212 45 
                 L 220 53 
                 L 286 53 
                 C 291 53, 293 55, 293 57 
                 L 293 62 
                 L 282 54 
                 L 52 54 Z"
              fill="url(#rrUpperSilver)"
            />

            <!-- Rolls-Royce Hand-Painted Coachline (Golden Waistline Stripe) -->
            <path
              d="M 46 54 L 292 54"
              stroke="url(#rrCoachline)"
              stroke-width="1.6"
              stroke-linecap="round"
            />

            <!-- Privacy Glass Windows (Rolls-Royce Glasshouse & Chrome Frame) -->
            <!-- Full Chrome Window Surround -->
            <path
              d="M 112 51 
                 C 118 39, 126 30, 140 29 
                 L 180 29 
                 C 190 29, 198 36, 206 45 
                 L 212 51 
                 Z"
              fill="url(#rrChrome)"
              stroke="#64748b"
              stroke-width="0.8"
            />
            <!-- Dark Tinted Windows -->
            <path
              d="M 115 50 
                 C 120 40, 128 32, 140 31 
                 L 178 31 
                 C 187 31, 195 37, 202 45 
                 L 208 50 
                 Z"
              fill="url(#rrWindowTint)"
            />
            <!-- Thick Privacy C-Pillar & Polished B-Pillar Divider -->
            <line x1="166" y1="31" x2="166" y2="50" stroke="url(#rrChrome)" stroke-width="2.2" />
            <path d="M 132 50 L 142 32" stroke="rgba(255,255,255,0.2)" stroke-width="1" />

            <!-- Suicide Coach Doors: Center Chrome Door Handles Meeting in the Middle -->
            <!-- Door Shutlines -->
            <line x1="210" y1="54" x2="216" y2="78" stroke="#0b101d" stroke-width="1.2" />
            <line x1="166" y1="54" x2="166" y2="78" stroke="#0b101d" stroke-width="1.5" />
            <line x1="108" y1="54" x2="104" y2="78" stroke="#0b101d" stroke-width="1.2" />

            <!-- Rolls-Royce Paired Coach Door Handles (Touching at Center) -->
            <rect x="156" y="56" width="9" height="2.8" rx="1.2" fill="url(#rrChrome)" />
            <rect x="167" y="56" width="9" height="2.8" rx="1.2" fill="url(#rrChrome)" />

            <!-- The Monumental Pantheon Front Grille (Upright & Proud) -->
            <rect x="290" y="54" width="4.5" height="20" rx="1" fill="url(#rrGrilleGrad)" stroke="#ffffff" stroke-width="0.6" />
            <!-- Vertical Grille Slats -->
            <line x1="291" y1="56" x2="291" y2="72" stroke="#334155" stroke-width="0.6" />
            <line x1="292.5" y1="56" x2="292.5" y2="72" stroke="#334155" stroke-width="0.6" />
            <line x1="294" y1="56" x2="294" y2="72" stroke="#334155" stroke-width="0.6" />

            <!-- The Spirit of Ecstasy Mascot (تمثال الروح المجنح الأيقوني) -->
            <g class="spirit-of-ecstasy" transform="translate(290, 48)">
              <!-- Base Plinth -->
              <rect x="-1" y="4" width="3" height="1.5" fill="#e2e8f0" />
              <!-- Figurine Body leaning into the wind -->
              <path
                d="M 0 4 Q -1 2, 0 0 Q 1 -2, 2 -3 Q 2.5 -1, 1 1 Z"
                fill="#ffffff"
                filter="drop-shadow(0 0 3px rgba(255,255,255,0.9))"
              />
              <!-- Majestic Wing Billowing Back -->
              <path
                d="M 0 1 Q -4 -2, -6 -1 Q -3 2, 0 3 Z"
                fill="#cbd5e1"
                opacity="0.9"
              />
            </g>

            <!-- Rolls-Royce Laser LED Headlight Assembly -->
            <rect x="283" y="57" width="8" height="5" rx="1" fill="#0f172a" stroke="url(#rrChrome)" stroke-width="0.8" />
            <rect x="284.5" y="58.5" width="5" height="2" fill="#ffffff" class="headlight-bulb" />
            <circle cx="289" cy="61" r="1.5" fill="#ffd700" />

            <!-- Rolls-Royce Vertical Crystal Jewel Taillight -->
            <rect x="42" y="57" width="4" height="9" rx="1" fill="#ff1a1a" class="taillight-bulb" />
            <rect x="43" y="59" width="2" height="5" fill="#ffffff" />
            <line x1="41" y1="56" x2="41" y2="67" stroke="url(#rrChrome)" stroke-width="0.8" />

            <!-- Elegant Chrome Side Mirror -->
            <path d="M 197 51 L 188 49 L 188 54 Z" fill="#334155" />
            <rect x="187" y="49.5" width="4" height="2.5" rx="1" fill="url(#rrChrome)" />
          </g>

          <!-- Rolls-Royce Rear Wheel Assembly (With Floating Weighted Center Cap) -->
          <g class="wheel rear-wheel" transform="translate(84, 80)">
            <!-- Outer Tire (Luxury Low Noise Rubber) -->
            <circle cx="0" cy="0" r="17" fill="#090d16" stroke="#1e293b" stroke-width="2.2" />
            <!-- Inner Chrome Rim Base -->
            <circle cx="0" cy="0" r="12.5" fill="url(#rrRimGrad)" />
            <!-- Ventilated Brake Disc & Polished Caliper -->
            <circle cx="0" cy="0" r="8.5" fill="#475569" />
            <path d="M -6 -6 L -2 -8 L -1 -4 Z" fill="#ff8800" />

            <!-- Rolls-Royce Turbine Polished Spokes (Spinning) -->
            <g class="spokes">
              <line x1="-11" y1="0" x2="11" y2="0" stroke="#f8fafc" stroke-width="1.8" />
              <line x1="0" y1="-11" x2="0" y2="11" stroke="#f8fafc" stroke-width="1.8" />
              <line x1="-8" y1="-8" x2="8" y2="8" stroke="#94a3b8" stroke-width="1.5" />
              <line x1="-8" y1="8" x2="8" y2="-8" stroke="#94a3b8" stroke-width="1.5" />
              <line x1="-10" y1="-4" x2="10" y2="4" stroke="#cbd5e1" stroke-width="1.2" />
              <line x1="-4" y1="-10" x2="4" y2="10" stroke="#cbd5e1" stroke-width="1.2" />
            </g>

            <!-- Floating RR Center Cap (Weighted: Does NOT spin with wheel!) -->
            <circle cx="0" cy="0" r="4.2" fill="#0f172a" stroke="url(#rrChrome)" stroke-width="1.2" />
            <!-- RR Monogram in Center -->
            <text x="0" y="1.6" font-size="3.5" font-weight="900" font-family="'Times New Roman', serif" fill="#f8fafc" text-anchor="middle">RR</text>
          </g>

          <!-- Rolls-Royce Front Wheel Assembly (With Floating Weighted Center Cap) -->
          <g class="wheel front-wheel" transform="translate(252, 80)">
            <!-- Outer Tire -->
            <circle cx="0" cy="0" r="17" fill="#090d16" stroke="#1e293b" stroke-width="2.2" />
            <!-- Inner Chrome Rim Base -->
            <circle cx="0" cy="0" r="12.5" fill="url(#rrRimGrad)" />
            <!-- Ventilated Brake Disc & Caliper -->
            <circle cx="0" cy="0" r="8.5" fill="#475569" />
            <path d="M -6 -6 L -2 -8 L -1 -4 Z" fill="#ff8800" />

            <!-- Rolls-Royce Turbine Polished Spokes (Spinning) -->
            <g class="spokes">
              <line x1="-11" y1="0" x2="11" y2="0" stroke="#f8fafc" stroke-width="1.8" />
              <line x1="0" y1="-11" x2="0" y2="11" stroke="#f8fafc" stroke-width="1.8" />
              <line x1="-8" y1="-8" x2="8" y2="8" stroke="#94a3b8" stroke-width="1.5" />
              <line x1="-8" y1="8" x2="8" y2="-8" stroke="#94a3b8" stroke-width="1.5" />
              <line x1="-10" y1="-4" x2="10" y2="4" stroke="#cbd5e1" stroke-width="1.2" />
              <line x1="-4" y1="-10" x2="4" y2="10" stroke="#cbd5e1" stroke-width="1.2" />
            </g>

            <!-- Floating RR Center Cap (Weighted: Stays upright!) -->
            <circle cx="0" cy="0" r="4.2" fill="#0f172a" stroke="url(#rrChrome)" stroke-width="1.2" />
            <!-- RR Monogram in Center -->
            <text x="0" y="1.6" font-size="3.5" font-weight="900" font-family="'Times New Roman', serif" fill="#f8fafc" text-anchor="middle">RR</text>
          </g>
        </svg>
      </div>

      <!-- Road Surface & Neon Dashes -->
      <div class="road-track">
        <div class="road-asphalt" />
        <div class="road-stripes" />
        <div class="road-glow-line" />
      </div>
    </div>

    <!-- Loading Text & Status Feedback -->
    <div class="loader-feedback text-center mt-5">
      <div class="d-flex align-center justify-center gap-2 mb-1">
        <h4 class="loader-title text-base font-weight-bold mb-0">
          {{ title }}
        </h4>
        <span class="pulsing-dots">
          <span class="dot d-1" />
          <span class="dot d-2" />
          <span class="dot d-3" />
        </span>
      </div>

      <p v-if="subtitle" class="loader-subtitle text-xs text-medium-emphasis mb-0">
        {{ subtitle }}
      </p>

      <!-- Mini animated progress bar -->
      <div class="motion-progress-bar mx-auto mt-2.5">
        <div class="progress-nitro" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.car-motion-loader-container {
  width: 100%;
  user-select: none;
  transition: opacity 0.3s ease;
}

/* Page mode overlay */
.loader-mode-page.page-backdrop {
  background: rgba(11, 13, 20, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

/* Table mode wrapper */
.loader-mode-table.table-wrapper {
  background: rgba(var(--v-theme-surface), 0.65);
  border-radius: 12px;
}

/* Brand Logo in Page Mode */
.brand-logo-glow-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.brand-logo-img {
  width: 54px;
  height: 54px;
  object-fit: contain;
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(255, 107, 0, 0.45);
  border: 1.5px solid rgba(255, 107, 0, 0.35);
  animation: logo-float 2.5s infinite ease-in-out alternate;
}

@keyframes logo-float {
  0% { transform: translateY(0); filter: drop-shadow(0 4px 15px rgba(255, 107, 0, 0.3)); }
  100% { transform: translateY(-4px); filter: drop-shadow(0 8px 25px rgba(255, 107, 0, 0.6)); }
}

/* Animation Stage */
.animation-stage {
  width: 320px;
  height: 125px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

/* Ambient Radial Glow */
.ambient-glow {
  position: absolute;
  top: 15px;
  left: 50%;
  transform: translateX(-50%);
  width: 260px;
  height: 90px;
  background: radial-gradient(ellipse at center, rgba(255, 107, 0, 0.28) 0%, rgba(255, 107, 0, 0) 70%);
  filter: blur(16px);
  pointer-events: none;
  z-index: 0;
}

/* Speed Lines Trailing Behind Car */
.speed-lines {
  position: absolute;
  left: 0;
  top: 30px;
  width: 100%;
  height: 60px;
  pointer-events: none;
  z-index: 1;
}

.speed-lines .line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, rgba(255, 107, 0, 0), rgba(255, 107, 0, 0.65), rgba(255, 255, 255, 0.9), rgba(255, 107, 0, 0));
  border-radius: 2px;
  animation: speed-streak 0.75s infinite linear;
}

.speed-lines .line-1 {
  top: 10px;
  width: 80px;
  animation-delay: 0s;
}

.speed-lines .line-2 {
  top: 26px;
  width: 110px;
  animation-delay: 0.22s;
}

.speed-lines .line-3 {
  top: 42px;
  width: 70px;
  animation-delay: 0.44s;
}

.speed-lines .line-4 {
  top: 55px;
  width: 95px;
  animation-delay: 0.15s;
}

@keyframes speed-streak {
  0% {
    transform: translateX(260px);
    opacity: 0;
  }
  20% {
    opacity: 1;
  }
  80% {
    opacity: 1;
  }
  100% {
    transform: translateX(-60px);
    opacity: 0;
  }
}

/* Car Suspension Bounce & Vibration */
.car-wrapper {
  position: relative;
  z-index: 2;
  animation: car-suspension 0.55s infinite ease-in-out alternate;
}

@keyframes car-suspension {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-2px) rotate(-0.3deg);
  }
  100% {
    transform: translateY(1px) rotate(0.3deg);
  }
}

.sports-car-svg {
  width: 290px;
  height: 105px;
  filter: drop-shadow(0 6px 14px rgba(255, 107, 0, 0.28));
}

.rolls-royce-svg {
  filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.5)) drop-shadow(0 2px 8px rgba(255, 107, 0, 0.25));
}

.spirit-of-ecstasy {
  animation: ecstasy-shimmer 2s infinite ease-in-out alternate;
}

@keyframes ecstasy-shimmer {
  0% {
    filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
  }
  100% {
    filter: drop-shadow(0 0 6px rgba(255, 255, 255, 1));
  }
}

/* Rotating Wheel Spokes */
.spokes {
  animation: spin-wheel 0.35s infinite linear;
  transform-origin: 0 0;
}

@keyframes spin-wheel {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Headlight & Taillight Pulsing */
.headlight-bulb {
  animation: light-pulse 0.4s infinite alternate;
}

.taillight-bulb {
  animation: tail-pulse 0.5s infinite alternate;
}

@keyframes light-pulse {
  from {
    opacity: 0.75;
    filter: drop-shadow(0 0 4px #ffd700);
  }
  to {
    opacity: 1;
    filter: drop-shadow(0 0 10px #ff9900);
  }
}

@keyframes tail-pulse {
  from {
    opacity: 0.8;
  }
  to {
    opacity: 1;
    filter: drop-shadow(0 0 8px #ff1a1a);
  }
}

/* Road Track & Moving Asphalt Lines */
.road-track {
  position: relative;
  width: 290px;
  height: 10px;
  margin-top: -6px;
  z-index: 1;
  overflow: hidden;
}

.road-asphalt {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255, 255, 255, 0.12);
}

.road-stripes {
  position: absolute;
  top: 2px;
  left: 0;
  width: 200%;
  height: 3px;
  background: repeating-linear-gradient(
    90deg,
    #ff6b00 0px,
    #ff6b00 24px,
    transparent 24px,
    transparent 48px
  );
  animation: move-road 0.4s infinite linear;
}

.road-glow-line {
  position: absolute;
  top: 4px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255, 107, 0, 0.5), transparent);
  filter: blur(2px);
}

@keyframes move-road {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-48px);
  }
}

/* Feedback & Progress */
.loader-title {
  color: rgb(var(--v-theme-on-surface));
  letter-spacing: normal;
}

.pulsing-dots .dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #ff6b00;
  margin: 0 1.5px;
  animation: pulse-dot 1.2s infinite ease-in-out;
}

.pulsing-dots .d-1 {
  animation-delay: 0s;
}

.pulsing-dots .d-2 {
  animation-delay: 0.2s;
}

.pulsing-dots .d-3 {
  animation-delay: 0.4s;
}

@keyframes pulse-dot {
  0%, 80%, 100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1.3);
    opacity: 1;
  }
}

/* Nitro Progress Bar */
.motion-progress-bar {
  width: 140px;
  height: 3px;
  background: rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-nitro {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 45%;
  background: linear-gradient(90deg, transparent, #ff6b00, #ffaa00);
  border-radius: 4px;
  animation: nitro-run 1.1s infinite ease-in-out;
}

@keyframes nitro-run {
  0% {
    left: -45%;
  }
  100% {
    left: 100%;
  }
}
</style>
