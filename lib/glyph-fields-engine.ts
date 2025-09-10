import { PALETTES } from "./glyph-fields-config"

export interface EngineParams {
  seed: number
  density: number
  agentCount: number
  decayRate: number
  overlayRate: number
  palette: string
}

export enum GlyphType {
  EMPTY = 0,
  GRID = 1, // rectangular grid tiles
  DOT = 2, // circular dots
  CROSS = 3, // plus symbols
  STRIPE = 4, // vertical stripes
  RING = 5, // hollow circles
  HATCH = 6, // diagonal hatching
}

interface Cell {
  glyph: GlyphType
  colorIndex: number
  opacity: number
  age: number
  layer: number
  clusterSeed: number // Added cluster identification
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
  private cellSize: number
  private gridWidth: number
  private gridHeight: number

  private grid: Cell[][]
  private agents: Agent[]
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
    this.cellSize = 24
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
          glyphType: Math.floor(this.rng() * 6) + 1,
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
        glyphType: Math.floor(this.rng() * 6) + 1,
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
      }
    }
  }

  public update() {
    this.tick++

    this.updateCellularAutomaton()
    this.updateClusters()
    this.updateAgents()

    if (this.rng() < this.params.overlayRate) {
      this.addOverlay()
    }

    this.updateAging()
  }

  private updateCellularAutomaton() {
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
          // Birth rule: empty cells can spawn new glyphs based on neighbors
          if (neighborCount === 3 || (neighborCount === 2 && this.rng() < 0.1)) {
            const dominantGlyph = this.getDominantGlyph(aliveNeighbors)
            if (dominantGlyph) {
              newGrid[y][x].glyph = dominantGlyph.glyph
              newGrid[y][x].colorIndex = dominantGlyph.colorIndex
              newGrid[y][x].opacity = 0.3
              newGrid[y][x].age = 0
              newGrid[y][x].layer = dominantGlyph.layer
              newGrid[y][x].clusterSeed = dominantGlyph.clusterSeed
            }
          }
        } else {
          // Survival rules based on layer
          if (cell.layer === 0) {
            // Background layer: stable, slower decay
            if (neighborCount < 2 || neighborCount > 6) {
              newGrid[y][x].opacity *= 0.95
            } else {
              newGrid[y][x].opacity = Math.min(1, newGrid[y][x].opacity * 1.02)
            }
          } else if (cell.layer === 1) {
            // Middle layer: standard Conway's rules
            if (neighborCount < 2 || neighborCount > 3) {
              newGrid[y][x].opacity *= 0.9
            }
          } else {
            // Front layer: more chaotic
            if (neighborCount < 1 || neighborCount > 4) {
              newGrid[y][x].opacity *= 0.85
            }
          }

          // Clear cells that are too faint
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
                  cell.glyph = cluster.glyphType
                  cell.colorIndex = cluster.colorIndex + Math.floor(this.rng() * 3) - 1
                  cell.opacity = Math.max(0.3, 1 - dist * 0.1)
                  cell.age = 0
                  cell.layer = cluster.layer
                  cell.clusterSeed = cluster.id
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
      // Update velocity with random walk
      agent.vx += (this.rng() - 0.5) * 0.2
      agent.vy += (this.rng() - 0.5) * 0.2

      // Damping
      agent.vx *= 0.98
      agent.vy *= 0.98

      // Speed limit
      const speed = Math.sqrt(agent.vx * agent.vx + agent.vy * agent.vy)
      if (speed > 1) {
        agent.vx = (agent.vx / speed) * 1
        agent.vy = (agent.vy / speed) * 1
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
            cell.glyph = agent.glyphType
            cell.colorIndex = Math.floor(this.rng() * 12)
            cell.opacity = Math.min(1, cell.opacity + 0.5)
            cell.age = 0
            cell.layer = agent.layer
            cell.clusterSeed = agent.clusterSeed

            agent.energy -= 20
            agent.lastDrop = this.tick

            // Randomly change glyph type occasionally
            if (this.rng() < 0.1) {
              agent.glyphType = Math.floor(this.rng() * 6) + 1
            }
          }
        }
      }
    }
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

    if (cell.glyph === GlyphType.EMPTY) {
      cell.glyph = Math.floor(this.rng() * 6) + 1
      cell.colorIndex = Math.floor(this.rng() * 12)
      cell.opacity = 0.2 + this.rng() * 0.3
      cell.age = 0
      cell.layer = Math.floor(this.rng() * 3)
      cell.clusterSeed = -1
    }
  }

  public render() {
    const palette = PALETTES[this.params.palette]

    if (!palette) {
      console.error(`[v0] Palette "${this.params.palette}" not found, using default`)
      const defaultPalette = PALETTES["Warm Sunset"]
      this.ctx.fillStyle = defaultPalette.background
      this.ctx.fillRect(0, 0, this.width, this.height)
      return
    }

    this.ctx.fillStyle = palette.background
    this.ctx.fillRect(0, 0, this.width, this.height)
    
    // Render by layers
    for (let layer = 0; layer < 3; layer++) {
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridWidth; x++) {
          const cell = this.grid[y][x]
          if (cell.glyph !== GlyphType.EMPTY && cell.opacity > 0 && cell.layer === layer) {
            this.renderGlyph(x, y, cell, palette)
          }
        }
      }
    }
  }

  private renderGlyph(x: number, y: number, cell: Cell, palette: any) {
    const px = x * this.cellSize
    const py = y * this.cellSize
    const size = this.cellSize
    const color = palette.colors[cell.colorIndex % palette.colors.length]

    this.ctx.save()
    this.ctx.translate(px + size / 2, py + size / 2)
    this.ctx.globalAlpha = cell.opacity
    
    this.ctx.fillStyle = color
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 2

    const halfSize = size / 2

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

    this.ctx.restore()
  }

  public updateParameters(newParams: Partial<EngineParams>) {
    Object.assign(this.params, newParams)

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
      glyphType: Math.floor(this.rng() * 6) + 1,
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
    }
  }
}