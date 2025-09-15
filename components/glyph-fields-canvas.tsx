"use client"

import { useRef, useEffect, useCallback } from "react"
import { GlyphFieldsEngine } from "@/lib/glyph-fields-engine"
import { useGlyphFieldsStore } from "@/lib/glyph-fields-store"

export function GlyphFieldsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GlyphFieldsEngine | null>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const isDraggingRef = useRef<boolean>(false)
  const lastMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  const { isPlaying, seed, density, agentCount, decayRate, overlayRate, speed, currentPalette, isLightMode, truffleMode, trufflePalette, algorithm, zoom, panX, panY, setPan, setZoom } =
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

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    try {
      if (zoom > 1) {
        e.preventDefault()
        isDraggingRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
        if (canvasRef.current) {
          canvasRef.current.style.cursor = 'grabbing'
        }
      }
    } catch (error) {
      console.warn('Mouse down error:', error)
    }
  }, [zoom])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    try {
      if (isDraggingRef.current && zoom > 1) {
        const deltaX = e.clientX - lastMouseRef.current.x
        const deltaY = e.clientY - lastMouseRef.current.y
        
        // Scale pan movement to feel natural at all zoom levels
        const scaledDeltaX = deltaX
        const scaledDeltaY = deltaY
        
        setPan(panX + scaledDeltaX, panY + scaledDeltaY)
        
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
      }
    } catch (error) {
      console.warn('Mouse move error:', error)
    }
  }, [zoom, panX, panY, setPan])

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false
    if (canvasRef.current) {
      canvasRef.current.style.cursor = zoom > 1 ? 'grab' : 'default'
    }
  }, [zoom])

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default'
    }
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    try {
      e.preventDefault()
      e.stopPropagation()
      // More responsive zoom with better scaling
      const delta = -e.deltaY * 0.002
      const newZoom = Math.max(0.25, Math.min(8, zoom + delta))
      setZoom(newZoom)
    } catch (error) {
      console.warn('Wheel event error:', error)
    }
  }, [zoom, setZoom])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      // Account for sidebar width (384px = w-96)
      const sidebarWidth = 384
      canvas.width = window.innerWidth - sidebarWidth
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
      truffleMode,
      trufflePalette,
      algorithm,
      zoom,
      panX,
      panY,
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
        truffleMode,
        trufflePalette,
        algorithm,
        zoom,
        panX,
        panY,
      })
    }
  }, [density, agentCount, decayRate, overlayRate, currentPalette, truffleMode, trufflePalette, algorithm, zoom, panX, panY])

  // Update cursor style when zoom changes
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = zoom > 1 ? 'grab' : 'default'
    }
  }, [zoom])

  return (
    <canvas 
      ref={canvasRef} 
      className={`block ${isLightMode ? "bg-gray-100" : "bg-black"}`} 
      style={{ width: "100%", height: "100%" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
    />
  )
}