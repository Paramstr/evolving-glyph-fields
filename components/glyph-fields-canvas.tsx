"use client"

import { useRef, useEffect, useCallback } from "react"
import { GlyphFieldsEngine } from "@/lib/glyph-fields-engine"
import { useGlyphFieldsStore } from "@/lib/glyph-fields-store"

export function GlyphFieldsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GlyphFieldsEngine | null>(null)
  const animationRef = useRef<number>()
  const lastTimeRef = useRef<number>(0)

  const { isPlaying, seed, density, agentCount, decayRate, overlayRate, speed, currentPalette, isLightMode } =
    useGlyphFieldsStore()

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    
    const deltaTime = timestamp - lastTimeRef.current
    const frameInterval = 1000 / speed
    
    if (deltaTime >= frameInterval) {
      if (engineRef.current && isPlaying) {
        engineRef.current.update()
        engineRef.current.render()
      }
      lastTimeRef.current = timestamp - (deltaTime % frameInterval)
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [isPlaying, speed])

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

  return (
    <canvas 
      ref={canvasRef} 
      className={`block ${isLightMode ? "bg-gray-100" : "bg-black"}`} 
      style={{ width: "100vw", height: "100vh" }} 
    />
  )
}