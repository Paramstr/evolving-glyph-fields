"use client"

import { GlyphFieldsCanvas } from "@/components/glyph-fields-canvas"
import { GlyphFieldsControls } from "@/components/glyph-fields-controls"
import { useGlyphFieldsStore } from "@/lib/glyph-fields-store"

export default function Home() {
  const { isLightMode } = useGlyphFieldsStore()
  
  return (
    <main className={`fixed inset-0 overflow-hidden ${isLightMode ? "bg-gray-100" : "bg-black"}`}>
      <div className="absolute inset-0">
        <GlyphFieldsCanvas />
      </div>

      <div className="absolute left-0 top-0 h-full w-96 flex flex-col z-10">
        <div className="flex-1 overflow-hidden">
          <GlyphFieldsControls />
        </div>
      </div>
    </main>
  )
}
