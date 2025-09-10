"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGlyphFieldsStore } from "@/lib/glyph-fields-store"
import { PALETTES, PRESETS } from "@/lib/glyph-fields-config"
import { Play, Pause, RotateCcw, Square, Circle, Plus, Minus, Sun, Moon, Download } from "lucide-react"

export function GlyphFieldsControls() {
  const {
    isPlaying,
    seed,
    density,
    agentCount,
    decayRate,
    overlayRate,
    currentPalette,
    isLightMode,
    togglePlayback,
    setSeed,
    setDensity,
    setAgentCount,
    setDecayRate,
    setOverlayRate,
    setPalette,
    loadPreset,
    reset,
    toggleLightMode,
    regenerate,
  } = useGlyphFieldsStore()

  const GlyphShowcase = () => (
    <div className="space-y-2">
      <h3 className={`text-xs font-medium ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>Active Glyphs</h3>
      <div className="grid grid-cols-6 gap-1">
        <div
          className={`flex flex-col items-center gap-1 p-1 ${isLightMode ? "bg-zinc-100" : "bg-zinc-800"} rounded text-center`}
        >
          <Square className="w-3 h-3 text-yellow-500" />
          <span className={`text-[10px] ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Grid</span>
        </div>
        <div
          className={`flex flex-col items-center gap-1 p-1 ${isLightMode ? "bg-zinc-100" : "bg-zinc-800"} rounded text-center`}
        >
          <Circle className="w-3 h-3 text-orange-500" />
          <span className={`text-[10px] ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Dot</span>
        </div>
        <div
          className={`flex flex-col items-center gap-1 p-1 ${isLightMode ? "bg-zinc-100" : "bg-zinc-800"} rounded text-center`}
        >
          <Plus className="w-3 h-3 text-red-500" />
          <span className={`text-[10px] ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Cross</span>
        </div>
        <div
          className={`flex flex-col items-center gap-1 p-1 ${isLightMode ? "bg-zinc-100" : "bg-zinc-800"} rounded text-center`}
        >
          <div className="w-3 h-3 bg-red-500 rounded-sm" />
          <span className={`text-[10px] ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Stripe</span>
        </div>
        <div
          className={`flex flex-col items-center gap-1 p-1 ${isLightMode ? "bg-zinc-100" : "bg-zinc-800"} rounded text-center`}
        >
          <div className="w-3 h-3 border-2 border-blue-500 rounded-full" />
          <span className={`text-[10px] ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Ring</span>
        </div>
        <div
          className={`flex flex-col items-center gap-1 p-1 ${isLightMode ? "bg-zinc-100" : "bg-zinc-800"} rounded text-center`}
        >
          <Minus className="w-3 h-3 text-green-500" />
          <span className={`text-[10px] ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Hatch</span>
        </div>
      </div>
    </div>
  )

  const ColorPreview = ({ colors }: { colors: string[] }) => (
    <div className="flex gap-1">
      {colors.slice(0, 4).map((color, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-sm border ${isLightMode ? "border-zinc-300" : "border-zinc-600"}`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )

  const filteredPalettes = Object.entries(PALETTES).filter(([name]) => {
    const isLightPalette = name.startsWith("Light")
    return isLightMode ? isLightPalette : !isLightPalette
  })

  return (
    <div className={`p-3 space-y-4 ${isLightMode ? "bg-white text-zinc-900" : "bg-zinc-900 text-white"}`}>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className={`text-sm font-semibold ${isLightMode ? "text-zinc-800" : "text-zinc-200"}`}>Glyph Fields</h2>
          <Button
            onClick={toggleLightMode}
            variant="outline"
            size="sm"
            className={`h-6 w-6 p-0 ${isLightMode ? "bg-transparent border-zinc-300 hover:bg-zinc-100" : "bg-transparent border-zinc-700 hover:bg-zinc-800"}`}
          >
            {isLightMode ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
          </Button>
        </div>

        <div className="space-y-1">
          <Label className={`text-xs ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>Palette</Label>
          <Select value={currentPalette} onValueChange={setPalette}>
            <SelectTrigger
              className={`h-7 text-xs ${isLightMode ? "bg-zinc-50 border-zinc-300" : "bg-zinc-800 border-zinc-700"}`}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={`${isLightMode ? "bg-white border-zinc-300" : "bg-zinc-800 border-zinc-700"}`}>
              {filteredPalettes.map(([paletteName, palette]) => (
                <SelectItem
                  key={paletteName}
                  value={paletteName}
                  className={`text-xs ${isLightMode ? "hover:bg-zinc-100" : "hover:bg-zinc-700"}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{paletteName}</span>
                    <ColorPreview colors={palette.colors} />
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <GlyphShowcase />

      <div className="space-y-2">
        <h3 className={`text-xs font-medium ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>Layer Controls</h3>
        <div
          className={`text-[10px] p-2 rounded ${isLightMode ? "bg-zinc-50 text-zinc-600" : "bg-zinc-800 text-zinc-400"}`}
        >
          <div className="space-y-1">
            <div>Back: Dense, Conservative</div>
            <div>Middle: Moderate Activity</div>
            <div>Front: Gaseous, High Activity</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex gap-1">
          <Button
            onClick={togglePlayback}
            variant="outline"
            size="sm"
            className={`flex-1 h-7 text-xs ${isLightMode ? "bg-transparent border-zinc-300 hover:bg-zinc-100" : "bg-transparent border-zinc-700 hover:bg-zinc-800"}`}
          >
            {isPlaying ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
            {isPlaying ? "Pause" : "Play"}
          </Button>
          <Button
            onClick={regenerate}
            variant="outline"
            size="sm"
            className={`h-7 px-2 ${isLightMode ? "bg-transparent border-zinc-300 hover:bg-zinc-100" : "bg-transparent border-zinc-700 hover:bg-zinc-800"}`}
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
          <Button
            onClick={() => {
              const canvas = document.querySelector("canvas")
              if (canvas) {
                const link = document.createElement("a")
                link.download = `glyph-fields-${Date.now()}.png`
                link.href = canvas.toDataURL()
                link.click()
              }
            }}
            variant="outline"
            size="sm"
            className={`h-7 px-2 ${isLightMode ? "bg-transparent border-zinc-300 hover:bg-zinc-100" : "bg-transparent border-zinc-700 hover:bg-zinc-800"}`}
          >
            <Download className="w-3 h-3" />
          </Button>
        </div>

        <div className="space-y-1">
          <Label htmlFor="seed" className={`text-xs ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>
            Seed
          </Label>
          <Input
            id="seed"
            type="number"
            value={seed}
            onChange={(e) => setSeed(Number.parseInt(e.target.value) || 0)}
            className={`h-7 text-xs ${isLightMode ? "bg-zinc-50 border-zinc-300" : "bg-zinc-800 border-zinc-700"}`}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className={`text-xs font-medium ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>Parameters</h3>
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className={`text-xs ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
              Density: {density.toFixed(2)}
            </Label>
            <Slider
              value={[density]}
              onValueChange={([value]) => setDensity(value)}
              min={0.1}
              max={1.0}
              step={0.05}
              className="w-full h-4"
            />
          </div>

          <div className="space-y-1">
            <Label className={`text-xs ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>Agents: {agentCount}</Label>
            <Slider
              value={[agentCount]}
              onValueChange={([value]) => setAgentCount(value)}
              min={0}
              max={20}
              step={1}
              className="w-full h-4"
            />
          </div>

          <div className="space-y-1">
            <Label className={`text-xs ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
              Decay: {decayRate.toFixed(3)}
            </Label>
            <Slider
              value={[decayRate]}
              onValueChange={([value]) => setDecayRate(value)}
              min={0.001}
              max={0.05}
              step={0.001}
              className="w-full h-4"
            />
          </div>

          <div className="space-y-1">
            <Label className={`text-xs ${isLightMode ? "text-zinc-600" : "text-zinc-400"}`}>
              Overlay: {overlayRate.toFixed(3)}
            </Label>
            <Slider
              value={[overlayRate]}
              onValueChange={([value]) => setOverlayRate(value)}
              min={0.001}
              max={0.02}
              step={0.001}
              className="w-full h-4"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className={`text-xs font-medium ${isLightMode ? "text-zinc-700" : "text-zinc-300"}`}>Presets</h3>
        <div className="grid grid-cols-1 gap-1">
          {Object.keys(PRESETS)
            .filter((presetName) => {
              const isLightPreset = presetName.startsWith("Light")
              return isLightMode ? isLightPreset : !isLightPreset
            })
            .slice(0, 3)
            .map((presetName) => (
              <Button
                key={presetName}
                onClick={() => loadPreset(presetName)}
                variant="outline"
                size="sm"
                className={`h-6 justify-start text-xs ${isLightMode ? "bg-transparent border-zinc-300 hover:bg-zinc-100" : "bg-transparent border-zinc-700 hover:bg-zinc-800"}`}
              >
                {presetName.replace("Light ", "").replace("Dark ", "")}
              </Button>
            ))}
        </div>
      </div>
    </div>
  )
}
