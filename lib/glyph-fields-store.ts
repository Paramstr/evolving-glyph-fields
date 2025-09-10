import { create } from "zustand"
import { PRESETS } from "./glyph-fields-config"

interface LayerProperties {
  density: number
  agentCount: number
  decayRate: number
  overlayRate: number
  opacity: number
  blendMode: string
}

interface GlyphFieldsState {
  isPlaying: boolean
  seed: number
  density: number
  agentCount: number
  decayRate: number
  overlayRate: number
  speed: number
  currentPalette: string
  isLightMode: boolean
  activeTab: string
  
  // Layer-specific properties
  layers: {
    back: LayerProperties
    middle: LayerProperties
    front: LayerProperties
  }

  togglePlayback: () => void
  setSeed: (seed: number) => void
  setDensity: (density: number) => void
  setAgentCount: (count: number) => void
  setDecayRate: (rate: number) => void
  setOverlayRate: (rate: number) => void
  setSpeed: (speed: number) => void
  setPalette: (palette: string) => void
  loadPreset: (presetName: string) => void
  reset: () => void
  toggleLightMode: () => void
  regenerate: () => void
  randomize: () => void
  setActiveTab: (tab: string) => void
  setLayerProperty: (layer: 'back' | 'middle' | 'front', property: keyof LayerProperties, value: number | string) => void
}

export const useGlyphFieldsStore = create<GlyphFieldsState>((set, get) => ({
  isPlaying: true,
  seed: Math.floor(Math.random() * 10000),
  density: 0.3,
  agentCount: 8,
  decayRate: 0.005,
  overlayRate: 0.008,
  speed: 60,
  currentPalette: "Light Pastels",
  isLightMode: true,
  activeTab: "basic",
  
  layers: {
    back: {
      density: 0.4,
      agentCount: 5,
      decayRate: 0.002,
      overlayRate: 0.005,
      opacity: 1.0,
      blendMode: "normal"
    },
    middle: {
      density: 0.3,
      agentCount: 8,
      decayRate: 0.005,
      overlayRate: 0.008,
      opacity: 0.8,
      blendMode: "multiply"
    },
    front: {
      density: 0.2,
      agentCount: 12,
      decayRate: 0.01,
      overlayRate: 0.012,
      opacity: 0.6,
      blendMode: "screen"
    }
  },

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSeed: (seed) => set({ seed }),
  setDensity: (density) => set({ density }),
  setAgentCount: (agentCount) => set({ agentCount }),
  setDecayRate: (decayRate) => set({ decayRate }),
  setOverlayRate: (overlayRate) => set({ overlayRate }),
  setSpeed: (speed) => set({ speed }),
  setPalette: (currentPalette) => set({ currentPalette }),

  loadPreset: (presetName) => {
    const preset = PRESETS[presetName]
    if (preset) {
      set(preset)
    }
  },

  reset: () =>
    set({
      seed: Math.floor(Math.random() * 10000),
      density: 0.3,
      agentCount: 8,
      decayRate: 0.005,
      overlayRate: 0.008,
      speed: 60,
      currentPalette: "Light Pastels",
      isLightMode: true,
    }),

  toggleLightMode: () => {
    const currentState = get()
    const newLightMode = !currentState.isLightMode

    // Switch to appropriate palette for the new mode
    let newPalette = currentState.currentPalette
    if (newLightMode && !currentState.currentPalette.startsWith("Light")) {
      newPalette = "Light Pastels" // Use existing light palette
    } else if (!newLightMode && currentState.currentPalette.startsWith("Light")) {
      newPalette = "Warm Sunset"
    }

    set({
      isLightMode: newLightMode,
      currentPalette: newPalette,
    })
  },

  regenerate: () => {
    const currentState = get()
    set({
      seed: Math.floor(Math.random() * 10000),
      // Keep all other parameters the same
    })
  },

  randomize: () => {
    set({
      seed: Math.floor(Math.random() * 10000),
      density: 0.1 + Math.random() * 1.9, // 0.1 to 2.0
      agentCount: Math.floor(Math.random() * 100), // 0 to 100
      decayRate: 0.001 + Math.random() * 0.099, // 0.001 to 0.1
      overlayRate: 0.001 + Math.random() * 0.049, // 0.001 to 0.05
      speed: Math.floor(10 + Math.random() * 110), // 10 to 120
    })
  },
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  setLayerProperty: (layer, property, value) => set((state) => ({
    layers: {
      ...state.layers,
      [layer]: {
        ...state.layers[layer],
        [property]: value
      }
    }
  })),
}))
