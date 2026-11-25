import { defineStore } from 'pinia'

const STORAGE_KEY = 'negmcars_compare_state_v1'

const loadPersistedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.cars)) return null
    return {
      cars: parsed.cars.slice(0, 3),
      isCompareMode: Boolean(parsed.isCompareMode),
      replacingIndex: typeof parsed.replacingIndex === 'number' ? parsed.replacingIndex : null,
    }
  } catch {
    return null
  }
}

const extractMainImage = (car) => {
  const imgs = Array.isArray(car?.images) ? car.images : []
  const main = imgs.find(i => Number(i?.is_main) === 1) || imgs[0]
  return main?.path || car?.image || null
}

const toSummary = (car) => ({
  id: Number(car.id),
  type: car.type || 'car',
  title: car.title || `#${car.id}`,
  price: car.price,
  currency: car.currency || 'EGP',
  year: car.year,
  condition: car.condition,
  mileage: car.mileage,
  brand: car.brand ? { id: car.brand.id, name: car.brand.name } : null,
  model: car.model ? { id: car.model.id, name: car.model.name } : null,
  image: extractMainImage(car),
})

export const useCompareStore = defineStore('compare', {
  state: () => {
    const saved = loadPersistedState()
    return {
      cars: saved?.cars || [],
      isCompareMode: saved?.isCompareMode || false,
      replacingIndex: saved?.replacingIndex ?? null,
      maxCars: 3,
    }
  },

  getters: {
    count: state => state.cars.length,
    activeType: state => state.cars[0]?.type || null,
    isFull: state => state.cars.length >= state.maxCars,
    canCompare: state => state.cars.length >= 2,
    ids: state => state.cars.map(c => Number(c.id)),
    compareRoute: state => ({
      path: '/user/compare',
      query: state.cars.length ? { ids: state.cars.map(c => c.id).join(',') } : {},
    }),
    hasCar: state => id => state.cars.some(c => Number(c.id) === Number(id)),
    targetSlotNumber: state => {
      if (typeof state.replacingIndex === 'number') return state.replacingIndex + 1
      return Math.min(state.cars.length + 1, state.maxCars)
    },
  },

  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          cars: this.cars,
          isCompareMode: this.isCompareMode,
          replacingIndex: this.replacingIndex,
        }))
      } catch {
        // ignore storage quota errors
      }
    },

    getBrowseRoute(typeOverride = null) {
      const targetType = typeOverride || this.activeType || 'car'
      return {
        path: '/user/cars',
        query: { 'filter[type]': targetType },
      }
    },

    /**
     * Start a fresh comparison session from a car's details page,
     * putting it in Slot 1 and activating Compare Mode across the site.
     */
    startCompareFromCar(car) {
      if (!car?.id) return null
      const summary = toSummary(car)
      this.cars = [summary]
      this.isCompareMode = true
      this.replacingIndex = null
      this.persist()
      return this.getBrowseRoute(summary.type)
    },

    /**
     * Select a vehicle while Compare Mode is active.
     */
    selectCarInCompareMode(car) {
      if (!car?.id) return { ok: false, reason: 'invalid' }

      const summary = toSummary(car)
      const existingIdx = this.cars.findIndex(c => Number(c.id) === summary.id)

      // Enforce matching type (car with car, motorcycle with motorcycle)
      if (this.activeType && summary.type !== this.activeType && !(this.cars.length === 1 && this.replacingIndex === 0)) {
        return {
          ok: false,
          reason: 'type_mismatch',
          expectedType: this.activeType,
        }
      }

      if (typeof this.replacingIndex === 'number' && this.replacingIndex >= 0 && this.replacingIndex < this.cars.length) {
        if (existingIdx !== -1 && existingIdx !== this.replacingIndex) {
          return { ok: false, reason: 'already_selected' }
        }
        this.cars.splice(this.replacingIndex, 1, summary)
        this.replacingIndex = null
        this.isCompareMode = false
        this.persist()
        return {
          ok: true,
          shouldNavigateToCompare: this.cars.length >= 2,
        }
      }

      if (existingIdx !== -1) {
        return {
          ok: false,
          reason: 'already_selected',
        }
      }

      if (this.cars.length >= this.maxCars) {
        return {
          ok: false,
          reason: 'max_reached',
        }
      }

      this.cars.push(summary)
      this.isCompareMode = false
      this.replacingIndex = null
      this.persist()

      return {
        ok: true,
        shouldNavigateToCompare: this.cars.length >= 2,
      }
    },

    enterAddCarMode() {
      if (this.cars.length >= this.maxCars) return null
      this.replacingIndex = null
      this.isCompareMode = true
      this.persist()
      return this.getBrowseRoute()
    },

    enterReplaceCarMode(index) {
      if (index < 0 || index >= this.cars.length) return null
      this.replacingIndex = index
      this.isCompareMode = true
      this.persist()
      return this.getBrowseRoute()
    },

    removeCar(id) {
      const targetId = Number(id)
      this.cars = this.cars.filter(c => Number(c.id) !== targetId)
      if (this.cars.length === 0) {
        this.isCompareMode = false
        this.replacingIndex = null
      }
      this.persist()
    },

    syncCarsFromApi(fullCars) {
      if (!Array.isArray(fullCars) || !fullCars.length) return
      this.cars = fullCars.slice(0, this.maxCars).map(toSummary)
      this.persist()
    },

    cancelCompareMode() {
      if (this.cars.length < 2) {
        this.cars = []
      }
      this.isCompareMode = false
      this.replacingIndex = null
      this.persist()
    },

    clearAll() {
      this.cars = []
      this.isCompareMode = false
      this.replacingIndex = null
      this.persist()
    },
  },
})
