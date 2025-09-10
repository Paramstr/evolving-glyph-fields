"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useGlyphFieldsStore } from "@/lib/glyph-fields-store"
import { PALETTES } from "@/lib/glyph-fields-config"
import { Play, Pause, RefreshCw, Dices, Download, Sun, Moon, Zap, Clock } from "lucide-react"

export function GlyphFieldsControls() {
  const {
    isPlaying,
    seed,
    density,
    agentCount,
    decayRate,
    overlayRate,
    speed,
    isLightMode,
    currentPalette,
    layers,
    togglePlayback,
    setSeed,
    setDensity,
    setAgentCount,
    setDecayRate,
    setOverlayRate,
    setSpeed,
    setPalette,
    reset,
    regenerate,
    randomize,
    toggleLightMode,
    setLayerProperty,
  } = useGlyphFieldsStore()

  const PalettePreview = ({ palette }: { palette: typeof PALETTES[keyof typeof PALETTES] }) => (
    <div className="flex gap-0.5 h-6 rounded overflow-hidden shadow-sm">
      {palette.colors.slice(0, 8).map((color, i) => (
        <div
          key={i}
          className="flex-1"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  )

  const LayerControls = ({ layerName, layer }: { layerName: 'back' | 'middle' | 'front', layer: typeof layers.back }) => {
    const layerConfig = {
      back: { 
        label: "BACK LAYER", 
        desc: "Dense foundation",
        color: isLightMode ? "border-l-gray-400" : "border-l-zinc-500"
      },
      middle: { 
        label: "MIDDLE LAYER", 
        desc: "Moderate activity",
        color: isLightMode ? "border-l-blue-400" : "border-l-blue-500"
      },
      front: { 
        label: "FRONT LAYER", 
        desc: "Gaseous overlay",
        color: isLightMode ? "border-l-purple-400" : "border-l-purple-500"
      }
    }[layerName]

    return (
      <div className={`space-y-3 p-4 rounded-lg border-l-4 ${layerConfig.color} ${
        isLightMode ? "bg-gray-50" : "bg-zinc-900/50"
      }`}>
        <div>
          <h4 className={`text-xs font-mono ${
            isLightMode ? "text-gray-700" : "text-zinc-300"
          }`}>
            {layerConfig.label}
          </h4>
          <p className={`text-[10px] ${
            isLightMode ? "text-gray-500" : "text-zinc-500"
          }`}>
            {layerConfig.desc}
          </p>
        </div>
        
        <div className="space-y-3">
          {/* Live Parameters */}
          <div className="space-y-3">
            <div className="flex items-center gap-1 mb-2">
              <Zap className="w-3 h-3 text-green-500" />
              <span className={`text-[10px] font-medium ${
                isLightMode ? "text-green-600" : "text-green-400"
              }`}>
                LIVE UPDATES
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Opacity</Label>
                <span className="text-[10px] font-mono">{(layer.opacity * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[layer.opacity]}
                onValueChange={([value]) => setLayerProperty(layerName, 'opacity', value)}
                min={0}
                max={1}
                step={0.01}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-green-600"
                    : "[&_[role=slider]]:bg-green-400"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Decay Rate</Label>
                <span className="text-[10px] font-mono">{layer.decayRate.toFixed(3)}</span>
              </div>
              <Slider
                value={[layer.decayRate]}
                onValueChange={([value]) => setLayerProperty(layerName, 'decayRate', value)}
                min={0.0001}
                max={0.2}
                step={0.0001}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-green-600"
                    : "[&_[role=slider]]:bg-green-400"
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px]">Blend Mode</Label>
              <Select 
                value={layer.blendMode} 
                onValueChange={(value) => setLayerProperty(layerName, 'blendMode', value)}
              >
                <SelectTrigger className={`h-7 text-[11px] ${
                  isLightMode
                    ? "border-green-200 focus:border-green-400"
                    : "border-green-900 focus:border-green-600"
                }`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="multiply">Multiply</SelectItem>
                  <SelectItem value="screen">Screen</SelectItem>
                  <SelectItem value="overlay">Overlay</SelectItem>
                  <SelectItem value="soft-light">Soft Light</SelectItem>
                  <SelectItem value="color-dodge">Color Dodge</SelectItem>
                  <SelectItem value="difference">Difference</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Regeneration Required Parameters */}
          <div className="space-y-3 pt-3 border-t border-dashed ${
            isLightMode ? 'border-gray-300' : 'border-zinc-700'
          }">
            <div className="flex items-center gap-1 mb-2">
              <Clock className="w-3 h-3 text-orange-500" />
              <span className={`text-[10px] font-medium ${
                isLightMode ? "text-orange-600" : "text-orange-400"
              }`}>
                REQUIRES REGENERATION
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Density</Label>
                <span className="text-[10px] font-mono">{layer.density.toFixed(2)}</span>
              </div>
              <Slider
                value={[layer.density]}
                onValueChange={([value]) => setLayerProperty(layerName, 'density', value)}
                min={0.05}
                max={5.0}
                step={0.05}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-orange-600"
                    : "[&_[role=slider]]:bg-orange-400"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Agent Count</Label>
                <span className="text-[10px] font-mono">{layer.agentCount}</span>
              </div>
              <Slider
                value={[layer.agentCount]}
                onValueChange={([value]) => setLayerProperty(layerName, 'agentCount', value)}
                min={0}
                max={200}
                step={1}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-orange-600"
                    : "[&_[role=slider]]:bg-orange-400"
                }`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[11px]">Overlay Rate</Label>
                <span className="text-[10px] font-mono">{layer.overlayRate.toFixed(3)}</span>
              </div>
              <Slider
                value={[layer.overlayRate]}
                onValueChange={([value]) => setLayerProperty(layerName, 'overlayRate', value)}
                min={0.0001}
                max={0.1}
                step={0.0001}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-orange-600"
                    : "[&_[role=slider]]:bg-orange-400"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`h-full flex flex-col ${
      isLightMode 
        ? "bg-white text-gray-900" 
        : "bg-zinc-950 text-white"
    }`}>
      {/* Header */}
      <div className={`p-6 pb-4 border-b ${
        isLightMode ? "border-gray-200" : "border-zinc-800"
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h1 className={`text-xs font-mono tracking-[0.3em] ${
            isLightMode ? "text-gray-500" : "text-zinc-400"
          }`}>
            EVOLVING GLYPH FIELDS
          </h1>
          <Button
            onClick={toggleLightMode}
            variant="outline"
            size="icon"
            className={`h-8 w-8 ${
              isLightMode
                ? "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
            }`}
            title="Toggle theme"
          >
            {isLightMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>
        </div>
        
        {/* Main Controls */}
        <div className="flex gap-2">
          <Button
            onClick={togglePlayback}
            variant="outline"
            size="sm"
            className={`flex-1 h-10 ${
              isLightMode
                ? "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          
          <Button
            onClick={reset}
            variant="outline"
            size="icon"
            className={`h-10 w-10 ${
              isLightMode
                ? "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
            }`}
            title="Reset all parameters"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button
            onClick={randomize}
            variant="outline"
            size="icon"
            className={`h-10 w-10 ${
              isLightMode
                ? "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
            }`}
            title="Randomize all parameters"
          >
            <Dices className="w-4 h-4" />
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
            size="icon"
            className={`h-10 w-10 ${
              isLightMode
                ? "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700"
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
            }`}
            title="Export image"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Colour Palette Section */}
        <section>
          <h2 className={`text-xs font-mono tracking-wider mb-3 ${
            isLightMode ? "text-gray-700" : "text-zinc-300"
          }`}>
            COLOUR PALETTE
          </h2>
          
          <div className="space-y-2">
            {Object.entries(PALETTES)
              .filter(([name]) => isLightMode ? name.startsWith("Light") : !name.startsWith("Light"))
              .map(([name, palette]) => (
                <button
                  key={name}
                  onClick={() => setPalette(name)}
                  className={`w-full p-2.5 rounded-lg border transition-all ${
                    currentPalette === name
                      ? isLightMode
                        ? "border-gray-400 bg-gray-50 shadow-sm"
                        : "border-zinc-600 bg-zinc-900 shadow-sm"
                      : isLightMode
                        ? "border-gray-200 hover:border-gray-300"
                        : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-medium ${
                        isLightMode ? "text-gray-700" : "text-zinc-300"
                      }`}>
                        {name.replace("Light ", "")}
                      </span>
                      {currentPalette === name && (
                        <span className={`text-[10px] px-2 py-0.5 rounded ${
                          isLightMode
                            ? "bg-gray-200 text-gray-600"
                            : "bg-zinc-800 text-zinc-400"
                        }`}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <PalettePreview palette={palette} />
                  </div>
                </button>
              ))}
          </div>
        </section>

        {/* Configuration Section */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className={`text-xs font-mono tracking-wider ${
              isLightMode ? "text-gray-700" : "text-zinc-300"
            }`}>
              CONFIGURATION
            </h2>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-green-500" />
              <span className={`text-[10px] ${
                isLightMode ? "text-gray-500" : "text-zinc-500"
              }`}>
                Live updates
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Seed - Special case with regeneration */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label className={`text-xs ${
                  isLightMode ? "text-gray-600" : "text-zinc-400"
                }`}>
                  Seed
                </Label>
                <Clock className="w-3 h-3 text-orange-500" />
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(Number.parseInt(e.target.value) || 0)}
                  className={`h-8 font-mono text-xs ${
                    isLightMode
                      ? "bg-gray-50 border-gray-200 text-gray-700 focus:border-gray-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-300 focus:border-zinc-700"
                  }`}
                />
                <Button
                  onClick={regenerate}
                  variant="outline"
                  size="sm"
                  className={`h-8 px-3 text-xs ${
                    isLightMode
                      ? "bg-gray-100 border-gray-200 hover:bg-gray-200 text-gray-700"
                      : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300"
                  }`}
                  title="Generate new seed"
                >
                  New
                </Button>
              </div>
            </div>

            {/* Speed Control - Live */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={`text-xs ${
                  isLightMode ? "text-gray-600" : "text-zinc-400"
                }`}>
                  Speed
                </Label>
                <span className={`text-xs font-mono ${
                  isLightMode ? "text-gray-500" : "text-zinc-500"
                }`}>
                  {speed} FPS
                </span>
              </div>
              <Slider
                value={[speed]}
                onValueChange={([value]) => setSpeed(value)}
                min={10}
                max={120}
                step={5}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-green-600"
                    : "[&_[role=slider]]:bg-green-400"
                }`}
              />
            </div>

            {/* Density - Requires Regeneration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className={`text-xs ${
                    isLightMode ? "text-gray-600" : "text-zinc-400"
                  }`}>
                    Density
                  </Label>
                  <Clock className="w-3 h-3 text-orange-500" />
                </div>
                <span className={`text-xs font-mono ${
                  isLightMode ? "text-gray-500" : "text-zinc-500"
                }`}>
                  {density.toFixed(2)}
                </span>
              </div>
              <Slider
                value={[density]}
                onValueChange={([value]) => setDensity(value)}
                min={0.1}
                max={2.0}
                step={0.05}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-orange-600"
                    : "[&_[role=slider]]:bg-orange-400"
                }`}
              />
            </div>

            {/* Agent Count - Requires Regeneration */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className={`text-xs ${
                    isLightMode ? "text-gray-600" : "text-zinc-400"
                  }`}>
                    Agents
                  </Label>
                  <Clock className="w-3 h-3 text-orange-500" />
                </div>
                <span className={`text-xs font-mono ${
                  isLightMode ? "text-gray-500" : "text-zinc-500"
                }`}>
                  {agentCount}
                </span>
              </div>
              <Slider
                value={[agentCount]}
                onValueChange={([value]) => setAgentCount(value)}
                min={0}
                max={100}
                step={1}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-orange-600"
                    : "[&_[role=slider]]:bg-orange-400"
                }`}
              />
            </div>

            {/* Decay Rate - Live */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={`text-xs ${
                  isLightMode ? "text-gray-600" : "text-zinc-400"
                }`}>
                  Decay
                </Label>
                <span className={`text-xs font-mono ${
                  isLightMode ? "text-gray-500" : "text-zinc-500"
                }`}>
                  {decayRate.toFixed(3)}
                </span>
              </div>
              <Slider
                value={[decayRate]}
                onValueChange={([value]) => setDecayRate(value)}
                min={0.001}
                max={0.1}
                step={0.001}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-green-600"
                    : "[&_[role=slider]]:bg-green-400"
                }`}
              />
            </div>

            {/* Overlay Rate - Live */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className={`text-xs ${
                  isLightMode ? "text-gray-600" : "text-zinc-400"
                }`}>
                  Overlay
                </Label>
                <span className={`text-xs font-mono ${
                  isLightMode ? "text-gray-500" : "text-zinc-500"
                }`}>
                  {overlayRate.toFixed(3)}
                </span>
              </div>
              <Slider
                value={[overlayRate]}
                onValueChange={([value]) => setOverlayRate(value)}
                min={0.001}
                max={0.05}
                step={0.001}
                className={`${
                  isLightMode
                    ? "[&_[role=slider]]:bg-green-600"
                    : "[&_[role=slider]]:bg-green-400"
                }`}
              />
            </div>
          </div>
        </section>

        {/* Advanced Section */}
        <section>
          <h2 className={`text-xs font-mono tracking-wider mb-3 ${
            isLightMode ? "text-gray-700" : "text-zinc-300"
          }`}>
            ADVANCED
          </h2>
          
          <div className="space-y-3">
            <LayerControls layerName="back" layer={layers.back} />
            <LayerControls layerName="middle" layer={layers.middle} />
            <LayerControls layerName="front" layer={layers.front} />
          </div>
        </section>
      </div>
    </div>
  )
}