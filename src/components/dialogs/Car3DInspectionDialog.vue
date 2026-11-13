<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import gsap from 'gsap'

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

const containerRef = ref(null)
const isLoading = ref(true)
const loadProgress = ref(0)
const loadError = ref(null)
const activeView = ref('exterior') // 'exterior' | 'interior'
const showPins = ref(true)
const lightsOn = ref(false)
const isAutoRotating = ref(true)
const selectedPin = ref(null)
const activeColorHex = ref('#70747a')
const isFullscreen = ref(false)

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  setTimeout(() => {
    handleResize()
  }, 120)
}

const carTitle = computed(() => {
  if (!props.car) return 'معاينة وفحص السيارة 3D'
  if (typeof props.car.title === 'object') {
    return props.car.title?.ar || props.car.title?.en || 'معاينة وفحص السيارة 3D'
  }
  return props.car.title || 'معاينة وفحص السيارة 3D'
})

// 3D Model Hierarchy: Car Override → Model 3D → Generic Fallback
const isExactMatch = computed(() => {
  return !!(props.car?.model_3d_url || props.car?.model?.model_3d_url)
})

const carBodyCategory = computed(() => {
  const t = String(props.car?.model?.type || props.car?.type || '').toLowerCase()
  if (t.includes('suv') || t.includes('4x4') || t.includes('crossover')) return 'SUV'
  if (t.includes('sports') || t.includes('coupe') || t.includes('cabriolet')) return 'Sports'
  return 'Sedan'
})

const getResolvedModelUrl = () => {
  if (props.car?.model_3d_url) return props.car.model_3d_url
  if (props.car?.model?.model_3d_url) return props.car.model.model_3d_url
  return '/models/car-sample.glb'
}

// Three.js instances
let scene = null
let camera = null
let renderer = null
let controls = null
let carModel = null
let animFrameId = null
let headlightGroup = null
let interiorLight = null
let interiorAmbient = null
const carBodyMeshes = []

// Cockpit Interior 360 First-Person state
const driverEyePos = new THREE.Vector3(0.34, 0.88, -0.32)
let carForwardZ = 1
let interiorYaw = 0
let interiorPitch = -0.05
let targetYaw = 0
let targetPitch = -0.05
let isDraggingInterior = false
let previousPointerPos = { x: 0, y: 0 }

// Preset Factory Colors
const colorPresets = [
  { name: 'فضي معدني', nameEn: 'Metallic Silver', hex: '#8a8d91', roughness: 0.25, metalness: 0.85 },
  { name: 'أسود ملكي', nameEn: 'Obsidian Black', hex: '#161616', roughness: 0.2, metalness: 0.85 },
  { name: 'أبيض لؤلؤي', nameEn: 'Pearl White', hex: '#f2f2f2', roughness: 0.2, metalness: 0.15 },
  { name: 'أحمر قرمزي', nameEn: 'Rosso Red', hex: '#ba181b', roughness: 0.18, metalness: 0.65 },
  { name: 'أزرق ملكي', nameEn: 'Royal Blue', hex: '#14387f', roughness: 0.22, metalness: 0.8 },
  { name: 'رمادي غامق', nameEn: 'Daytona Gray', hex: '#373a3c', roughness: 0.3, metalness: 0.75 },
  { name: 'كحلي ليلي', nameEn: 'Midnight Navy', hex: '#0b1d3a', roughness: 0.2, metalness: 0.7 },
  { name: 'ذهبي شامبين', nameEn: 'Champagne Gold', hex: '#9e8557', roughness: 0.28, metalness: 0.85 },
]

// Inspection Pins Data in 3D Space
const inspectionPoints = ref([
  {
    id: 'hood',
    titleAr: 'الكبوت والمحرك',
    titleEn: 'Hood & Engine Bay',
    pos: new THREE.Vector3(0, 0.78, -1.25),
    status: 'factory', // 'factory' | 'painted' | 'defect' | 'good'
    statusLabelAr: 'فابريكا بالكامل ✅',
    statusLabelEn: 'Original Paint',
    badgeColor: 'success',
    descAr: 'الكبوت بحالة الزيرو ولم يتعرض لأي رش أو استعدال، وحالة الموتور والشاسيه الأمامي ممتازة.',
    descEn: 'Factory original paint, pristine engine bay and zero structural issues.',
    screenX: 0,
    screenY: 0,
    visible: true,
  },
  {
    id: 'front_bumper',
    titleAr: 'الإكصدام الأمامي',
    titleEn: 'Front Bumper',
    pos: new THREE.Vector3(0, 0.42, -2.05),
    status: 'painted',
    statusLabelAr: 'رش نظافة خارجي ⚠️',
    statusLabelEn: 'Cosmetic Touchup',
    badgeColor: 'warning',
    descAr: 'تم رش الإكصدام الخارجي نظافة بسبب حكات ركن خفيفة، مع سلامة الحساسات والشبكة الأمامية.',
    descEn: 'Cosmetic respray due to minor parking scuffs. All sensors and grille intact.',
    screenX: 0,
    screenY: 0,
    visible: true,
  },
  {
    id: 'roof',
    titleAr: 'السقف والقوائم',
    titleEn: 'Roof & Pillars',
    pos: new THREE.Vector3(0, 1.25, 0.0),
    status: 'factory',
    statusLabelAr: 'فابريكا بالكامل ✅',
    statusLabelEn: 'Original Paint',
    badgeColor: 'success',
    descAr: 'السقف فابريكا زيرو بالكامل بدون أي ملاحظات أو رش، وفتحة السقف تعمل بكفاءة.',
    descEn: 'Original paint with zero marks. Sunroof mechanism tested and clean.',
    screenX: 0,
    screenY: 0,
    visible: true,
  },
  {
    id: 'right_door',
    titleAr: 'الباب والجانب الأيمن',
    titleEn: 'Right Doors & Side',
    pos: new THREE.Vector3(1.0, 0.7, -0.1),
    status: 'factory',
    statusLabelAr: 'فابريكا بالكامل ✅',
    statusLabelEn: 'Factory Paint',
    badgeColor: 'success',
    descAr: 'الأبواب والقوائم الجانبية بحالة الفابريكا، ولا توجد أي حوادث أو استعدال على البارد.',
    descEn: 'Doors and side panels in factory original state with no collision history.',
    screenX: 0,
    screenY: 0,
    visible: true,
  },
  {
    id: 'left_door',
    titleAr: 'الباب والجانب الأيسر',
    titleEn: 'Left Doors & Side',
    pos: new THREE.Vector3(-1.0, 0.7, -0.1),
    status: 'good',
    statusLabelAr: 'سليم (حكات ركن طفيفة) ℹ️',
    statusLabelEn: 'Good (Minor Scuff)',
    badgeColor: 'info',
    descAr: 'دهان أصلي مع وجود حكة سطحية غير ملحوظة أسفل العتب، الفحص سليم تماماً.',
    descEn: 'Original paint with minor superficial mark near lower sill. Structure clean.',
    screenX: 0,
    screenY: 0,
    visible: true,
  },
  {
    id: 'trunk',
    titleAr: 'الشنطة والخلفية',
    titleEn: 'Trunk & Rear Bumper',
    pos: new THREE.Vector3(0, 0.78, 1.8),
    status: 'factory',
    statusLabelAr: 'فابريكا بالكامل ✅',
    statusLabelEn: 'Factory Original',
    badgeColor: 'success',
    descAr: 'حوض الشنطة سليم وخالي من الحوادث، الكاميرا الخلفية تعمل بامتياز.',
    descEn: 'Rear trunk tub pristine, original welding, rear camera and sensors tested.',
    screenX: 0,
    screenY: 0,
    visible: true,
  },
  {
    id: 'cabin',
    titleAr: 'المقصورة والفرش الداخلي',
    titleEn: 'Interior Cabin',
    pos: new THREE.Vector3(-0.35, 0.88, -0.15),
    status: 'factory',
    statusLabelAr: 'حالة ممتازة كالجديدة ⭐',
    statusLabelEn: 'Pristine Interior',
    badgeColor: 'success',
    descAr: 'الفرش الجلدي بحالة ممتازة وخالي من التشققات، التكييف والشاشات وأنظمة الصوت تعمل بكفاءة.',
    descEn: 'Leather upholstery well maintained, AC, digital cluster and sound system fully functional.',
    screenX: 0,
    screenY: 0,
    visible: true,
  },
])

// Auto match car color from props
const initCarColor = () => {
  const c = props.car?.color ? String(props.car.color).toLowerCase() : ''
  if (c.includes('ابيض') || c.includes('أبيض') || c.includes('white')) {
    activeColorHex.value = '#f2f2f2'
  } else if (c.includes('اسود') || c.includes('أسود') || c.includes('black')) {
    activeColorHex.value = '#161616'
  } else if (c.includes('احمر') || c.includes('أحمر') || c.includes('red')) {
    activeColorHex.value = '#ba181b'
  } else if (c.includes('ازرق') || c.includes('أزرق') || c.includes('كحلي') || c.includes('blue')) {
    activeColorHex.value = '#14387f'
  } else if (c.includes('رمادي') || c.includes('رصاصي') || c.includes('gray') || c.includes('grey')) {
    activeColorHex.value = '#373a3c'
  } else if (c.includes('ذهبي') || c.includes('gold')) {
    activeColorHex.value = '#9e8557'
  } else {
    activeColorHex.value = '#8a8d91'
  }
}

// ----------------------------------------------------
// Three.js Scene Setup & Initialization
// ----------------------------------------------------
const initThreeScene = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  container.innerHTML = '' // clear previous instances

  const width = container.clientWidth || 800
  const height = container.clientHeight || 550

  // 1. Scene Background
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a2130) // Elegant slate showroom
  scene.fog = new THREE.FogExp2(0x1a2130, 0.012)

  // 2. Camera - Standard Studio 3/4 beauty angle
  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 80)
  camera.position.set(3.4, 1.9, -3.8)

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.35 // Vibrant, ultra-clear paint and reflection
  container.appendChild(renderer.domElement)

  // 4. Controls
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.maxDistance = 9.0
  controls.minDistance = 1.2
  controls.maxPolarAngle = Math.PI / 2 - 0.02 // prevent camera going below floor
  controls.minPolarAngle = 0.1
  controls.target.set(0, 0.55, 0)
  controls.autoRotate = isAutoRotating.value
  controls.autoRotateSpeed = 0.85

  // User interaction disables auto-rotate
  controls.addEventListener('start', () => {
    isAutoRotating.value = false
    controls.autoRotate = false
  })

  // 5. Lighting System (Studio Lighting)
  setupLights()

  // 6. Floor & Shadow Plane
  setupFloor()

  // 7. Load Car Model
  loadCarModel()

  // 8. Animation Loop
  animate()

  // 9. Cockpit 360 Look-around Pointer Events
  container.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
}

const setupLights = () => {
  // 1. High-intensity Studio Ambient Fill
  const ambient = new THREE.AmbientLight(0xffffff, 1.4)
  scene.add(ambient)

  // 2. Main Studio Key Light (Overhead Studio Softbox)
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2)
  keyLight.position.set(-5, 8, -6)
  keyLight.castShadow = true
  keyLight.shadow.mapSize.width = 2048
  keyLight.shadow.mapSize.height = 2048
  keyLight.shadow.bias = -0.0005
  scene.add(keyLight)

  // 3. Secondary Studio Fill (Warm Silver)
  const fillLight = new THREE.DirectionalLight(0xe2e8f0, 2.2)
  fillLight.position.set(6, 6, 5)
  scene.add(fillLight)

  // 4. Top Overhead Light Box
  const topLight = new THREE.DirectionalLight(0xffffff, 2.5)
  topLight.position.set(0, 9, 0)
  scene.add(topLight)

  // 5. Rim Silhouette Light
  const rimLight = new THREE.DirectionalLight(0x93c5fd, 1.8)
  rimLight.position.set(0, 4, 8)
  scene.add(rimLight)

  // 6. Soft Under-Glow
  const underLight = new THREE.PointLight(0x38bdf8, 1.2, 5)
  underLight.position.set(0, 0.2, 0)
  scene.add(underLight)

  // 7. Interior Cockpit Dome Lights
  interiorLight = new THREE.PointLight(0xfff5e6, 0.2, 4.5)
  interiorLight.position.set(-0.15, 0.95, -0.2)
  scene.add(interiorLight)

  interiorAmbient = new THREE.PointLight(0x99bbff, 0.1, 3.5)
  interiorAmbient.position.set(-0.15, 0.65, 0.1)
  scene.add(interiorAmbient)

  // 8. Headlight Group
  headlightGroup = new THREE.Group()

  const leftLight = new THREE.SpotLight(0xdff0ff, 0, 15, Math.PI / 5, 0.4, 1.2)
  leftLight.position.set(-0.65, 0.55, -1.8)
  leftLight.target.position.set(-0.65, 0, -7)
  scene.add(leftLight.target)
  headlightGroup.add(leftLight)

  const rightLight = new THREE.SpotLight(0xdff0ff, 0, 15, Math.PI / 5, 0.4, 1.2)
  rightLight.position.set(0.65, 0.55, -1.8)
  rightLight.target.position.set(0.65, 0, -7)
  scene.add(rightLight.target)
  headlightGroup.add(rightLight)

  scene.add(headlightGroup)
}

const setupFloor = () => {
  // 1. Outer Floor
  const floorGeo = new THREE.PlaneGeometry(50, 50)
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x141a24,
    roughness: 0.45,
    metalness: 0.3,
  })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = 0
  floor.receiveShadow = true
  scene.add(floor)

  // 2. Elevated Showroom Pedestal Stage (Circular Turntable)
  const stageGeo = new THREE.CylinderGeometry(4.2, 4.3, 0.06, 64)
  const stageMat = new THREE.MeshStandardMaterial({
    color: 0x222a3a, // Polished dark terrazzo studio floor
    roughness: 0.18, // Clean sharp reflections
    metalness: 0.65,
  })
  const stage = new THREE.Mesh(stageGeo, stageMat)
  stage.position.y = 0.03
  stage.receiveShadow = true
  scene.add(stage)

  // 3. Illuminated Showroom LED Halo Ring
  const haloGeo = new THREE.RingGeometry(4.15, 4.25, 64)
  const haloMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8, // Electric cyan ambient glow
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.65,
  })
  const halo = new THREE.Mesh(haloGeo, haloMat)
  halo.rotation.x = -Math.PI / 2
  halo.position.y = 0.065
  scene.add(halo)

  // 4. Inner Accent Ring
  const innerRingGeo = new THREE.RingGeometry(2.8, 2.84, 64)
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
  })
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat)
  innerRing.rotation.x = -Math.PI / 2
  innerRing.position.y = 0.066
  scene.add(innerRing)
}

// ----------------------------------------------------
// Load 3D Model with DRACO
// ----------------------------------------------------
const loadCarModel = () => {
  isLoading.value = true
  loadProgress.value = 15
  loadError.value = null

  const dracoLoader = new DRACOLoader()
  // Try local first, fallback to standard gstatic
  dracoLoader.setDecoderPath('/draco/gltf/')
  dracoLoader.preload()

  const loader = new GLTFLoader()
  loader.setDRACOLoader(dracoLoader)

  // Use car's custom 3D model if provided, or default sedan archetype
  const modelUrl = props.car?.model_3d_url || '/models/sedan.glb'

  loader.load(
    modelUrl,
    (gltf) => {
      carModel = gltf.scene

      // 1. Calculate raw bounding box
      let box = new THREE.Box3().setFromObject(carModel)
      let size = box.getSize(new THREE.Vector3())

      // 2. Auto-normalize scale to standard realistic car length (~4.4 - 4.6 units)
      const maxHorizontal = Math.max(size.x, size.z)
      if (maxHorizontal > 0 && (maxHorizontal > 6.0 || maxHorizontal < 2.5)) {
        const targetDim = 4.4
        const scaleFactor = targetDim / maxHorizontal
        carModel.scale.setScalar(scaleFactor)
      }

      // 3. Recalculate box and position cleanly on floor at center
      box = new THREE.Box3().setFromObject(carModel)
      const center = box.getCenter(new THREE.Vector3())

      carModel.position.x -= center.x
      carModel.position.y -= box.min.y - 0.06 // Place directly on elevated stage
      carModel.position.z -= center.z
      carModel.rotation.y = 0 // Front faces -Z towards headlights and steering wheel

      // Inspect and prepare materials
      carBodyMeshes.length = 0

      carModel.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true
          node.receiveShadow = true

          // Detect car body paint meshes
          const matName = String(node.material?.name || '').toLowerCase()
          const meshName = String(node.name || '').toLowerCase()

          const isInteriorOrMechanical =
            meshName.includes('interior') ||
            matName.includes('interior') ||
            meshName.includes('seat') ||
            matName.includes('seat') ||
            meshName.includes('steering') ||
            matName.includes('steering') ||
            meshName.includes('caliper') ||
            matName.includes('caliper') ||
            meshName.includes('pedal') ||
            meshName.includes('carpet') ||
            meshName.includes('dash') ||
            meshName.includes('trim') ||
            meshName.includes('leather') ||
            matName.includes('leather')

          const isExteriorPaint =
            !isInteriorOrMechanical &&
            (matName.includes('car_paint') ||
              matName.includes('paint') ||
              meshName.includes('chassis_paint') ||
              meshName.includes('hood_paint') ||
              meshName.includes('door_paint') ||
              meshName === 'paint' ||
              (meshName.includes('body') && !meshName.includes('underbody')))

          if (isExteriorPaint) {
            // Apply high quality Car Clearcoat PBR material
            node.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(activeColorHex.value),
              metalness: 0.85,
              roughness: 0.2,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
              reflectivity: 0.9,
            })
            carBodyMeshes.push(node)
          } else if (
            matName.includes('glass') ||
            meshName.includes('glass') ||
            matName.includes('window') ||
            meshName.includes('window') ||
            matName.includes('windshield') ||
            meshName.includes('windshield')
          ) {
            node.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color(0x18202c),
              metalness: 0.1,
              roughness: 0.05,
              transmission: 0.88,
              transparent: true,
              opacity: 0.28,
              side: THREE.DoubleSide,
              depthWrite: false,
            })
          }

          // Ensure interior cabin meshes are double-sided so user can see them from inside
          if (
            isInteriorOrMechanical ||
            matName.includes('full_black') ||
            matName.includes('plastic') ||
            meshName.includes('boot')
          ) {
            if (node.material) {
              node.material.side = THREE.DoubleSide
            }
          }
        }
      })

      // If no specific body mesh matched by name, pick the largest meshes
      if (carBodyMeshes.length === 0) {
        carModel.traverse((node) => {
          if (node.isMesh && node.material) {
            carBodyMeshes.push(node)
          }
        })
        applyColor(activeColorHex.value)
      }

      scene.add(carModel)
      carModel.updateMatrixWorld(true)

      // Determine car forward orientation along Z axis (+Z or -Z)
      let maxZ = -Infinity
      let minZ = Infinity
      carModel.traverse((node) => {
        if (node.isMesh && node.name) {
          const n = node.name.toLowerCase()
          if (n.includes('hood') || n.includes('headlight') || (n.includes('bumper') && n.includes('front'))) {
            const wp = new THREE.Vector3()
            node.getWorldPosition(wp)
            if (wp.z > maxZ) maxZ = wp.z
            if (wp.z < minZ) minZ = wp.z
          }
        }
      })
      if (Math.abs(maxZ) > 0.1 || Math.abs(minZ) > 0.1) {
        carForwardZ = maxZ > Math.abs(minZ) ? 1 : -1
      }

      // Dynamically locate driver's steering wheel for 100% accurate cockpit seating
      let foundSteering = null
      carModel.traverse((node) => {
        if (!foundSteering && node.name && /steering/i.test(node.name)) {
          foundSteering = node
        }
      })

      if (foundSteering) {
        const steerPos = new THREE.Vector3()
        foundSteering.getWorldPosition(steerPos)
        // Position driver's eyes ~45cm behind steering wheel and ~18cm higher
        driverEyePos.set(
          steerPos.x,
          steerPos.y + 0.18,
          steerPos.z - carForwardZ * 0.45
        )
      } else {
        driverEyePos.set(0.34, 0.88, -carForwardZ * 0.32)
      }

      // Initial camera beauty angle facing front 3/4
      if (camera && activeView.value === 'exterior') {
        camera.position.set(3.2, 1.8, carForwardZ * 3.6)
        if (controls) controls.update()
      }
      isLoading.value = false
      loadProgress.value = 100
    },
    (xhr) => {
      if (xhr.total > 0) {
        loadProgress.value = Math.round((xhr.loaded / xhr.total) * 100)
      } else {
        loadProgress.value = Math.min(90, Math.round(xhr.loaded / 20000))
      }
    },
    (err) => {
      console.error('Error loading 3D Car model:', err)
      isLoading.value = false
      loadError.value = 'تعذر تحميل المجسم ثلاثي الأبعاد.'
    },
  )
}

// ----------------------------------------------------
// Color & Lighting Controls
// ----------------------------------------------------
const applyColor = (hex) => {
  activeColorHex.value = hex
  const threeColor = new THREE.Color(hex)

  carBodyMeshes.forEach((mesh) => {
    if (mesh.material) {
      mesh.material.color = threeColor
      mesh.material.needsUpdate = true
    }
  })
}

const toggleLights = () => {
  lightsOn.value = !lightsOn.value
  if (!headlightGroup) return

  const targetIntensity = lightsOn.value ? 4.5 : 0

  headlightGroup.children.forEach((light) => {
    gsap.to(light, {
      intensity: targetIntensity,
      duration: 0.4,
      ease: 'power2.out',
    })
  })
}

const toggleAutoRotate = () => {
  isAutoRotating.value = !isAutoRotating.value
  if (controls) {
    controls.autoRotate = isAutoRotating.value
  }
}

// ----------------------------------------------------
// Cockpit Interior 360 Look-Around Handlers
// ----------------------------------------------------
const onPointerDown = (e) => {
  if (activeView.value === 'interior') {
    isDraggingInterior = true
    previousPointerPos = { x: e.clientX, y: e.clientY }
  }
}

const onPointerMove = (e) => {
  if (activeView.value === 'interior' && isDraggingInterior) {
    const dx = e.clientX - previousPointerPos.x
    const dy = e.clientY - previousPointerPos.y
    previousPointerPos = { x: e.clientX, y: e.clientY }

    targetYaw += dx * 0.005
    targetPitch = Math.max(-0.65, Math.min(0.65, targetPitch - dy * 0.005))
  }
}

const onPointerUp = () => {
  isDraggingInterior = false
}

// ----------------------------------------------------
// Camera Views: Exterior vs Interior
// ----------------------------------------------------
const switchView = (mode) => {
  if (!camera || !controls || activeView.value === mode) return
  activeView.value = mode
  selectedPin.value = null

  if (mode === 'interior') {
    // Disable exterior orbit controls so user looks around from the driver's seat
    controls.autoRotate = false
    isAutoRotating.value = false
    controls.enabled = false

    targetYaw = 0
    targetPitch = -0.06
    interiorYaw = 0
    interiorPitch = -0.06

    if (interiorLight) {
      interiorLight.position.set(driverEyePos.x, driverEyePos.y + 0.35, driverEyePos.z)
      gsap.to(interiorLight, { intensity: 3.5, duration: 0.8 })
    }
    if (interiorAmbient) {
      gsap.to(interiorAmbient, { intensity: 2.2, duration: 0.8 })
    }

    camera.near = 0.04
    camera.fov = 68
    camera.updateProjectionMatrix()

    gsap.to(camera.position, {
      x: driverEyePos.x,
      y: driverEyePos.y,
      z: driverEyePos.z,
      duration: 1.2,
      ease: 'power2.inOut',
    })
  } else {
    // Exterior Overview
    if (interiorLight) {
      gsap.to(interiorLight, { intensity: 0.2, duration: 0.8 })
    }
    if (interiorAmbient) {
      gsap.to(interiorAmbient, { intensity: 0.1, duration: 0.8 })
    }

    camera.near = 0.1
    camera.fov = 42
    camera.updateProjectionMatrix()

    controls.enabled = true
    controls.minDistance = 1.2
    controls.maxDistance = 9.0

    gsap.to(camera.position, {
      x: 3.4,
      y: 1.9,
      z: carForwardZ * 3.8,
      duration: 1.2,
      ease: 'power2.inOut',
    })

    gsap.to(controls.target, {
      x: 0,
      y: 0.55,
      z: 0,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => controls.update(),
    })
  }
}

const resetCamera = () => {
  selectedPin.value = null

  if (activeView.value === 'interior') {
    targetYaw = 0
    targetPitch = -0.06
    interiorYaw = 0
    interiorPitch = -0.06
  } else {
    // Smoothly reset exterior camera to standard studio overview angle
    if (controls) {
      controls.autoRotate = false
      isAutoRotating.value = false

      gsap.to(camera.position, {
        x: 3.4,
        y: 1.9,
        z: carForwardZ * 3.8,
        duration: 1.1,
        ease: 'power2.out',
      })

      gsap.to(controls.target, {
        x: 0,
        y: 0.55,
        z: 0,
        duration: 1.1,
        ease: 'power2.out',
        onUpdate: () => controls.update(),
      })
    }
  }
}

// ----------------------------------------------------
// Project 3D Pins to 2D Screen
// ----------------------------------------------------
const updatePinPositions = () => {
  if (!camera || !renderer || !showPins.value || activeView.value !== 'exterior') return

  const canvas = renderer.domElement
  const widthHalf = canvas.clientWidth / 2
  const heightHalf = canvas.clientHeight / 2

  const tempV = new THREE.Vector3()

  inspectionPoints.value.forEach((pin) => {
    tempV.copy(pin.pos)
    tempV.project(camera)

    // Check if behind camera
    const isBehind = tempV.z > 1
    pin.visible = !isBehind

    pin.screenX = tempV.x * widthHalf + widthHalf
    pin.screenY = -(tempV.y * heightHalf) + heightHalf
  })
}

const onPinClick = (pin) => {
  selectedPin.value = pin

  // Smoothly pan camera slightly closer to the inspected area
  if (camera && controls) {
    controls.autoRotate = false
    isAutoRotating.value = false

    const targetPos = pin.pos.clone().multiplyScalar(1.6).add(new THREE.Vector3(0.5, 0.4, 0.5))

    gsap.to(camera.position, {
      x: targetPos.x,
      y: Math.max(0.6, targetPos.y),
      z: targetPos.z,
      duration: 1.1,
      ease: 'power2.out',
    })

    gsap.to(controls.target, {
      x: pin.pos.x,
      y: pin.pos.y,
      z: pin.pos.z,
      duration: 1.1,
      ease: 'power2.out',
      onUpdate: () => controls.update(),
    })
  }
}

// ----------------------------------------------------
// Render Loop & Resize
// ----------------------------------------------------
const animate = () => {
  animFrameId = requestAnimationFrame(animate)

  if (activeView.value === 'interior' && camera) {
    // Smooth responsive first-person cockpit look-around
    interiorYaw += (targetYaw - interiorYaw) * 0.15
    interiorPitch += (targetPitch - interiorPitch) * 0.15

    const lookDist = 2.5
    const forwardX = Math.sin(interiorYaw) * Math.cos(interiorPitch) * lookDist
    const lookX = driverEyePos.x + forwardX
    const lookY = driverEyePos.y + Math.sin(interiorPitch) * lookDist
    const lookZ = driverEyePos.z + carForwardZ * Math.cos(interiorYaw) * Math.cos(interiorPitch) * lookDist

    camera.position.copy(driverEyePos)
    camera.lookAt(lookX, lookY, lookZ)
  } else if (controls && controls.enabled) {
    controls.update()
  }

  if (renderer && scene && camera) {
    renderer.render(scene, camera)
  }

  updatePinPositions()
}

const handleResize = () => {
  if (!containerRef.value || !renderer || !camera) return
  const width = containerRef.value.clientWidth
  const height = containerRef.value.clientHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
}

// ----------------------------------------------------
// Cleanup to prevent memory leaks
// ----------------------------------------------------
const cleanUpThree = () => {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId)
    animFrameId = null
  }

  window.removeEventListener('resize', handleResize)
  if (containerRef.value) {
    containerRef.value.removeEventListener('pointerdown', onPointerDown)
  }
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)

  if (controls) {
    controls.dispose()
    controls = null
  }

  if (carModel) {
    carModel.traverse((node) => {
      if (node.isMesh) {
        node.geometry?.dispose()
        if (Array.isArray(node.material)) {
          node.material.forEach((m) => m?.dispose())
        } else {
          node.material?.dispose()
        }
      }
    })
    scene?.remove(carModel)
    carModel = null
  }

  if (renderer) {
    renderer.dispose()
    renderer.forceContextLoss()
    if (renderer.domElement && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
    renderer = null
  }

  scene = null
  camera = null
  carBodyMeshes.length = 0
}

const closeDialog = () => {
  emit('update:isDialogVisible', false)
}

let isSceneActive = false

const startScene = () => {
  if (isSceneActive) return
  isSceneActive = true
  initCarColor()
  nextTick(() => {
    setTimeout(() => {
      initThreeScene()
      window.addEventListener('resize', handleResize)
    }, 150)
  })
}

onMounted(() => {
  if (props.isDialogVisible) {
    startScene()
  }
})

watch(
  () => props.isDialogVisible,
  (val) => {
    if (val) {
      startScene()
    } else {
      isSceneActive = false
      cleanUpThree()
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  isSceneActive = false
  cleanUpThree()
})
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    :fullscreen="isFullscreen"
    :max-width="isFullscreen ? '100vw' : '1140'"
    persistent
    class="car-3d-dialog"
    :class="{ 'dialog--fullscreen': isFullscreen }"
    @update:model-value="closeDialog"
  >
    <VCard class="car-3d-card rounded-2xl overflow-hidden elevation-24">
      <!-- Top Bar: Title & View Controls -->
      <div class="header-bar px-6 py-3.5 d-flex align-center justify-space-between w-100 flex-wrap gap-3">
        <!-- Start: Car Details & Status Badge -->
        <div class="header-car-info d-flex align-center gap-3">
          <div class="icon-avatar">
            <VIcon icon="tabler-cube-3d-sphere" size="24" color="white" />
          </div>
          <div>
            <div class="d-flex align-center flex-wrap gap-2 mb-0.5">
              <h3 class="car-header-title text-subtitle-1 font-weight-bold text-white mb-0" dir="auto">
                {{ carTitle }}
              </h3>
              <span
                class="condition-tag"
                :class="props.car?.condition === 'new' ? 'tag--new' : 'tag--used'"
              >
                <span class="tag-dot" />
                {{ props.car?.condition === 'new' ? 'زيرو (جديد)' : 'مستعمل • فحص تفاعلي' }}
              </span>
            </div>
            <p class="sub-text text-caption mb-0 d-flex align-center gap-1.5">
              <VIcon icon="tabler-view-360" size="14" />
              <span>فحص الهيكل والمقصورة بالأبعاد الواقعية 3D</span>
            </p>
          </div>
        </div>

        <!-- End: Actions (View Switcher + Window Controls) -->
        <div class="header-actions-group d-flex align-center gap-3">
          <!-- View Switcher Segmented Control -->
          <div class="view-segmented-control">
            <button
              type="button"
              class="segmented-btn"
              :class="{ active: activeView === 'exterior' }"
              @click="switchView('exterior')"
            >
              <VIcon icon="tabler-car" size="17" />
              <span>استعراض خارجي</span>
              <span class="badge-360">360°</span>
            </button>

            <button
              type="button"
              class="segmented-btn"
              :class="{ active: activeView === 'interior' }"
              @click="switchView('interior')"
            >
              <VIcon icon="tabler-steering-wheel" size="17" />
              <span>مقصورة القيادة</span>
            </button>
          </div>

          <!-- Window Controls Group (Fullscreen & Close) -->
          <div class="window-controls-group d-flex align-center">
            <!-- Fullscreen Toggle Button -->
            <button
              type="button"
              class="window-ctrl-btn"
              :title="isFullscreen ? 'تصغير الشاشة' : 'تكبير الشاشة بالكامل'"
              aria-label="Toggle Fullscreen"
              @click="toggleFullscreen"
            >
              <VIcon :icon="isFullscreen ? 'tabler-arrows-minimize' : 'tabler-arrows-maximize'" size="18" />
            </button>

            <div class="window-ctrl-divider" />

            <!-- Close Action Button -->
            <button
              type="button"
              class="window-ctrl-btn close-ctrl-btn"
              title="إغلاق"
              aria-label="Close"
              @click="closeDialog"
            >
              <VIcon icon="tabler-x" size="18" />
            </button>
          </div>
        </div>
      </div>

      <!-- Main 3D Canvas Area -->
      <div class="canvas-wrapper relative">
        <div ref="containerRef" class="canvas-container" />

        <!-- Loading Overlay -->
        <div v-if="isLoading" class="loader-overlay d-flex flex-column align-center justify-center">
          <VProgressCircular
            :model-value="loadProgress"
            size="72"
            width="6"
            color="primary"
            class="mb-4"
          >
            <span class="text-body-2 font-weight-bold">{{ loadProgress }}%</span>
          </VProgressCircular>
          <div class="text-subtitle-1 font-weight-medium text-white mb-1">
            جاري تحضير المجسم ثلاثي الأبعاد...
          </div>
          <div class="text-caption text-medium-emphasis">
            يتم تحميل ملفات الـ PBR والخامات فائقة الدقة
          </div>
        </div>

        <!-- Load Error Alert -->
        <div v-else-if="loadError" class="loader-overlay d-flex flex-column align-center justify-center pa-6 text-center">
          <VIcon icon="tabler-alert-triangle" size="48" color="warning" class="mb-3" />
          <div class="text-subtitle-1 text-white mb-2">{{ loadError }}</div>
          <VBtn color="primary" variant="tonal" size="small" @click="loadCarModel">
            إعادة المحاولة
          </VBtn>
        </div>

        <!-- 3D Interactive Hotspots / Pins -->
        <div
          v-if="!isLoading && showPins && activeView === 'exterior'"
          class="pins-layer"
        >
          <div
            v-for="pin in inspectionPoints"
            :key="pin.id"
            v-show="pin.visible"
            class="inspection-pin"
            :class="{ active: selectedPin?.id === pin.id }"
            :style="{
              transform: `translate(${pin.screenX}px, ${pin.screenY}px)`,
            }"
            @click.stop="onPinClick(pin)"
          >
            <div class="pin-pulse" :class="`pin--${pin.badgeColor}`" />
            <div class="pin-dot" :class="`pin--${pin.badgeColor}`">
              <VIcon icon="tabler-scan" size="14" color="white" />
            </div>
            <div class="pin-badge">
              {{ pin.titleAr }}
            </div>
          </div>
        </div>

        <!-- Inspection Detail Card (Slide In when pin clicked) -->
        <Transition name="slide-up">
          <div v-if="selectedPin" class="pin-detail-card elevation-16">
            <div class="d-flex align-center justify-between mb-2">
              <div class="d-flex align-center gap-2">
                <VIcon icon="tabler-shield-check" size="20" color="primary" />
                <h4 class="text-subtitle-1 font-weight-bold mb-0 text-white">
                  {{ selectedPin.titleAr }}
                </h4>
              </div>
              <div class="d-flex align-center gap-1.5">
                <VChip
                  size="small"
                  :color="selectedPin.badgeColor"
                  class="font-weight-bold"
                >
                  {{ selectedPin.statusLabelAr }}
                </VChip>
                <VBtn
                  icon="tabler-x"
                  size="x-small"
                  variant="text"
                  color="grey"
                  @click="selectedPin = null"
                />
              </div>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-3" style="line-height: 1.65;">
              {{ selectedPin.descAr }}
            </p>
            <div class="pin-card-footer d-flex align-center justify-between gap-3">
              <div class="d-flex align-center gap-1.5">
                <VIcon icon="tabler-shield-check" size="16" color="success" />
                <span class="text-caption text-medium-emphasis font-weight-medium">فحص فني معتمد</span>
              </div>
              <VBtn
                size="x-small"
                variant="tonal"
                color="primary"
                class="font-weight-bold px-3"
                prepend-icon="tabler-rotate"
                @click="resetCamera"
              >
                إعادة ضبط الرؤية
              </VBtn>
            </div>
          </div>
        </Transition>

        <!-- Floating Quick Toolbar (Left Side) -->
        <div class="floating-toolbar d-flex flex-column gap-2">
          <!-- Reset Camera -->
          <VTooltip text="إعادة ضبط زاوية الرؤية" location="left">
            <template #activator="{ props: tProps }">
              <button
                v-bind="tProps"
                type="button"
                class="tool-btn"
                @click="resetCamera"
              >
                <VIcon icon="tabler-rotate" size="18" />
              </button>
            </template>
          </VTooltip>

          <!-- Auto-Rotate Toggle -->
          <VTooltip :text="isAutoRotating ? 'إيقاف الدوران التلقائي' : 'تشغيل الدوران التلقائي'" location="left">
            <template #activator="{ props: tProps }">
              <button
                v-bind="tProps"
                type="button"
                class="tool-btn"
                :class="{ active: isAutoRotating }"
                @click="toggleAutoRotate"
              >
                <VIcon icon="tabler-rotate-clockwise-2" size="18" />
              </button>
            </template>
          </VTooltip>

          <!-- Headlights Toggle -->
          <VTooltip :text="lightsOn ? 'إطفاء الإضاءة الأمامية' : 'تشغيل الإضاءة الأمامية'" location="left">
            <template #activator="{ props: tProps }">
              <button
                v-bind="tProps"
                type="button"
                class="tool-btn"
                :class="{ active: lightsOn }"
                @click="toggleLights"
              >
                <VIcon :icon="lightsOn ? 'tabler-bulb-filled' : 'tabler-bulb'" size="18" />
              </button>
            </template>
          </VTooltip>

          <!-- Hotspots Toggle -->
          <VTooltip :text="showPins ? 'إخفاء نقاط الفحص' : 'إظهار نقاط الفحص'" location="left">
            <template #activator="{ props: tProps }">
              <button
                v-bind="tProps"
                type="button"
                class="tool-btn"
                :class="{ active: showPins }"
                @click="showPins = !showPins"
              >
                <VIcon icon="tabler-map-pin" size="18" />
              </button>
            </template>
          </VTooltip>
        </div>

        <!-- Interaction Helper Pill (Bottom Center) -->
        <div class="interaction-hint">
          <VIcon icon="tabler-hand-finger" size="16" class="me-1" />
          <span>
            {{
              activeView === 'interior'
                ? 'اسحب بالماوس أو اللمس للنظر حول المقصورة 360°'
                : 'اسحب للتدوير • استخدم العجلة للتقريب • انقر على نقاط الفحص للمعاينة'
            }}
          </span>
        </div>
      </div>

      <!-- Bottom Controls: Color Customization & Inspection Disclaimer -->
      <div class="bottom-bar px-6 py-4 bg-surface d-flex flex-wrap align-center justify-between gap-4">
        <!-- Color Palette -->
        <div class="d-flex align-center gap-3">
          <span class="text-caption font-weight-bold text-medium-emphasis">
            ألوان الطلاء (PBR Paint):
          </span>
          <div class="d-flex align-center gap-2">
            <button
              v-for="color in colorPresets"
              :key="color.hex"
              type="button"
              class="color-dot"
              :class="{ active: activeColorHex === color.hex }"
              :style="{ backgroundColor: color.hex }"
              :title="color.name"
              @click="applyColor(color.hex)"
            />
          </div>
        </div>

        <!-- Transparency Disclaimer -->
        <div class="disclaimer-note d-flex align-center gap-2 text-caption text-medium-emphasis">
          <VIcon icon="tabler-shield-lock" size="16" color="info" />
          <span>
            المجسم تفاعلي للمعاينة والأبعاد ونقاط الفحص. يُرجى مراجعة صور الإعلان وتقرير الفحص للمعاينة الواقعية.
          </span>
        </div>
      </div>
    </VCard>
  </VDialog>
</template>

<style scoped>
.car-3d-card {
  background: #0f1117 !important;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.header-bar {
  background: rgba(15, 18, 26, 0.96);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  min-height: 72px;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  width: 100% !important;
  box-sizing: border-box;
}

.header-car-info {
  flex: 1 1 auto;
  min-width: 0;
}

.header-actions-group {
  flex: 0 0 auto;
}

.icon-avatar {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 107, 0, 0.3) 0%, rgba(255, 140, 0, 0.1) 100%);
  border: 1.5px solid rgba(255, 107, 0, 0.45);
  box-shadow: 0 4px 16px rgba(255, 107, 0, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.car-header-title {
  font-size: 1.05rem;
  letter-spacing: -0.2px;
  line-height: 1.3;
}

.condition-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.condition-tag.tag--new {
  background: rgba(40, 199, 111, 0.15);
  color: #28c76f;
  border: 1px solid rgba(40, 199, 111, 0.3);
}

.condition-tag.tag--used {
  background: rgba(255, 107, 0, 0.15);
  color: #ff9f43;
  border: 1px solid rgba(255, 107, 0, 0.3);
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}

.sub-text {
  color: rgba(255, 255, 255, 0.62) !important;
  font-size: 0.78rem;
}

.view-segmented-control {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 4px;
  gap: 3px;
}

.segmented-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.65);
  padding: 7px 16px;
  border-radius: 9px;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.segmented-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.segmented-btn.active {
  background: linear-gradient(135deg, #ff6b00 0%, #ff8800 100%);
  color: #fff;
  box-shadow: 0 3px 12px rgba(255, 107, 0, 0.4);
}

.badge-360 {
  font-size: 0.68rem;
  font-weight: 800;
  padding: 1px 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  line-height: 1.3;
  letter-spacing: 0.5px;
}

.window-controls-group {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 3px;
  gap: 2px;
  height: 42px;
}

.window-ctrl-btn {
  width: 36px;
  height: 36px;
  border-radius: 9px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.75);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.window-ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.window-ctrl-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  margin: 0 1px;
}

.close-ctrl-btn:hover {
  background: rgba(239, 68, 68, 0.22);
  color: #ef4444;
}

/* Fullscreen Modal Override */
.dialog--fullscreen .car-3d-card {
  height: 100vh !important;
  max-height: 100vh !important;
  border-radius: 0 !important;
  display: flex;
  flex-direction: column;
}

.dialog--fullscreen .canvas-wrapper {
  flex: 1 1 auto;
  height: calc(100vh - 130px) !important;
  max-height: calc(100vh - 130px) !important;
}

/* Canvas Area */
.canvas-wrapper {
  width: 100%;
  height: 540px;
  position: relative;
  overflow: hidden;
  background: radial-gradient(circle at center, #1b202c 0%, #0d0f14 100%);
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.loader-overlay {
  position: absolute;
  inset: 0;
  background: rgba(13, 15, 20, 0.92);
  z-index: 10;
  backdrop-filter: blur(8px);
}

/* 3D Inspection Pins Layer */
.pins-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.inspection-pin {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: auto;
  cursor: pointer;
  display: flex;
  align-items: center;
  transform: translate(-50%, -50%);
  transition: transform 0.05s linear;
  user-select: none;
}

.pin-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 14px rgba(0, 0, 0, 0.7);
  z-index: 2;
  transition: transform 0.2s ease;
}

.inspection-pin:hover .pin-dot {
  transform: scale(1.2);
}

.pin-pulse {
  position: absolute;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  left: -7px;
  top: -7px;
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  opacity: 0.6;
  z-index: 1;
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.6);
    opacity: 0.8;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.pin--success {
  background: #28c76f;
}

.pin--warning {
  background: #ff9f43;
}

.pin--info {
  background: #00cfe8;
}

.pin-badge {
  background: rgba(15, 18, 24, 0.85);
  color: #fff;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 600;
  margin-inline-start: 6px;
  white-space: nowrap;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  pointer-events: none;
}

/* Detail Card */
.pin-detail-card {
  position: absolute;
  bottom: 24px;
  right: 24px;
  width: calc(100% - 48px);
  max-width: 420px;
  background: rgba(18, 22, 32, 0.96) !important;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 16px;
  padding: 18px 20px !important;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65);
  z-index: 25;
}

.pin-card-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: 12px;
  padding-top: 12px;
}

/* Floating Toolbar */
.floating-toolbar {
  position: absolute;
  top: 18px;
  left: 18px;
  z-index: 5;
}

.tool-btn {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(22, 26, 36, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
}

.tool-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.tool-btn.active {
  background: rgb(var(--v-theme-primary));
  color: #fff;
  border-color: rgb(var(--v-theme-primary));
}

/* Interaction Hint */
.interaction-hint {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(13, 16, 22, 0.78);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  pointer-events: none;
  display: flex;
  align-items: center;
  z-index: 4;
}

/* Bottom Bar */
.bottom-bar {
  background: #12151e !important;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: transform 0.2s ease, border-color 0.2s ease;
  outline: none;
}

.color-dot:hover {
  transform: scale(1.15);
}

.color-dot.active {
  transform: scale(1.25);
  border-color: #fff;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
