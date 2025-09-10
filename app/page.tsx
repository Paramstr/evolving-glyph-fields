"use client"

import { GlyphFieldsCanvas } from "@/components/glyph-fields-canvas"
import { GlyphFieldsControls } from "@/components/glyph-fields-controls"
import { useGlyphFieldsStore } from "@/lib/glyph-fields-store"

export default function Home() {
  const { isLightMode } = useGlyphFieldsStore()

  return (
    <main className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <GlyphFieldsCanvas />
      </div>

      <div
        className={`absolute left-0 top-0 h-full w-64 border-r flex flex-col transition-colors z-10 ${
          isLightMode
            ? "bg-white/95 border-gray-200 backdrop-blur-sm"
            : "bg-zinc-900/95 border-zinc-800 backdrop-blur-sm"
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <GlyphFieldsControls />
        </div>
      </div>
    </main>
  )
}
