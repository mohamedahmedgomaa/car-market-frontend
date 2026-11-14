<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  car: {
    type: Object,
    default: () => null,
  },
})

const emit = defineEmits(['update:isDialogVisible'])

// ----------------------------------------------------
// ✅ Capabilities & Mode Selection
// ----------------------------------------------------
const hasExterior360 = computed(() => {
  return Array.isArray(props.car?.exterior_360_images) && props.car.exterior_360_images.length > 0
})

const hasInterior360 = computed(() => {
  return !!props.car?.interior_360_url
})

// ✅ Explicit 3D model only: Never force or fallback to generic GLB unless specifically provided
const has3DModel = computed(() => {
  return !!(props.car?.model_3d_url || props.car?.model?.model_3d_url)
})

const activeMode = ref('360_exterior') // '360_exterior' | '360_interior' | '3d_model'

// Set initial active mode on open or car change
const initActiveMode = () => {
  if (hasExterior360.value) {
    activeMode.value = '360_exterior'
  } else if (hasInterior360.value) {
    activeMode.value = '360_interior'
  } else if (has3DModel.value) {
    activeMode.value = '3d_model'
  }
}

const isFullscreen = ref(false)
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  setTimeout(() => {
    handleResize()
  }, 120)
}

const carTitle = computed(() => {
  if (!props.car) return 'معاينة وفحص السيارة'
  if (typeof props.car.title === 'object') {
    return props.car.title?.ar || props.car.title?.en || 'معاينة وفحص السيارة'
  }
  return props.car.title || 'معاينة وفحص السيارة'
})

// Helper to resolve asset URLs
const resolveAssetUrl = (url) => {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url
}

// ----------------------------------------------------
// 🌟 1. EXTERIOR 360° SPIN (Real Photos Turntable)
// ----------------------------------------------------
const spinCanvasRef = ref(null)
const spinWrapperRef = ref(null)
const exteriorFrames = computed(() => {
  if (hasExterior360.value) {
    return props.car.exterior_360_images.map(resolveAssetUrl)
  }
  // Local fallback frames if car exists
  return Array.from({ length: 24 }, (_, i) => `/images/360/exterior-coupe/frame_${i + 1}.jpg`)
})

const totalSpinFrames = computed(() => exteriorFrames.value.length || 24)
const currentFrame = ref(0)
const isSpinPreloading = ref(true)
const spinPreloadPercent = ref(0)
const isAutoSpinning = ref(false)
const isDraggingSpin = ref(false)

const currentAngleDeg = computed(() => {
  if (totalSpinFrames.value <= 0) return 0
  return Math.round((currentFrame.value / totalSpinFrames.value) * 360)
})

let cachedSpinImages = []
let spinAutoInterval = null
let spinStartX = 0
let spinStartFrame = 0
let spinLastX = 0
let spinVelocity = 0
let spinInertiaAnimId = null

// Preload Exterior Spin Frames
const preloadSpinImages = () => {
  isSpinPreloading.value = true
  spinPreloadPercent.value = 0
  cachedSpinImages = []

  const urls = exteriorFrames.value
  let loadedCount = 0

  urls.forEach((url, index) => {
    const img = new Image()
    img.src = url
    img.onload = () => {
      loadedCount++
      spinPreloadPercent.value = Math.round((loadedCount / urls.length) * 100)
      if (index === 0) {
        renderSpinFrame(0)
      }
      if (loadedCount === urls.length) {
        isSpinPreloading.value = false
        renderSpinFrame(currentFrame.value)
      }
    }
    img.onerror = () => {
      loadedCount++
      if (loadedCount === urls.length) isSpinPreloading.value = false
    }
    cachedSpinImages[index] = img
  })
}

// Render active frame to Canvas
const renderSpinFrame = (frameIdx) => {
  const canvas = spinCanvasRef.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = cachedSpinImages[frameIdx]
  if (!img || !img.complete || img.naturalWidth === 0) return

  // Resize canvas to client dimensions
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Maintain aspect ratio cover / contain
  const imgRatio = img.naturalWidth / img.naturalHeight
  const canvasRatio = canvas.width / canvas.height

  let drawW, drawH, drawX, drawY
  if (canvasRatio > imgRatio) {
    drawH = canvas.height * 0.92
    drawW = drawH * imgRatio
  } else {
    drawW = canvas.width * 0.92
    drawH = drawW / imgRatio
  }

  drawX = (canvas.width - drawW) / 2
  drawY = (canvas.height - drawH) / 2

  ctx.drawImage(img, drawX, drawY, drawW, drawH)
}

// Change Frame with bounds
const setFrame = (newFrame) => {
  const total = totalSpinFrames.value
  const normalized = ((newFrame % total) + total) % total
  currentFrame.value = normalized
  renderSpinFrame(normalized)
}

// Auto-spin Toggle
const toggleAutoSpin = () => {
  isAutoSpinning.value = !isAutoSpinning.value
  if (isAutoSpinning.value) {
    stopSpinInertia()
    spinAutoInterval = setInterval(() => {
      setFrame(currentFrame.value + 1)
    }, 60)
  } else {
    clearInterval(spinAutoInterval)
    spinAutoInterval = null
  }
}

const stopAutoSpin = () => {
  if (isAutoSpinning.value) {
    isAutoSpinning.value = false
    clearInterval(spinAutoInterval)
    spinAutoInterval = null
  }
}

// Drag Handlers for Spin
const onSpinPointerDown = (e) => {
  stopAutoSpin()
  stopSpinInertia()
  isDraggingSpin.value = true
  spinStartX = e.clientX || (e.touches && e.touches[0].clientX) || 0
  spinLastX = spinStartX
  spinStartFrame = currentFrame.value
  spinVelocity = 0

  window.addEventListener('pointermove', onSpinPointerMove)
  window.addEventListener('pointerup', onSpinPointerUp)
  window.addEventListener('touchmove', onSpinPointerMove, { passive: false })
  window.addEventListener('touchend', onSpinPointerUp)
}

const onSpinPointerMove = (e) => {
  if (!isDraggingSpin.value) return
  if (e.cancelable && e.type === 'touchmove') e.preventDefault()

  const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0].clientX) || 0
  const deltaX = clientX - spinStartX
  spinVelocity = clientX - spinLastX
  spinLastX = clientX

  // Sensitivity: ~15px per frame
  const framesDiff = Math.floor(deltaX / 16)
  setFrame(spinStartFrame - framesDiff)
}

const onSpinPointerUp = () => {
  if (!isDraggingSpin.value) return
  isDraggingSpin.value = false
  window.removeEventListener('pointermove', onSpinPointerMove)
  window.removeEventListener('pointerup', onSpinPointerUp)
  window.removeEventListener('touchmove', onSpinPointerMove)
  window.removeEventListener('touchend', onSpinPointerUp)

  // Apply smooth momentum
  if (Math.abs(spinVelocity) > 2) {
    applySpinInertia()
  }
}

const applySpinInertia = () => {
  const step = () => {
    if (Math.abs(spinVelocity) < 0.2) {
      stopSpinInertia()
      return
    }
    const deltaFrames = spinVelocity > 0 ? -1 : 1
    setFrame(currentFrame.value + deltaFrames)
    spinVelocity *= 0.92
    spinInertiaAnimId = requestAnimationFrame(step)
  }
  spinInertiaAnimId = requestAnimationFrame(step)
}

const stopSpinInertia = () => {
  if (spinInertiaAnimId) {
    cancelAnimationFrame(spinInertiaAnimId)
    spinInertiaAnimId = null
  }
}

const resetSpinAngle = () => {
  stopAutoSpin()
  stopSpinInertia()
  setFrame(0)
}

// ----------------------------------------------------
// 🛋️ 2. INTERIOR 360° PANORAMA (Three.js Sphere)
// ----------------------------------------------------
const interiorContainerRef = ref(null)
const isInteriorLoading = ref(true)
let interiorScene = null
let interiorCamera = null
let interiorRenderer = null
let interiorControls = null
let interiorAnimId = null
const isInteriorAutoRotating = ref(true)

const initInteriorPanorama = () => {
  const container = interiorContainerRef.value
  if (!container) return

  isInteriorLoading.value = true
  cleanupInterior()

  const width = container.clientWidth || 800
  const height = container.clientHeight || 500

  interiorScene = new THREE.Scene()
  interiorCamera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000)
  interiorCamera.position.set(0, 0, 0.1)

  interiorRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  interiorRenderer.setSize(width, height)
  interiorRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  interiorRenderer.outputColorSpace = THREE.SRGBColorSpace
  container.innerHTML = ''
  container.appendChild(interiorRenderer.domElement)

  interiorControls = new OrbitControls(interiorCamera, interiorRenderer.domElement)
  interiorControls.enableZoom = true
  interiorControls.minDistance = 0.1
  interiorControls.maxDistance = 20
  interiorControls.enablePan = false
  interiorControls.enableDamping = true
  interiorControls.dampingFactor = 0.05
  interiorControls.rotateSpeed = -0.3 // Invert for natural inside-out looking
  interiorControls.autoRotate = isInteriorAutoRotating.value
  interiorControls.autoRotateSpeed = 0.5

  // Load Panoramic Equirectangular Texture
  const textureLoader = new THREE.TextureLoader()
  const panoUrl = resolveAssetUrl(props.car?.interior_360_url || '/images/360/interiors/cockpit_360.jpg')

  textureLoader.load(
    panoUrl,
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.mapping = THREE.EquirectangularReflectionMapping

      // Inverted Sphere geometry so inside is visible
      const sphereGeo = new THREE.SphereGeometry(500, 60, 40)
      sphereGeo.scale(-1, 1, 1)

      const sphereMat = new THREE.MeshBasicMaterial({ map: texture })
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat)
      interiorScene.add(sphereMesh)

      isInteriorLoading.value = false
    },
    undefined,
    (err) => {
      console.warn('Error loading interior 360 panorama:', err)
      isInteriorLoading.value = false
    },
  )

  const animateInterior = () => {
    interiorAnimId = requestAnimationFrame(animateInterior)
    if (interiorControls) interiorControls.update()
    if (interiorRenderer && interiorScene && interiorCamera) {
      interiorRenderer.render(interiorScene, interiorCamera)
    }
  }
  animateInterior()
}

const toggleInteriorAutoRotate = () => {
  isInteriorAutoRotating.value = !isInteriorAutoRotating.value
  if (interiorControls) {
    interiorControls.autoRotate = isInteriorAutoRotating.value
  }
}

const resetInteriorView = () => {
  if (interiorControls && interiorCamera) {
    interiorCamera.position.set(0, 0, 0.1)
    interiorControls.target.set(0, 0, -1)
    interiorControls.update()
  }
}

const cleanupInterior = () => {
  if (interiorAnimId) {
    cancelAnimationFrame(interiorAnimId)
    interiorAnimId = null
  }
  if (interiorControls) {
    interiorControls.dispose()
    interiorControls = null
  }
  if (interiorRenderer) {
    interiorRenderer.dispose()
    if (interiorRenderer.domElement && interiorRenderer.domElement.parentNode) {
      interiorRenderer.domElement.parentNode.removeChild(interiorRenderer.domElement)
    }
    interiorRenderer = null
  }
  interiorScene = null
  interiorCamera = null
}

// ----------------------------------------------------
// 🏎️ 3. 3D GLTF MODEL INSPECTION (Optional / If provided)
// ----------------------------------------------------
const model3DContainerRef = ref(null)
const is3DLoading = ref(true)
const loadProgress3D = ref(0)
const is3DAutoRotating = ref(true)
let scene3D = null
let camera3D = null
let renderer3D = null
let controls3D = null
let car3DModel = null
let animId3D = null
const carBodyMeshes = []
const activeColorHex = ref('#70747a')

const colorPresets = [
  { name: 'فضي معدني', nameEn: 'Metallic Silver', hex: '#8a8d91', roughness: 0.25, metalness: 0.85 },
  { name: 'أسود ملكي', nameEn: 'Obsidian Black', hex: '#161616', roughness: 0.2, metalness: 0.85 },
  { name: 'أبيض لؤلؤي', nameEn: 'Pearl White', hex: '#f2f2f2', roughness: 0.2, metalness: 0.15 },
  { name: 'أحمر قرمزي', nameEn: 'Rosso Red', hex: '#ba181b', roughness: 0.18, metalness: 0.65 },
  { name: 'أزرق ملكي', nameEn: 'Royal Blue', hex: '#14387f', roughness: 0.22, metalness: 0.8 },
  { name: 'رمادي دايتونا', nameEn: 'Daytona Gray', hex: '#373a3c', roughness: 0.3, metalness: 0.75 },
]

const init3DViewer = () => {
  const container = model3DContainerRef.value
  if (!container || !has3DModel.value) return

  is3DLoading.value = true
  loadProgress3D.value = 0
  cleanup3D()

  const width = container.clientWidth || 800
  const height = container.clientHeight || 500

  scene3D = new THREE.Scene()
  camera3D = new THREE.PerspectiveCamera(45, width / height, 0.1, 100)
  camera3D.position.set(3.8, 1.8, 4.2)

  renderer3D = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer3D.setSize(width, height)
  renderer3D.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer3D.outputColorSpace = THREE.SRGBColorSpace
  renderer3D.toneMapping = THREE.ACESFilmicToneMapping
  renderer3D.toneMappingExposure = 1.2
  container.innerHTML = ''
  container.appendChild(renderer3D.domElement)

  controls3D = new OrbitControls(camera3D, renderer3D.domElement)
  controls3D.enableDamping = true
  controls3D.dampingFactor = 0.05
  controls3D.maxPolarAngle = Math.PI / 2 - 0.02
  controls3D.minDistance = 2.0
  controls3D.maxDistance = 10.0
  controls3D.autoRotate = is3DAutoRotating.value
  controls3D.autoRotateSpeed = 1.0

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5)
  scene3D.add(ambientLight)

  const dirLight1 = new THREE.DirectionalLight(0xffffff, 2.0)
  dirLight1.position.set(5, 8, 5)
  scene3D.add(dirLight1)

  const dirLight2 = new THREE.DirectionalLight(0x90b0ff, 1.2)
  dirLight2.position.set(-5, 6, -5)
  scene3D.add(dirLight2)

  // Ground Grid Disc
  const gridHelper = new THREE.GridHelper(10, 20, 0x00d2ff, 0x1f2937)
  gridHelper.position.y = -0.01
  scene3D.add(gridHelper)

  // Load Model with DRACO
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('/draco/')
  dracoLoader.setDecoderConfig({ type: 'js' })

  const gltfLoader = new GLTFLoader()
  gltfLoader.setDRACOLoader(dracoLoader)

  const modelUrl = resolveAssetUrl(props.car.model_3d_url || props.car.model?.model_3d_url)

  gltfLoader.load(
    modelUrl,
    (gltf) => {
      car3DModel = gltf.scene

      const box = new THREE.Box3().setFromObject(car3DModel)
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())

      car3DModel.position.sub(center)
      car3DModel.position.y += size.y / 2

      carBodyMeshes.length = 0
      car3DModel.traverse((child) => {
        if (child.isMesh) {
          const matName = (child.material?.name || '').toLowerCase()
          const meshName = (child.name || '').toLowerCase()
          if (
            matName.includes('paint') ||
            matName.includes('body') ||
            matName.includes('car_paint') ||
            matName.includes('exterior') ||
            meshName.includes('body')
          ) {
            carBodyMeshes.push(child)
          }
        }
      })

      scene3D.add(car3DModel)
      is3DLoading.value = false
    },
    (xhr) => {
      if (xhr.total > 0) {
        loadProgress3D.value = Math.round((xhr.loaded / xhr.total) * 100)
      }
    },
    (err) => {
      console.warn('Error loading 3D Car model:', err)
      is3DLoading.value = false
    },
  )

  const animate3D = () => {
    animId3D = requestAnimationFrame(animate3D)
    if (controls3D) controls3D.update()
    if (renderer3D && scene3D && camera3D) {
      renderer3D.render(scene3D, camera3D)
    }
  }
  animate3D()
}

const apply3DColor = (color) => {
  activeColorHex.value = color.hex
  const threeColor = new THREE.Color(color.hex)
  carBodyMeshes.forEach((mesh) => {
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => {
          if (m.color) m.color = threeColor.clone()
        })
      } else {
        mesh.material.color = threeColor.clone()
        mesh.material.roughness = color.roughness
        mesh.material.metalness = color.metalness
        mesh.material.needsUpdate = true
      }
    }
  })
}

const toggle3DAutoRotate = () => {
  is3DAutoRotating.value = !is3DAutoRotating.value
  if (controls3D) controls3D.autoRotate = is3DAutoRotating.value
}

const cleanup3D = () => {
  if (animId3D) {
    cancelAnimationFrame(animId3D)
    animId3D = null
  }
  if (controls3D) {
    controls3D.dispose()
    controls3D = null
  }
  if (renderer3D) {
    renderer3D.dispose()
    if (renderer3D.domElement && renderer3D.domElement.parentNode) {
      renderer3D.domElement.parentNode.removeChild(renderer3D.domElement)
    }
    renderer3D = null
  }
  scene3D = null
  camera3D = null
  car3DModel = null
}

// ----------------------------------------------------
// 🔄 Window Resize & Dialog Lifecycle
// ----------------------------------------------------
const handleResize = () => {
  if (activeMode.value === '360_exterior') {
    renderSpinFrame(currentFrame.value)
  } else if (activeMode.value === '360_interior' && interiorContainerRef.value && interiorRenderer && interiorCamera) {
    const w = interiorContainerRef.value.clientWidth
    const h = interiorContainerRef.value.clientHeight
    interiorCamera.aspect = w / h
    interiorCamera.updateProjectionMatrix()
    interiorRenderer.setSize(w, h)
  } else if (activeMode.value === '3d_model' && model3DContainerRef.value && renderer3D && camera3D) {
    const w = model3DContainerRef.value.clientWidth
    const h = model3DContainerRef.value.clientHeight
    camera3D.aspect = w / h
    camera3D.updateProjectionMatrix()
    renderer3D.setSize(w, h)
  }
}

watch(activeMode, (newMode) => {
  nextTick(() => {
    if (newMode === '360_exterior') {
      renderSpinFrame(currentFrame.value)
    } else if (newMode === '360_interior') {
      initInteriorPanorama()
    } else if (newMode === '3d_model') {
      init3DViewer()
    }
  })
})

watch(
  () => props.isDialogVisible,
  (val) => {
    if (val) {
      initActiveMode()
      nextTick(() => {
        preloadSpinImages()
        if (activeMode.value === '360_interior') {
          initInteriorPanorama()
        } else if (activeMode.value === '3d_model') {
          init3DViewer()
        }
      })
      window.addEventListener('resize', handleResize)
    } else {
      stopAutoSpin()
      stopSpinInertia()
      cleanupInterior()
      cleanup3D()
      window.removeEventListener('resize', handleResize)
    }
  },
)

onMounted(() => {
  if (props.isDialogVisible) {
    initActiveMode()
    preloadSpinImages()
  }
})

onBeforeUnmount(() => {
  stopAutoSpin()
  stopSpinInertia()
  cleanupInterior()
  cleanup3D()
  window.removeEventListener('resize', handleResize)
})

const closeDialog = () => {
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    :fullscreen="isFullscreen"
    max-width="1280"
    transition="dialog-bottom-transition"
    class="car-inspection-modal"
    @update:model-value="closeDialog"
  >
    <div class="inspection-viewport-card" :class="{ 'is-fullscreen': isFullscreen }">
      <!-- 🌟 TOP HEADER -->
      <header class="inspection-header">
        <div class="header-car-info">
          <div class="header-icon-box">
            <VIcon icon="tabler-view-360" size="22" color="primary" />
          </div>
          <div class="header-text-group">
            <h2 class="car-headline">{{ carTitle }}</h2>
            <div class="car-submeta">
              <span class="meta-tag">
                <VIcon icon="tabler-shield-check" size="14" color="success" />
                فحص ومعاينة تفاعلية 360°
              </span>
              <span class="meta-tag model-badge">
                {{ props.car?.year || 2024 }}
              </span>
            </div>
          </div>
        </div>

        <div class="header-actions-group">
          <!-- 🧭 Segmented View Switcher -->
          <div class="view-segmented-switcher">
            <!-- Mode 1: Exterior 360 Spin (Always available if frames exist) -->
            <button
              v-if="hasExterior360"
              type="button"
              class="switcher-tab-btn"
              :class="{ active: activeMode === '360_exterior' }"
              @click="activeMode = '360_exterior'"
            >
              <VIcon icon="tabler-rotate-clockwise" size="17" />
              <span>استعراض خارجي 360°</span>
            </button>

            <!-- Mode 2: Interior 360 Panorama -->
            <button
              v-if="hasInterior360"
              type="button"
              class="switcher-tab-btn"
              :class="{ active: activeMode === '360_interior' }"
              @click="activeMode = '360_interior'"
            >
              <VIcon icon="tabler-steering-wheel" size="17" />
              <span>مقصورة القيادة 360°</span>
            </button>

            <!-- Mode 3: 3D Model (Shown ONLY if explicitly provided) -->
            <button
              v-if="has3DModel"
              type="button"
              class="switcher-tab-btn"
              :class="{ active: activeMode === '3d_model' }"
              @click="activeMode = '3d_model'"
            >
              <VIcon icon="tabler-cube-3d-sphere" size="17" />
              <span>مجسم 3D</span>
            </button>
          </div>

          <!-- Fullscreen Toggle -->
          <button
            type="button"
            class="header-tool-btn"
            :title="isFullscreen ? 'إنهاء وضع ملء الشاشة' : 'ملء الشاشة'"
            @click="toggleFullscreen"
          >
            <VIcon :icon="isFullscreen ? 'tabler-arrows-minimize' : 'tabler-arrows-maximize'" size="19" />
          </button>

          <!-- Close Modal -->
          <button type="button" class="header-tool-btn close-btn" title="إغلاق" @click="closeDialog">
            <VIcon icon="tabler-x" size="20" />
          </button>
        </div>
      </header>

      <!-- 🌟 MAIN CONTENT AREA -->
      <div class="viewport-stage">
        <!-- ============================================== -->
        <!-- VIEW 1: EXTERIOR 360° SPIN (Real Photos)       -->
        <!-- ============================================== -->
        <div
          v-show="activeMode === '360_exterior'"
          ref="spinWrapperRef"
          class="spin-stage-container"
          @mousedown="onSpinPointerDown"
          @touchstart.passive="onSpinPointerDown"
        >
          <!-- Canvas Renderer -->
          <canvas ref="spinCanvasRef" class="spin-canvas" />

          <!-- Loading Overlay -->
          <div v-if="isSpinPreloading" class="stage-loading-overlay">
            <div class="loading-spinner" />
            <div class="loading-label">جاري تحميل صور الدوران 360° ({{ spinPreloadPercent }}%)</div>
            <div class="loading-bar">
              <div class="loading-fill" :style="{ width: spinPreloadPercent + '%' }" />
            </div>
          </div>

          <!-- Degree Badge -->
          <div class="degree-floating-badge">
            <VIcon icon="tabler-compass" size="15" />
            <span>{{ currentAngleDeg }}°</span>
            <span class="frame-count">({{ currentFrame + 1 }}/{{ totalSpinFrames }})</span>
          </div>

          <!-- Bottom Control Bar -->
          <div class="floating-controls-bar">
            <!-- Play/Pause Auto Spin -->
            <button
              type="button"
              class="control-pill-btn"
              :class="{ active: isAutoSpinning }"
              @click.stop="toggleAutoSpin"
            >
              <VIcon :icon="isAutoSpinning ? 'tabler-player-pause' : 'tabler-player-play-filled'" size="16" />
              <span>{{ isAutoSpinning ? 'إيقاف الدوران' : 'دوران تلقائي' }}</span>
            </button>

            <!-- Reset Angle -->
            <button type="button" class="control-pill-btn" @click.stop="resetSpinAngle">
              <VIcon icon="tabler-refresh" size="16" />
              <span>الواجهة الأمامية</span>
            </button>

            <!-- Interactive Degree Slider -->
            <div class="scrubber-container" @mousedown.stop @touchstart.stop>
              <input
                type="range"
                min="0"
                :max="totalSpinFrames - 1"
                :value="currentFrame"
                class="scrubber-slider"
                @input="setFrame(Number($event.target.value))"
              />
            </div>
          </div>

          <!-- Interaction Hint -->
          <div class="interaction-hint">
            <VIcon icon="tabler-hand-move" size="16" />
            <span>اسحب بالماوس أو اللمس لتدوير السيارة 360° حول الهيكل الحقيقي</span>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- VIEW 2: INTERIOR 360° PANORAMA                 -->
        <!-- ============================================== -->
        <div v-show="activeMode === '360_interior'" class="interior-stage-container">
          <div ref="interiorContainerRef" class="three-viewport" />

          <!-- Loading Overlay -->
          <div v-if="isInteriorLoading" class="stage-loading-overlay">
            <div class="loading-spinner" />
            <div class="loading-label">جاري تحميل بانوراما مقصورة القيادة 360°...</div>
          </div>

          <!-- Interior Controls -->
          <div class="floating-controls-bar">
            <button
              type="button"
              class="control-pill-btn"
              :class="{ active: isInteriorAutoRotating }"
              @click="toggleInteriorAutoRotate"
            >
              <VIcon :icon="isInteriorAutoRotating ? 'tabler-player-pause' : 'tabler-player-play-filled'" size="16" />
              <span>{{ isInteriorAutoRotating ? 'إيقاف الجولة' : 'جولة بانورامية' }}</span>
            </button>

            <button type="button" class="control-pill-btn" @click="resetInteriorView">
              <VIcon icon="tabler-steering-wheel" size="16" />
              <span>موضع السائق</span>
            </button>
          </div>

          <!-- Interaction Hint -->
          <div class="interaction-hint">
            <VIcon icon="tabler-arrows-move" size="16" />
            <span>اسحب للتنقل والنظر داخل مقصورة السيارة الحقيقية 360° في كافة الاتجاهات</span>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- VIEW 3: 3D CAD MODEL (If Provided)             -->
        <!-- ============================================== -->
        <div v-show="activeMode === '3d_model'" class="model-3d-stage-container">
          <div ref="model3DContainerRef" class="three-viewport" />

          <!-- Loading Overlay -->
          <div v-if="is3DLoading" class="stage-loading-overlay">
            <div class="loading-spinner" />
            <div class="loading-label">جاري تحميل المجسم ثلاثي الأبعاد... ({{ loadProgress3D }}%)</div>
          </div>

          <!-- 3D Controls -->
          <div class="floating-controls-bar">
            <button
              type="button"
              class="control-pill-btn"
              :class="{ active: is3DAutoRotating }"
              @click="toggle3DAutoRotate"
            >
              <VIcon :icon="is3DAutoRotating ? 'tabler-player-pause' : 'tabler-player-play-filled'" size="16" />
              <span>{{ is3DAutoRotating ? 'إيقاف الدوران' : 'دوران تلقائي' }}</span>
            </button>
          </div>

          <!-- Paint Color Palette -->
          <div class="floating-paint-palette">
            <span class="palette-label">طلاء الهيكل:</span>
            <div class="palette-swatches">
              <button
                v-for="color in colorPresets"
                :key="color.hex"
                type="button"
                class="color-swatch-btn"
                :class="{ active: activeColorHex === color.hex }"
                :style="{ backgroundColor: color.hex }"
                :title="color.name"
                @click="apply3DColor(color)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </VDialog>
</template>

<style scoped>
/* Modal Base */
.car-inspection-modal {
  z-index: 9999 !important;
}

.inspection-viewport-card {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 82vh;
  min-height: 580px;
  background: radial-gradient(circle at 50% 20%, #161b24 0%, #0b0e14 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
  color: #fff;
}

.inspection-viewport-card.is-fullscreen {
  height: 100vh !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
}

/* Header */
.inspection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(15, 20, 28, 0.88);
  backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  z-index: 20;
}

.header-car-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon-box {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 107, 0, 0.12);
  border: 1px solid rgba(255, 107, 0, 0.25);
}

.header-text-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.car-headline {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.2px;
}

.car-submeta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
}

.model-badge {
  padding: 1px 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-weight: 600;
  color: #ff9f43;
}

.header-actions-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* View Switcher */
.view-segmented-switcher {
  display: inline-flex;
  align-items: center;
  padding: 3px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  gap: 4px;
}

.switcher-tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.switcher-tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.switcher-tab-btn.active {
  color: #fff;
  background: #ff6b00;
  box-shadow: 0 2px 10px rgba(255, 107, 0, 0.4);
}

/* Header Buttons */
.header-tool-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.header-tool-btn.close-btn:hover {
  background: rgba(234, 84, 85, 0.2);
  color: #ea5455;
  border-color: rgba(234, 84, 85, 0.4);
}

/* Stage Area */
.viewport-stage {
  position: relative;
  flex: 1;
  width: 100%;
  height: calc(100% - 65px);
  overflow: hidden;
}

.spin-stage-container,
.interior-stage-container,
.model-3d-stage-container {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  user-select: none;
}

.spin-stage-container:active {
  cursor: grabbing;
}

.spin-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.three-viewport {
  width: 100%;
  height: 100%;
  display: block;
}

/* Floating Controls Bar */
.floating-controls-bar {
  position: absolute;
  bottom: 22px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px;
  background: rgba(15, 20, 28, 0.85);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.control-pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.control-pill-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.control-pill-btn.active {
  background: #ff6b00;
  color: #fff;
  border-color: #ff6b00;
}

/* Degree Scrubber */
.scrubber-container {
  display: flex;
  align-items: center;
  width: 120px;
  padding: 0 4px;
}

.scrubber-slider {
  width: 100%;
  height: 4px;
  accent-color: #ff6b00;
  cursor: pointer;
}

/* Floating Degree Badge */
.degree-floating-badge {
  position: absolute;
  top: 16px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(15, 20, 28, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  color: #ff9f43;
}

.frame-count {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
}

/* Interaction Hint */
.interaction-hint {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.75);
  pointer-events: none;
}

/* Paint Palette for 3D */
.floating-paint-palette {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background: rgba(15, 20, 28, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  z-index: 10;
}

.palette-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.palette-swatches {
  display: flex;
  gap: 6px;
}

.color-swatch-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}

.color-swatch-btn:hover {
  transform: scale(1.15);
}

.color-swatch-btn.active {
  border-color: #fff;
  transform: scale(1.25);
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* Loading Overlay */
.stage-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(11, 14, 20, 0.85);
  backdrop-filter: blur(8px);
  z-index: 30;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #ff6b00;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fff;
}

.loading-bar {
  width: 180px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.loading-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b00, #ff9f43);
  transition: width 0.2s ease;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .inspection-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .header-actions-group {
    justify-content: space-between;
  }
  .floating-controls-bar {
    width: 90%;
    justify-content: center;
    bottom: 12px;
  }
  .interaction-hint {
    display: none;
  }
}
</style>
