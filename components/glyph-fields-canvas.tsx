"use client"

import { useRef, useEffect, useCallback } from "react"
import { GlyphFieldsEngine } from "@/lib/glyph-fields-engine"
import { useGlyphFieldsStore } from "@/lib/glyph-fields-store"

function GlyphShowcase() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { isLightMode } = useGlyphFieldsStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = isLightMode ? "#f8fafc" : "#0a0a0a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const colors = {
      ochre: "#d4a574",
      darkOchre: "#b8935f",
      lightOchre: "#e8c49a",
      red: "#d63447",
      darkRed: "#b82d3f",
      lightRed: "#e85a6b",
      cream: "#f4e6d7",
      pink: "#e8b4cb",
      orange: "#e67e22",
      blue: "#5dade2",
      darkBlue: "#3498db",
      mutedGreen: "#7d8471",
      darkGreen: "#6b7059",
      white: "#ffffff",
      black: "#000000",
      gray: "#95a5a6",
    }

    const cellSize = 16
    let x = 20
    let y = 20

    const drawLabel = (text: string, labelX: number, labelY: number) => {
      ctx.fillStyle = isLightMode ? "#1f2937" : "#ffffff"
      ctx.font = "12px monospace"
      ctx.fillText(text, labelX, labelY - 5)
    }

    drawLabel("3-LAYER SYSTEM: Back (Dense) → Middle (Moderate) → Front (Gaseous)", x, y)
    y += 30

    const gridColors = [colors.ochre, colors.darkOchre, colors.lightOchre, colors.blue, colors.darkBlue]
    gridColors.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.9
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.fillRect(x + i * 60 + col * cellSize, y + row * cellSize, cellSize - 1, cellSize - 1)
        }
      }
      ctx.globalAlpha = 1.0
    })

    x = 20
    y += 80
    drawLabel("DOTS (Layer 1 - Moderate):", x, y)
    y += 20
    const dotColors = [colors.cream, colors.orange, colors.pink, colors.red, colors.ochre]
    dotColors.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.7
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          ctx.beginPath()
          ctx.arc(
            x + i * 60 + col * cellSize + cellSize / 2,
            y + row * cellSize + cellSize / 2,
            cellSize / 2 - 1,
            0,
            Math.PI * 2,
          )
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1.0
    })

    x = 20
    y += 60
    drawLabel("CROSSES (Layer 2 - Gaseous):", x, y)
    y += 20
    const crossColors = [colors.red, colors.darkRed, colors.mutedGreen, colors.darkGreen, colors.pink]
    crossColors.forEach((color, i) => {
      ctx.fillStyle = color
      ctx.globalAlpha = 0.5
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 3; col++) {
          const centerX = x + i * 60 + col * cellSize + cellSize / 2
          const centerY = y + row * cellSize + cellSize / 2
          const crossSize = cellSize / 3
          ctx.fillRect(centerX - crossSize, centerY - 1, crossSize * 2, 3)
          ctx.fillRect(centerX - 1, centerY - crossSize, 3, crossSize * 2)
        }
      }
      ctx.globalAlpha = 1.0
    })

    x = 20
    y += 60
    drawLabel("STRIPES (All Layers):", x, y)
    y += 20
    const stripePatterns = [
      [colors.red, colors.white],
      [colors.black, colors.white],
      [colors.red, colors.lightRed],
      [colors.blue, colors.white],
      [colors.ochre, colors.lightOchre],
    ]
    stripePatterns.forEach((pattern, i) => {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          ctx.fillStyle = pattern[col % 2]
          ctx.fillRect(x + i * 60 + col * 4, y + row * cellSize, 4, cellSize)
        }
      }
    })

    x = 20
    y += 80
    drawLabel("LAYER INTERACTIONS (Game of Life Rules):", x, y)
    y += 20
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = colors.ochre
      ctx.globalAlpha = 0.9
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          ctx.fillRect(x + i * 80 + col * cellSize, y + row * cellSize, cellSize - 1, cellSize - 1)
        }
      }

      ctx.fillStyle = colors.red
      ctx.globalAlpha = 0.6
      ctx.beginPath()
      ctx.arc(x + i * 80 + cellSize, y + cellSize, cellSize / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = colors.mutedGreen
      ctx.globalAlpha = 0.4
      const centerX = x + i * 80 + cellSize / 2
      const centerY = y + cellSize / 2
      ctx.fillRect(centerX - 2, centerY - 6, 4, 12)
      ctx.fillRect(centerX - 6, centerY - 2, 12, 4)

      ctx.globalAlpha = 1.0
    }
  }, [isLightMode])

  return (
    <div className="mb-6">
      <h3 className={`text-lg font-semibold mb-3 transition-colors ${isLightMode ? "text-gray-800" : "text-zinc-200"}`}>
        Glyph Palette & Layer System
      </h3>
      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        className={`border rounded-lg transition-colors ${
          isLightMode ? "border-gray-300 bg-gray-50" : "border-zinc-700 bg-zinc-950"
        }`}
      />
      <p className={`text-sm mt-2 transition-colors ${isLightMode ? "text-gray-600" : "text-zinc-400"}`}>
        Each layer follows Game of Life rules with different activity levels:
        <span className="text-blue-500"> Back (conservative)</span>,
        <span className="text-green-500"> Middle (moderate)</span>,
        <span className="text-red-500"> Front (gaseous)</span>
      </p>
    </div>
  )
}

export function GlyphFieldsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GlyphFieldsEngine | null>(null)
  const animationRef = useRef<number>()

  const { isPlaying, seed, density, agentCount, decayRate, overlayRate, currentPalette, isLightMode } =
    useGlyphFieldsStore()

  const animate = useCallback(() => {
    if (engineRef.current && isPlaying) {
      engineRef.current.update()
      engineRef.current.render()
    }
    animationRef.current = requestAnimationFrame(animate)
  }, [isPlaying])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (engineRef.current) {
        engineRef.current.resize(canvas.width, canvas.height)
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    engineRef.current = new GlyphFieldsEngine(canvas, ctx, {
      seed,
      density,
      agentCount,
      decayRate,
      overlayRate,
      palette: currentPalette,
    })

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [seed, animate])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateParameters({
        density,
        agentCount,
        decayRate,
        overlayRate,
        palette: currentPalette,
      })
    }
  }, [density, agentCount, decayRate, overlayRate, currentPalette])

  const handleExportImage = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement("a")
    link.download = `glyph-fields-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="w-full h-full relative">
      <canvas ref={canvasRef} className="block" style={{ width: "100vw", height: "100vh" }} />
      <button
        onClick={handleExportImage}
        className={`absolute top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors z-20 ${
          isLightMode
            ? "bg-white/90 hover:bg-white text-gray-800 border border-gray-200"
            : "bg-zinc-900/90 hover:bg-zinc-800 text-white border border-zinc-700"
        }`}
      >
        Export PNG
      </button>
    </div>
  )
}
