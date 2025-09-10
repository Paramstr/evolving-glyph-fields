import { create } from "zustand"
import { PRESETS } from "./glyph-fields-config"

interface GlyphFieldsState {
  isPlaying: boolean
  seed: number
  density: number
  agentCount: number
  decayRate: number
  overlayRate: number
  currentPalette: string
  isLightMode: boolean

  togglePlayback: () => void
  setSeed: (seed: number) => void
  setDensity: (density: number) => void
  setAgentCount: (count: number) => void
  setDecayRate: (rate: number) => void
  setOverlayRate: (rate: number) => void
  setPalette: (palette: string) => void
  loadPreset: (presetName: string) => void
  reset: () => void
  toggleLightMode: () => void
  regenerate: () => void
}

export const useGlyphFieldsStore = create<GlyphFieldsState>((set, get) => ({
  isPlaying: true,
  seed: Math.floor(Math.random() * 10000),
  density: 0.3,
  agentCount: 8,
  decayRate: 0.005,
  overlayRate: 0.008,
  currentPalette: "Light Pastels",
  isLightMode: true,

  togglePlayback: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setSeed: (seed) => set({ seed }),
  setDensity: (density) => set({ density }),
  setAgentCount: (agentCount) => set({ agentCount }),
  setDecayRate: (decayRate) => set({ decayRate }),
  setOverlayRate: (overlayRate) => set({ overlayRate }),
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
}))
