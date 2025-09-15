import { PALETTES, TRUFFLE_PALETTES } from "./glyph-fields-config"

export type AlgorithmType = "gentle-chaos" | "rhythmic-chaos" | "emergent-complexity"

export interface EngineParams {
  seed: number
  density: number
  agentCount: number
  decayRate: number
  overlayRate: number
  palette: string
  truffleMode: boolean
  trufflePalette: string
  zoom: number
  panX: number
  panY: number
  algorithm: AlgorithmType
}

export enum GlyphType {
  EMPTY = 0,
  GRID = 1, // rectangular grid tiles
  DOT = 2, // circular dots
  CROSS = 3, // plus symbols
  STRIPE = 4, // vertical stripes
  RING = 5, // hollow circles
  HATCH = 6, // diagonal hatching
  TRUFFLE = 7, // rounded square with gradient
}

interface Cell {
  glyph: GlyphType
  colorIndex: number
  opacity: number
  age: number
  layer: number
  clusterSeed: number // Added cluster identification
  gradientIndex: number // For truffle gradient selection
}

interface Agent {
  x: number
  y: number
  vx: number
  vy: number
  energy: number
  lastDrop: number
  layer: number
  glyphType: GlyphType
  clusterSeed: number // Added cluster affinity
}

interface ClusterSeed {
  x: number
  y: number
  glyphType: GlyphType
  colorIndex: number
  layer: number
  maxRadius: number
  currentRadius: number
  growthRate: number
  id: number
}

export class GlyphFieldsEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number
  private height: number
  private baseCellSize: number
  private cellSize: number
  private gridWidth: number
  private gridHeight: number

  private grid: Cell[][] = []
  private agents: Agent[] = []
  private rng: () => number
  private tick: number
  private params: EngineParams
  private clusters: ClusterSeed[]
  private nextClusterId: number

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, params: EngineParams) {
    this.canvas = canvas
    this.ctx = ctx
    this.width = canvas.width
    this.height = canvas.height
    this.baseCellSize = 24
    this.cellSize = this.baseCellSize * params.zoom
    this.gridWidth = Math.floor(this.width / this.cellSize)
    this.gridHeight = Math.floor(this.height / this.cellSize)
    this.params = params
    this.tick = 0
    this.clusters = []
    this.nextClusterId = 0

    this.rng = this.createSeededRNG(params.seed)

    this.initializeGrid()
    this.initializeAgents()
    this.seedInitialClusters()
  }

  public resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height

    // Recalculate cell size based on current zoom
    this.cellSize = this.baseCellSize * this.params.zoom
    const newGridWidth = Math.floor(this.width / this.cellSize)
    const newGridHeight = Math.floor(this.height / this.cellSize)

    if (newGridWidth !== this.gridWidth || newGridHeight !== this.gridHeight) {
      this.gridWidth = newGridWidth
      this.gridHeight = newGridHeight

      const oldGrid = this.grid
      this.initializeGrid()

      if (oldGrid) {
        const minWidth = Math.min(oldGrid[0].length, this.gridWidth)
        const minHeight = Math.min(oldGrid.length, this.gridHeight)
        for (let y = 0; y < minHeight; y++) {
          for (let x = 0; x < minWidth; x++) {
            this.grid[y][x] = oldGrid[y][x]
          }
        }
      }
    }
  }

  private createSeededRNG(seed: number): () => number {
    let s = seed
    return () => {
      s = (s * 1664525 + 1013904223) % 2147483647
      return s / 2147483647
    }
  }

  private initializeGrid() {
    this.grid = Array(this.gridHeight)
      .fill(null)
      .map(() =>
        Array(this.gridWidth)
          .fill(null)
          .map(() => ({
            glyph: GlyphType.EMPTY,
            colorIndex: 0,
            opacity: 0,
            age: 0,
            layer: 0,
            clusterSeed: -1,
            gradientIndex: 0,
          })),
      )
  }

  private initializeAgents() {
    const agents: Agent[] = []
    
    for (let layer = 0; layer < 3; layer++) {
      const agentCount = Math.floor(this.params.agentCount / 3)
      
      for (let i = 0; i < agentCount; i++) {
        agents.push({
          x: this.rng() * this.gridWidth,
          y: this.rng() * this.gridHeight,
          vx: (this.rng() - 0.5) * 0.5,
          vy: (this.rng() - 0.5) * 0.5,
          energy: 100,
          lastDrop: 0,
          layer: layer,
          glyphType: this.params.truffleMode && this.rng() < 0.08 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1,
          clusterSeed: -1,
        })
      }
    }
    
    this.agents = agents
  }

  private seedInitialClusters() {
    const numClusters = 3 + Math.floor(this.rng() * 5)

    for (let i = 0; i < numClusters; i++) {
      const cluster: ClusterSeed = {
        x: Math.floor(this.rng() * this.gridWidth),
        y: Math.floor(this.rng() * this.gridHeight),
        glyphType: this.params.truffleMode && this.rng() < 0.05 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1,
        colorIndex: Math.floor(this.rng() * 12),
        layer: Math.floor(this.rng() * 3),
        maxRadius: 5 + Math.floor(this.rng() * 10),
        currentRadius: 1,
        growthRate: 0.1 + this.rng() * 0.3,
        id: this.nextClusterId++,
      }

      this.clusters.push(cluster)

      if (cluster.x >= 0 && cluster.x < this.gridWidth && cluster.y >= 0 && cluster.y < this.gridHeight) {
        const cell = this.grid[cluster.y][cluster.x]
        cell.glyph = cluster.glyphType
        cell.colorIndex = cluster.colorIndex
        cell.opacity = 0.8
        cell.layer = cluster.layer
        cell.clusterSeed = cluster.id
        cell.gradientIndex = Math.floor(this.rng() * 6)
      }
    }
  }

  public update() {
    this.tick++

    this.updateCellularAutomaton()
    this.updateClusters()
    this.updateAgents()

    // Natural overlay rate for organic evolution
    if (this.rng() < this.params.overlayRate) {
      this.addOverlay()
    }

    // Cascade effects - changes spread naturally
    if (this.tick % 50 === 0) {
      this.propagateCascadeEffects()
    }

    this.updateAging()
  }

  private updateCellularAutomaton() {
    switch (this.params.algorithm) {
      case "gentle-chaos":
        this.updateGentleChaos()
        break
      case "rhythmic-chaos":
        this.updateRhythmicChaos()
        break
      case "emergent-complexity":
        this.updateEmergentComplexity()
        break
    }
  }

  private updateGentleChaos() {
    const newGrid: Cell[][] = Array(this.gridHeight)
      .fill(null)
      .map(() =>
        Array(this.gridWidth)
          .fill(null)
          .map(() => ({
            glyph: GlyphType.EMPTY,
            colorIndex: 0,
            opacity: 0,
            age: 0,
            layer: 0,
            clusterSeed: -1,
            gradientIndex: 0,
          })),
      )

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x]
        const neighbors = this.getNeighbors(x, y)
        const aliveNeighbors = neighbors.filter(n => n.glyph !== GlyphType.EMPTY)
        const neighborCount = aliveNeighbors.length

        newGrid[y][x] = { ...cell }

        if (cell.glyph === GlyphType.EMPTY) {
          // Gentle birth rules - standard Conway with slight variations
          const shouldBirth = neighborCount === 3 || (neighborCount === 2 && this.rng() < 0.1)
          
          if (shouldBirth) {
            const dominantGlyph = this.getDominantGlyph(aliveNeighbors)
            if (dominantGlyph) {
              // Low mutation rate for gentle chaos (2%)
              if (this.rng() < 0.02) {
                newGrid[y][x].glyph = this.params.truffleMode && this.rng() < 0.05 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1
                newGrid[y][x].colorIndex = Math.floor(this.rng() * 12)
              } else {
                newGrid[y][x].glyph = this.params.truffleMode && this.rng() < 0.05 ? GlyphType.TRUFFLE : dominantGlyph.glyph
                newGrid[y][x].colorIndex = dominantGlyph.colorIndex
              }
              newGrid[y][x].opacity = 0.6
              newGrid[y][x].age = 0
              newGrid[y][x].layer = Math.floor(this.rng() * 3)
              newGrid[y][x].clusterSeed = dominantGlyph.clusterSeed
              newGrid[y][x].gradientIndex = Math.floor(this.rng() * 6)
            }
          }
        } else {
          // Gentle survival - standard Conway rules
          const survives = neighborCount === 2 || neighborCount === 3
          
          if (survives) {
            newGrid[y][x].opacity = Math.min(1, newGrid[y][x].opacity * 1.01)
          } else {
            newGrid[y][x].opacity *= 0.92
          }

          if (newGrid[y][x].opacity < 0.1) {
            newGrid[y][x].glyph = GlyphType.EMPTY
            newGrid[y][x].opacity = 0
          }
        }
      }
    }

    this.grid = newGrid
  }

  private updateRhythmicChaos() {
    const newGrid: Cell[][] = Array(this.gridHeight)
      .fill(null)
      .map(() =>
        Array(this.gridWidth)
          .fill(null)
          .map(() => ({
            glyph: GlyphType.EMPTY,
            colorIndex: 0,
            opacity: 0,
            age: 0,
            layer: 0,
            clusterSeed: -1,
            gradientIndex: 0,
          })),
      )

    // Rhythmic pulse - changes every 30 ticks
    const pulsePhase = Math.floor(this.tick / 30) % 3
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x]
        const neighbors = this.getNeighbors(x, y)
        const aliveNeighbors = neighbors.filter(n => n.glyph !== GlyphType.EMPTY)
        const neighborCount = aliveNeighbors.length

        newGrid[y][x] = { ...cell }

        if (cell.glyph === GlyphType.EMPTY) {
          // Rhythmic birth rules change with pulse
          let shouldBirth = false
          if (pulsePhase === 0) {
            // Conservative phase
            shouldBirth = neighborCount === 3
          } else if (pulsePhase === 1) {
            // Active phase
            shouldBirth = neighborCount === 2 || neighborCount === 3 || neighborCount === 4
          } else {
            // Chaotic phase
            shouldBirth = neighborCount >= 2 && neighborCount <= 5 && this.rng() < 0.7
          }
          
          if (shouldBirth) {
            const dominantGlyph = this.getDominantGlyph(aliveNeighbors)
            if (dominantGlyph) {
              // Rhythmic mutation rate varies with pulse
              const mutationRate = pulsePhase === 2 ? 0.08 : 0.03
              
              if (this.rng() < mutationRate) {
                newGrid[y][x].glyph = this.params.truffleMode && this.rng() < 0.07 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1
                newGrid[y][x].colorIndex = Math.floor(this.rng() * 12)
              } else {
                newGrid[y][x].glyph = this.params.truffleMode && this.rng() < 0.07 ? GlyphType.TRUFFLE : dominantGlyph.glyph
                newGrid[y][x].colorIndex = dominantGlyph.colorIndex
              }
              newGrid[y][x].opacity = 0.5 + (pulsePhase * 0.2)
              newGrid[y][x].age = 0
              newGrid[y][x].layer = Math.floor(this.rng() * 3)
              newGrid[y][x].clusterSeed = dominantGlyph.clusterSeed
              newGrid[y][x].gradientIndex = Math.floor(this.rng() * 6)
            }
          }
        } else {
          // Rhythmic survival rules
          let survives = false
          if (pulsePhase === 0) {
            survives = neighborCount === 2 || neighborCount === 3
          } else if (pulsePhase === 1) {
            survives = neighborCount >= 1 && neighborCount <= 4
          } else {
            survives = neighborCount >= 1 && neighborCount <= 6
          }
          
          if (survives) {
            newGrid[y][x].opacity = Math.min(1, newGrid[y][x].opacity * 1.02)
          } else {
            newGrid[y][x].opacity *= (pulsePhase === 2 ? 0.85 : 0.9)
          }

          const clearThreshold = pulsePhase === 2 ? 0.15 : 0.08
          if (newGrid[y][x].opacity < clearThreshold) {
            newGrid[y][x].glyph = GlyphType.EMPTY
            newGrid[y][x].opacity = 0
          }
        }
      }
    }

    this.grid = newGrid
  }

  private updateEmergentComplexity() {
    const newGrid: Cell[][] = Array(this.gridHeight)
      .fill(null)
      .map(() =>
        Array(this.gridWidth)
          .fill(null)
          .map(() => ({
            glyph: GlyphType.EMPTY,
            colorIndex: 0,
            opacity: 0,
            age: 0,
            layer: 0,
            clusterSeed: -1,
            gradientIndex: 0,
          })),
      )

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x]
        const neighbors = this.getNeighbors(x, y)
        const aliveNeighbors = neighbors.filter(n => n.glyph !== GlyphType.EMPTY && n.layer === cell.layer)
        const neighborCount = aliveNeighbors.length

        newGrid[y][x] = { ...cell }

        if (cell.glyph === GlyphType.EMPTY) {
          // Layer-specific birth rules based on Conway variants
          let shouldBirth = false
          
          if (cell.layer === 0) {
            // Background layer: Classic Conway's birth rule
            shouldBirth = neighborCount === 3
          } else if (cell.layer === 1) {
            // Middle layer: More permissive birth
            shouldBirth = neighborCount === 3 || (neighborCount === 2 && this.rng() < 0.2)
          } else {
            // Front layer: Day & Night rules - birth on even numbers
            shouldBirth = neighborCount === 2 || neighborCount === 4 || neighborCount === 6
          }
          
          if (shouldBirth) {
            const dominantGlyph = this.getDominantGlyph(aliveNeighbors)
            if (dominantGlyph) {
              // Minimal mutation during birth (3% chance)
              if (this.rng() < 0.03) {
                newGrid[y][x].glyph = this.params.truffleMode && this.rng() < 0.06 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1
                newGrid[y][x].colorIndex = Math.floor(this.rng() * 12)
              } else {
                newGrid[y][x].glyph = this.params.truffleMode && this.rng() < 0.06 ? GlyphType.TRUFFLE : dominantGlyph.glyph
                newGrid[y][x].colorIndex = dominantGlyph.colorIndex
              }
              newGrid[y][x].opacity = 0.5
              newGrid[y][x].age = 0
              newGrid[y][x].layer = dominantGlyph.layer
              newGrid[y][x].clusterSeed = dominantGlyph.clusterSeed
              newGrid[y][x].gradientIndex = Math.floor(this.rng() * 6)
            }
          }
        } else {
          // Layer-specific survival rules
          let survives = false
          
          if (cell.layer === 0) {
            // Background layer: Classic Conway survival
            survives = neighborCount === 2 || neighborCount === 3
          } else if (cell.layer === 1) {
            // Middle layer: More flexible survival
            survives = neighborCount >= 2 && neighborCount <= 4
          } else {
            // Front layer: Day & Night survival - odd numbers
            survives = neighborCount === 1 || neighborCount === 3 || neighborCount === 5
          }
          
          if (survives) {
            newGrid[y][x].opacity = Math.min(1, newGrid[y][x].opacity * 1.02)
          } else {
            newGrid[y][x].opacity *= 0.9
          }

          // Standard clearing threshold
          if (newGrid[y][x].opacity < 0.05) {
            newGrid[y][x].glyph = GlyphType.EMPTY
            newGrid[y][x].opacity = 0
          }
        }
      }
    }

    this.grid = newGrid
  }

  private getNeighbors(x: number, y: number): Cell[] {
    const neighbors: Cell[] = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
          neighbors.push(this.grid[ny][nx])
        }
      }
    }
    return neighbors
  }

  private getDominantGlyph(cells: Cell[]): Cell | null {
    if (cells.length === 0) return null
    
    const glyphCounts = new Map<GlyphType, number>()
    for (const cell of cells) {
      glyphCounts.set(cell.glyph, (glyphCounts.get(cell.glyph) || 0) + 1)
    }
    
    let maxCount = 0
    let dominantGlyph: Cell | null = null
    for (const cell of cells) {
      const count = glyphCounts.get(cell.glyph) || 0
      if (count > maxCount) {
        maxCount = count
        dominantGlyph = cell
      }
    }
    
    return dominantGlyph
  }

  private updateClusters() {
    for (const cluster of this.clusters) {
      if (cluster.currentRadius < cluster.maxRadius) {
        cluster.currentRadius += cluster.growthRate

        const radius = Math.floor(cluster.currentRadius)
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist <= radius) {
              const nx = cluster.x + dx
              const ny = cluster.y + dy

              if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
                const cell = this.grid[ny][nx]
                
                if (cell.glyph === GlyphType.EMPTY && this.rng() < 0.3 / (dist + 1)) {
                  cell.glyph = this.params.truffleMode && this.rng() < 0.07 ? GlyphType.TRUFFLE : cluster.glyphType
                  cell.colorIndex = cluster.colorIndex + Math.floor(this.rng() * 3) - 1
                  cell.opacity = Math.max(0.3, 1 - dist * 0.1)
                  cell.age = 0
                  cell.layer = cluster.layer
                  cell.clusterSeed = cluster.id
                  cell.gradientIndex = Math.floor(this.rng() * 6)
                }
              }
            }
          }
        }
      }
    }
  }

  private updateAgents() {
    for (const agent of this.agents) {
      // Gentle random walk for natural movement
      agent.vx += (this.rng() - 0.5) * 0.2
      agent.vy += (this.rng() - 0.5) * 0.2

      // Attraction to truffle glyphs for emergent behavior
      if (this.params.truffleMode) {
        const attractionForce = this.calculateTruffleAttraction(agent)
        agent.vx += attractionForce.x * 0.1
        agent.vy += attractionForce.y * 0.1
      }

      // Natural damping
      agent.vx *= 0.95
      agent.vy *= 0.95

      // Reasonable speed limit
      const speed = Math.sqrt(agent.vx * agent.vx + agent.vy * agent.vy)
      if (speed > 1.5) {
        agent.vx = (agent.vx / speed) * 1.5
        agent.vy = (agent.vy / speed) * 1.5
      }

      // Update position
      agent.x += agent.vx
      agent.y += agent.vy

      // Wrap around edges
      if (agent.x < 0) agent.x = this.gridWidth - 1
      if (agent.x >= this.gridWidth) agent.x = 0
      if (agent.y < 0) agent.y = this.gridHeight - 1
      if (agent.y >= this.gridHeight) agent.y = 0

      // Energy regeneration
      agent.energy = Math.min(100, agent.energy + 0.5)

      // Drop glyphs
      if (agent.energy > 20 && this.tick - agent.lastDrop > 5) {
        const gx = Math.floor(agent.x)
        const gy = Math.floor(agent.y)

        if (gx >= 0 && gx < this.gridWidth && gy >= 0 && gy < this.gridHeight) {
          const cell = this.grid[gy][gx]

          if (cell.glyph === GlyphType.EMPTY || (cell.opacity < 0.3 && this.rng() < 0.3)) {
            cell.glyph = this.params.truffleMode && this.rng() < 0.06 ? GlyphType.TRUFFLE : agent.glyphType
            cell.colorIndex = Math.floor(this.rng() * 12)
            cell.opacity = Math.min(1, cell.opacity + 0.5)
            cell.age = 0
            cell.layer = agent.layer
            cell.clusterSeed = agent.clusterSeed
            cell.gradientIndex = Math.floor(this.rng() * 6)

            agent.energy -= 20
            agent.lastDrop = this.tick

            // Minimal mutations for emergent complexity
            if (this.rng() < 0.05) {
              agent.glyphType = this.params.truffleMode && this.rng() < 0.08 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1
            }
          }
        }
      }
    }
  }

  private calculateTruffleAttraction(agent: Agent): { x: number; y: number } {
    let totalForceX = 0
    let totalForceY = 0
    let truffleCount = 0

    // Look for truffle glyphs within attraction radius
    const radius = 8
    const startX = Math.max(0, Math.floor(agent.x - radius))
    const endX = Math.min(this.gridWidth, Math.floor(agent.x + radius))
    const startY = Math.max(0, Math.floor(agent.y - radius))
    const endY = Math.min(this.gridHeight, Math.floor(agent.y + radius))

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cell = this.grid[y][x]
        if (cell.glyph === GlyphType.TRUFFLE) {
          const dx = x - agent.x
          const dy = y - agent.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance > 0 && distance <= radius) {
            // Attraction force inversely proportional to distance
            const force = (1 / (distance + 1)) * cell.opacity
            totalForceX += (dx / distance) * force
            totalForceY += (dy / distance) * force
            truffleCount++
          }
        }
      }
    }

    // Normalize and return
    if (truffleCount > 0) {
      return {
        x: totalForceX / truffleCount,
        y: totalForceY / truffleCount
      }
    }
    return { x: 0, y: 0 }
  }

  private updateAging() {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x]
        if (cell.glyph !== GlyphType.EMPTY) {
          cell.age++

          // Apply decay
          if (this.rng() < this.params.decayRate) {
            cell.opacity *= 0.98

            if (cell.opacity < 0.05) {
              cell.glyph = GlyphType.EMPTY
              cell.opacity = 0
              cell.age = 0
              cell.layer = 0
              cell.clusterSeed = -1
            }
          }
        }
      }
    }
  }

  private addOverlay() {
    const x = Math.floor(this.rng() * this.gridWidth)
    const y = Math.floor(this.rng() * this.gridHeight)
    const cell = this.grid[y][x]

    // Gentle overlay - only on empty cells
    if (cell.glyph === GlyphType.EMPTY) {
      cell.glyph = this.params.truffleMode && this.rng() < 0.05 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1
      cell.colorIndex = Math.floor(this.rng() * 12)
      cell.opacity = 0.3 + this.rng() * 0.4
      cell.age = 0
      cell.layer = Math.floor(this.rng() * 3)
      cell.clusterSeed = -1
      cell.gradientIndex = Math.floor(this.rng() * 6)
    }
  }

  private propagateCascadeEffects() {
    // Find active cells and propagate changes organically
    const activeCells: { x: number; y: number; age: number }[] = []
    
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x]
        if (cell.glyph !== GlyphType.EMPTY && cell.age > 50) {
          activeCells.push({ x, y, age: cell.age })
        }
      }
    }
    
    // Sort by age - older cells have more influence
    activeCells.sort((a, b) => b.age - a.age)
    
    // Propagate from most influential cells
    const numCascades = Math.min(3, activeCells.length)
    for (let i = 0; i < numCascades; i++) {
      const source = activeCells[i]
      const sourceCell = this.grid[source.y][source.x]
      
      // Influence nearby empty cells
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          const x = source.x + dx
          const y = source.y + dy
          
          if (x >= 0 && x < this.gridWidth && y >= 0 && y < this.gridHeight) {
            const cell = this.grid[y][x]
            const distance = Math.sqrt(dx * dx + dy * dy)
            
            if (cell.glyph === GlyphType.EMPTY && this.rng() < 0.1 / (distance + 1)) {
              // Cascade effect - copy characteristics with slight variation
              cell.glyph = sourceCell.glyph
              cell.colorIndex = (sourceCell.colorIndex + Math.floor(this.rng() * 3) - 1 + 12) % 12
              cell.opacity = 0.2 + this.rng() * 0.3
              cell.age = 0
              cell.layer = sourceCell.layer
              cell.clusterSeed = sourceCell.clusterSeed
              cell.gradientIndex = Math.floor(this.rng() * 6)
            }
          }
        }
      }
    }
  }

  public render() {
    // Use truffle palette if in truffle mode, otherwise use regular palette
    const palette = this.params.truffleMode 
      ? (TRUFFLE_PALETTES as any)[this.params.trufflePalette] 
      : (PALETTES as any)[this.params.palette]

    if (!palette) {
      console.error(`[v0] Palette not found, using default`)
      const defaultPalette = this.params.truffleMode 
        ? TRUFFLE_PALETTES["State Blue"] 
        : PALETTES["Warm Sunset"]
      this.ctx.fillStyle = defaultPalette.background
      this.ctx.fillRect(0, 0, this.width, this.height)
      return
    }

    // Update cell size based on current zoom
    this.cellSize = this.baseCellSize * this.params.zoom

    this.ctx.fillStyle = palette.background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // Calculate pan offset in pixels
    const panOffsetX = this.params.panX
    const panOffsetY = this.params.panY
    
    // Calculate which grid cells are visible in the viewport
    const startX = Math.max(0, Math.floor(-panOffsetX / this.cellSize))
    const endX = Math.min(this.gridWidth, Math.ceil((this.width - panOffsetX) / this.cellSize))
    const startY = Math.max(0, Math.floor(-panOffsetY / this.cellSize))
    const endY = Math.min(this.gridHeight, Math.ceil((this.height - panOffsetY) / this.cellSize))
    
    // Render by layers (only visible cells for performance)
    for (let layer = 0; layer < 3; layer++) {
      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          if (y < this.gridHeight && x < this.gridWidth) {
            const cell = this.grid[y][x]
            if (cell.glyph !== GlyphType.EMPTY && cell.opacity > 0 && cell.layer === layer) {
              this.renderGlyph(x, y, cell, palette, panOffsetX, panOffsetY)
            }
          }
        }
      }
    }
  }

  private renderGlyph(x: number, y: number, cell: Cell, palette: any, panOffsetX: number, panOffsetY: number) {
    // Calculate pixel position with pan offset
    const px = x * this.cellSize + panOffsetX
    const py = y * this.cellSize + panOffsetY
    const size = this.cellSize

    this.ctx.save()
    this.ctx.translate(px + size / 2, py + size / 2)
    this.ctx.globalAlpha = cell.opacity

    const halfSize = size / 2

    // Handle truffle rendering with gradients
    if (cell.glyph === GlyphType.TRUFFLE && this.params.truffleMode) {
      this.renderTruffle(halfSize, cell, palette)
    } else {
      // Regular glyph rendering
      const color = palette.colors ? palette.colors[cell.colorIndex % palette.colors.length] : "#ffffff"
      this.ctx.fillStyle = color
      this.ctx.strokeStyle = color
      this.ctx.lineWidth = Math.max(1, 2 * this.params.zoom) // Scale line width with zoom

      switch (cell.glyph) {
      case GlyphType.GRID:
        this.ctx.fillRect(-halfSize * 0.8, -halfSize * 0.8, size * 0.8, size * 0.8)
        break

      case GlyphType.DOT:
        this.ctx.beginPath()
        this.ctx.arc(0, 0, halfSize * 0.6, 0, Math.PI * 2)
        this.ctx.fill()
        break

      case GlyphType.CROSS:
        this.ctx.fillRect(-halfSize * 0.1, -halfSize * 0.8, halfSize * 0.2, size * 0.8)
        this.ctx.fillRect(-halfSize * 0.8, -halfSize * 0.1, size * 0.8, halfSize * 0.2)
        break

      case GlyphType.STRIPE:
        for (let i = -halfSize; i < halfSize; i += 6) {
          this.ctx.fillRect(i, -halfSize * 0.8, 3, size * 0.8)
        }
        break

      case GlyphType.RING:
        this.ctx.beginPath()
        this.ctx.arc(0, 0, halfSize * 0.7, 0, Math.PI * 2)
        this.ctx.stroke()
        break

      case GlyphType.HATCH:
        for (let i = -halfSize; i < halfSize; i += 6) {
          this.ctx.fillRect(i, -halfSize * 0.8, 2, size * 0.8)
        }
        break
      }
    }

    this.ctx.restore()
  }

  private renderTruffle(halfSize: number, cell: Cell, palette: any) {
    // Get gradient colors from the truffle palette
    if (!palette.gradients || palette.gradients.length === 0) return
    
    const gradientPair = palette.gradients[cell.gradientIndex % palette.gradients.length]
    const [color1, color2] = gradientPair
    
    // Create radial gradient for 3D depth effect
    const gradient = this.ctx.createRadialGradient(
      -halfSize * 0.3, -halfSize * 0.3, 0,  // Inner circle (highlight position)
      0, 0, halfSize * 0.9  // Outer circle
    )
    
    gradient.addColorStop(0, color1)      // Light color at center
    gradient.addColorStop(0.7, color2)   // Transition
    gradient.addColorStop(1, this.darkenColor(color2, 0.3)) // Darker edge
    
    // Set higher resolution for smoother edges
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    
    // Create the truffle shape (rounded square)
    const cornerRadius = halfSize * 0.4 // 40% corner radius for puffy look
    const width = halfSize * 1.6
    const height = halfSize * 1.6
    
    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    
    // Create rounded rectangle path
    this.ctx.moveTo(-width/2 + cornerRadius, -height/2)
    this.ctx.lineTo(width/2 - cornerRadius, -height/2)
    this.ctx.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + cornerRadius)
    this.ctx.lineTo(width/2, height/2 - cornerRadius)
    this.ctx.quadraticCurveTo(width/2, height/2, width/2 - cornerRadius, height/2)
    this.ctx.lineTo(-width/2 + cornerRadius, height/2)
    this.ctx.quadraticCurveTo(-width/2, height/2, -width/2, height/2 - cornerRadius)
    this.ctx.lineTo(-width/2, -height/2 + cornerRadius)
    this.ctx.quadraticCurveTo(-width/2, -height/2, -width/2 + cornerRadius, -height/2)
    this.ctx.closePath()
    
    this.ctx.fill()
    
    // Add subtle inner glow/highlight
    this.ctx.shadowColor = color1
    this.ctx.shadowBlur = halfSize * 0.3
    this.ctx.shadowOffsetX = -halfSize * 0.1
    this.ctx.shadowOffsetY = -halfSize * 0.1
    this.ctx.fill()
    
    // Reset shadow
    this.ctx.shadowColor = 'transparent'
    this.ctx.shadowBlur = 0
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0
  }
  
  private darkenColor(hex: string, factor: number): string {
    // Remove # if present
    hex = hex.replace('#', '')
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    
    // Darken each component
    const darkR = Math.round(r * (1 - factor))
    const darkG = Math.round(g * (1 - factor))
    const darkB = Math.round(b * (1 - factor))
    
    // Convert back to hex
    return `#${darkR.toString(16).padStart(2, '0')}${darkG.toString(16).padStart(2, '0')}${darkB.toString(16).padStart(2, '0')}`
  }

  public updateParameters(newParams: Partial<EngineParams>) {
    const oldZoom = this.params.zoom
    Object.assign(this.params, newParams)

    // If zoom changed, recalculate cell size and grid dimensions
    if (newParams.zoom !== undefined && newParams.zoom !== oldZoom) {
      this.cellSize = this.baseCellSize * this.params.zoom
      // Note: We don't recreate the grid when zoom changes, just render differently
    }

    if (newParams.agentCount !== undefined) {
      this.initializeAgents()
    }

    if (newParams.density !== undefined && newParams.density > this.params.density) {
      const additionalClusters = Math.floor((newParams.density - this.params.density) * 5)
      for (let i = 0; i < additionalClusters; i++) {
        this.addRandomCluster()
      }
    }
  }

  private addRandomCluster() {
    const cluster: ClusterSeed = {
      x: Math.floor(this.rng() * this.gridWidth),
      y: Math.floor(this.rng() * this.gridHeight),
      glyphType: this.params.truffleMode && this.rng() < 0.05 ? GlyphType.TRUFFLE : Math.floor(this.rng() * 6) + 1,
      colorIndex: Math.floor(this.rng() * 12),
      layer: Math.floor(this.rng() * 3),
      maxRadius: 5 + Math.floor(this.rng() * 10),
      currentRadius: 1,
      growthRate: 0.1 + this.rng() * 0.3,
      id: this.nextClusterId++,
    }

    this.clusters.push(cluster)

    if (cluster.x >= 0 && cluster.x < this.gridWidth && cluster.y >= 0 && cluster.y < this.gridHeight) {
      const cell = this.grid[cluster.y][cluster.x]
      cell.glyph = cluster.glyphType
      cell.colorIndex = cluster.colorIndex
      cell.opacity = 0.8
      cell.layer = cluster.layer
      cell.clusterSeed = cluster.id
      cell.gradientIndex = Math.floor(this.rng() * 6)
    }
  }
}