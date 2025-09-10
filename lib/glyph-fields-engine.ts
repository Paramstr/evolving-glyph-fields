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
  private clusters: ClusterSeed[] // Added cluster tracking
  private nextClusterId: number

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, params: EngineParams) {
    this.canvas = canvas
    this.ctx = ctx
    this.width = canvas.width
    this.height = canvas.height
    this.cellSize = 24 // Increased cell size for larger, more substantial glyphs
    this.gridWidth = Math.floor(this.width / this.cellSize)
    this.gridHeight = Math.floor(this.height / this.cellSize)
    this.params = params
    this.tick = 0
    this.clusters = []
    this.nextClusterId = 0

    this.rng = this.createSeededRNG(params.seed)

    this.initializeGrid()
    this.initializeAgents()
    this.seedInitialClusters() // Changed from random seeding to cluster seeding
  }

  public resize(width: number, height: number) {
    this.width = width
    this.height = height
    this.canvas.width = width
    this.canvas.height = height

    const newGridWidth = Math.floor(this.width / this.cellSize)
    const newGridHeight = Math.floor(this.height / this.cellSize)

    // Only reinitialize if grid dimensions actually changed
    if (newGridWidth !== this.gridWidth || newGridHeight !== this.gridHeight) {
      this.gridWidth = newGridWidth
      this.gridHeight = newGridHeight

      // Preserve existing grid data where possible
      const oldGrid = this.grid
      this.initializeGrid()

      // Copy over existing cells that still fit
      for (let y = 0; y < Math.min(oldGrid.length, this.gridHeight); y++) {
        for (let x = 0; x < Math.min(oldGrid[0].length, this.gridWidth); x++) {
          this.grid[y][x] = oldGrid[y][x]
        }
      }

      // Update agent positions to stay within bounds
      for (const agent of this.agents) {
        agent.x = Math.min(agent.x, this.gridWidth - 1)
        agent.y = Math.min(agent.y, this.gridHeight - 1)
      }

      // Update cluster positions
      for (const cluster of this.clusters) {
        cluster.x = Math.min(cluster.x, this.gridWidth - 1)
        cluster.y = Math.min(cluster.y, this.gridHeight - 1)
      }
    }
  }

  private createSeededRNG(seed: number): () => number {
    let state = seed
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296
      return state / 4294967296
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
            clusterSeed: -1, // Added cluster tracking
          })),
      )
  }

  private initializeAgents() {
    this.agents = Array(this.params.agentCount)
      .fill(null)
      .map(() => ({
        x: this.rng() * this.gridWidth,
        y: this.rng() * this.gridHeight,
        vx: (this.rng() - 0.5) * 0.5,
        vy: (this.rng() - 0.5) * 0.5,
        energy: 100,
        lastDrop: 0,
        layer: Math.floor(this.rng() * 3),
        glyphType: Math.floor(this.rng() * 6) + 1,
        clusterSeed: -1,
      }))
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
        maxRadius: 8 + Math.floor(this.rng() * 15),
        currentRadius: 1,
        growthRate: 0.1 + this.rng() * 0.3,
        id: this.nextClusterId++,
      }

      this.clusters.push(cluster)

      // Seed initial cell
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

    this.updateCellularAutomaton() // Added Game of Life cellular automaton rules for each layer
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

    // Apply cellular automaton rules for each layer
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const cell = this.grid[y][x]
        const newCell = newGrid[y][x]

        // Copy existing cell
        Object.assign(newCell, cell)

        if (cell.glyph !== GlyphType.EMPTY) {
          const neighbors = this.getNeighbors(x, y)
          const aliveNeighbors = neighbors.filter((n) => n.glyph !== GlyphType.EMPTY && n.layer === cell.layer)
          const neighborCount = aliveNeighbors.length

          // Layer-specific Game of Life rules
          switch (cell.layer) {
            case 0: // Back layer - most conservative, dense formations
              if (neighborCount < 2) {
                // Dies from isolation (slower than classic GoL)
                if (this.rng() < 0.1) {
                  newCell.opacity *= 0.9
                  if (newCell.opacity < 0.2) {
                    newCell.glyph = GlyphType.EMPTY
                    newCell.opacity = 0
                  }
                }
              } else if (neighborCount >= 2 && neighborCount <= 4) {
                // Survives - strengthen
                newCell.opacity = Math.min(1.0, newCell.opacity * 1.02)
              } else if (neighborCount > 6) {
                // Dies from overcrowding
                if (this.rng() < 0.05) {
                  newCell.opacity *= 0.95
                }
              }
              break

            case 1: // Middle layer - moderate activity
              if (neighborCount < 2) {
                // Dies from isolation
                if (this.rng() < 0.2) {
                  newCell.opacity *= 0.85
                  if (newCell.opacity < 0.3) {
                    newCell.glyph = GlyphType.EMPTY
                    newCell.opacity = 0
                  }
                }
              } else if (neighborCount >= 2 && neighborCount <= 3) {
                // Survives
                newCell.opacity = Math.min(0.9, newCell.opacity * 1.01)
              } else if (neighborCount > 5) {
                // Dies from overcrowding
                if (this.rng() < 0.15) {
                  newCell.opacity *= 0.9
                }
              }
              break

            case 2: // Front layer - most active, gaseous
              if (neighborCount < 1) {
                // Dies quickly from isolation
                if (this.rng() < 0.4) {
                  newCell.opacity *= 0.7
                  if (newCell.opacity < 0.4) {
                    newCell.glyph = GlyphType.EMPTY
                    newCell.opacity = 0
                  }
                }
              } else if (neighborCount >= 1 && neighborCount <= 2) {
                // Survives but fades
                newCell.opacity = Math.min(0.8, newCell.opacity * 1.005)
              } else if (neighborCount > 3) {
                // Dies from overcrowding
                if (this.rng() < 0.3) {
                  newCell.opacity *= 0.8
                }
              }
              break
          }
        } else {
          // Empty cell - check for birth
          const neighbors = this.getNeighbors(x, y)

          // Check each layer for potential birth
          for (let layer = 0; layer < 3; layer++) {
            const layerNeighbors = neighbors.filter((n) => n.glyph !== GlyphType.EMPTY && n.layer === layer)
            const layerCount = layerNeighbors.length

            let birthChance = 0
            switch (layer) {
              case 0: // Back layer - births with 3-4 neighbors
                if (layerCount >= 3 && layerCount <= 4) birthChance = 0.3
                break
              case 1: // Middle layer - births with 3 neighbors
                if (layerCount === 3) birthChance = 0.4
                break
              case 2: // Front layer - births with 2-3 neighbors
                if (layerCount >= 2 && layerCount <= 3) birthChance = 0.5
                break
            }

            if (birthChance > 0 && this.rng() < birthChance) {
              // Birth new cell - inherit properties from neighbors
              const parentNeighbor = layerNeighbors[Math.floor(this.rng() * layerNeighbors.length)]
              newCell.glyph = parentNeighbor.glyph
              newCell.colorIndex = parentNeighbor.colorIndex + Math.floor(this.rng() * 3) - 1
              newCell.colorIndex = Math.max(0, Math.min(11, newCell.colorIndex))
              newCell.layer = layer
              newCell.opacity = 0.3 + this.rng() * 0.3
              newCell.age = 0
              newCell.clusterSeed = parentNeighbor.clusterSeed
              break // Only one birth per cell per update
            }
          }
        }
      }
    }

    // Apply the new grid
    this.grid = newGrid
  }

  private updateClusters() {
    for (const cluster of this.clusters) {
      if (cluster.currentRadius < cluster.maxRadius) {
        cluster.currentRadius += cluster.growthRate

        // Grow cluster outward in organic pattern
        const growthAttempts = Math.floor(cluster.currentRadius * 2)

        for (let i = 0; i < growthAttempts; i++) {
          const angle = this.rng() * Math.PI * 2
          const distance = 1 + this.rng() * cluster.currentRadius
          const nx = Math.floor(cluster.x + Math.cos(angle) * distance)
          const ny = Math.floor(cluster.y + Math.sin(angle) * distance)

          if (nx >= 0 && nx < this.gridWidth && ny >= 0 && ny < this.gridHeight) {
            const cell = this.grid[ny][nx]

            // Only grow if empty or low opacity
            if (cell.glyph === GlyphType.EMPTY || cell.opacity < 0.3) {
              // Check if we have neighboring cluster cells for organic growth
              const neighbors = this.getNeighbors(nx, ny)
              const clusterNeighbors = neighbors.filter((n) => n.clusterSeed === cluster.id)

              if (clusterNeighbors.length > 0 || this.rng() < 0.1) {
                cell.glyph = cluster.glyphType
                cell.colorIndex = cluster.colorIndex + Math.floor(this.rng() * 3) - 1
                cell.colorIndex = Math.max(0, Math.min(11, cell.colorIndex))
                cell.opacity = 0.6 + this.rng() * 0.3
                cell.layer = cluster.layer
                cell.clusterSeed = cluster.id
              }
            }
          }
        }
      }
    }
  }

  private updateAgents() {
    for (const agent of this.agents) {
      if (agent.clusterSeed === -1 && this.clusters.length > 0) {
        // Find nearest cluster
        let nearestCluster = this.clusters[0]
        let nearestDist = Number.POSITIVE_INFINITY

        for (const cluster of this.clusters) {
          const dist = Math.sqrt((agent.x - cluster.x) ** 2 + (agent.y - cluster.y) ** 2)
          if (dist < nearestDist) {
            nearestDist = dist
            nearestCluster = cluster
          }
        }

        if (nearestDist < 20) {
          agent.clusterSeed = nearestCluster.id
          agent.glyphType = nearestCluster.glyphType
        }
      }

      // Move toward assigned cluster
      if (agent.clusterSeed !== -1) {
        const cluster = this.clusters.find((c) => c.id === agent.clusterSeed)
        if (cluster) {
          const dx = cluster.x - agent.x
          const dy = cluster.y - agent.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist > 2) {
            agent.vx += (dx / dist) * 0.1
            agent.vy += (dy / dist) * 0.1
          }
        }
      }

      agent.vx *= 0.95
      agent.vy *= 0.95

      agent.x += agent.vx
      agent.y += agent.vy

      // Wrap around edges
      if (agent.x < 0) agent.x = this.gridWidth - 1
      if (agent.x >= this.gridWidth) agent.x = 0
      if (agent.y < 0) agent.y = this.gridHeight - 1
      if (agent.y >= this.gridHeight) agent.y = 0

      if (this.tick - agent.lastDrop > 10 && this.rng() < 0.05) {
        const gx = Math.floor(agent.x)
        const gy = Math.floor(agent.y)
        const cell = this.grid[gy][gx]

        if (cell.glyph === GlyphType.EMPTY || this.rng() < 0.2) {
          cell.glyph = agent.glyphType
          cell.colorIndex = Math.floor(this.rng() * 12)
          cell.opacity = 0.4 + this.rng() * 0.4
          cell.age = 0
          cell.layer = agent.layer
          cell.clusterSeed = agent.clusterSeed
          agent.lastDrop = this.tick
        }
      }
    }
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

  private addOverlay() {
    const x = Math.floor(this.rng() * this.gridWidth)
    const y = Math.floor(this.rng() * this.gridHeight)
    const size = 3 + Math.floor(this.rng() * 8)
    const layer = Math.floor(this.rng() * 3)
    const glyphType = Math.floor(this.rng() * 6) + 1
    const colorIndex = Math.floor(this.rng() * 12)

    for (let dy = 0; dy < size; dy++) {
      for (let dx = 0; dx < size; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx < this.gridWidth && ny < this.gridHeight) {
          const cell = this.grid[ny][nx]
          if (this.rng() < 0.7) {
            cell.glyph = glyphType
            cell.colorIndex = colorIndex + Math.floor(this.rng() * 2)
            cell.opacity = 0.3 + this.rng() * 0.4
            cell.age = 0
            cell.layer = layer
            cell.clusterSeed = -1
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

          let decayMultiplier = 1.0
          switch (cell.layer) {
            case 0:
              decayMultiplier = 0.5
              break // Back layer ages slowly
            case 1:
              decayMultiplier = 1.0
              break // Middle layer normal aging
            case 2:
              decayMultiplier = 2.0
              break // Front layer ages quickly
          }

          if (this.rng() < this.params.decayRate * decayMultiplier * 0.1) {
            cell.opacity *= 0.99

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
        // Draw grid pattern like in reference
        this.ctx.fillRect(-halfSize * 0.8, -halfSize * 0.8, size * 0.8, size * 0.8)
        this.ctx.strokeStyle = palette.background
        this.ctx.lineWidth = 1
        for (let i = -halfSize * 0.6; i < halfSize * 0.6; i += 4) {
          this.ctx.beginPath()
          this.ctx.moveTo(i, -halfSize * 0.8)
          this.ctx.lineTo(i, halfSize * 0.8)
          this.ctx.stroke()
          this.ctx.beginPath()
          this.ctx.moveTo(-halfSize * 0.8, i)
          this.ctx.lineTo(halfSize * 0.8, i)
          this.ctx.stroke()
        }
        break

      case GlyphType.DOT:
        this.ctx.beginPath()
        this.ctx.arc(0, 0, halfSize * 0.6, 0, Math.PI * 2)
        this.ctx.fill()
        break

      case GlyphType.CROSS:
        this.ctx.lineWidth = 4
        this.ctx.beginPath()
        this.ctx.moveTo(-halfSize * 0.7, 0)
        this.ctx.lineTo(halfSize * 0.7, 0)
        this.ctx.moveTo(0, -halfSize * 0.7)
        this.ctx.lineTo(0, halfSize * 0.7)
        this.ctx.stroke()
        break

      case GlyphType.STRIPE:
        this.ctx.lineWidth = 3
        for (let i = -halfSize; i < halfSize; i += 3) {
          this.ctx.beginPath()
          this.ctx.moveTo(i, -halfSize)
          this.ctx.lineTo(i, halfSize)
          this.ctx.stroke()
        }
        break

      case GlyphType.RING:
        this.ctx.lineWidth = 3
        this.ctx.beginPath()
        this.ctx.arc(0, 0, halfSize * 0.6, 0, Math.PI * 2)
        this.ctx.stroke()
        break

      case GlyphType.HATCH:
        this.ctx.lineWidth = 2
        for (let i = -halfSize; i < halfSize; i += 3) {
          this.ctx.beginPath()
          this.ctx.moveTo(i, -halfSize)
          this.ctx.lineTo(i + halfSize, 0)
          this.ctx.stroke()
          this.ctx.beginPath()
          this.ctx.moveTo(i, halfSize)
          this.ctx.lineTo(i + halfSize, 0)
          this.ctx.stroke()
        }
        break
    }

    this.ctx.restore()
  }

  public updateParameters(newParams: Partial<EngineParams>) {
    console.log("[v0] Updating parameters:", newParams)

    Object.assign(this.params, newParams)

    if (newParams.agentCount !== undefined) {
      console.log("[v0] Reinitializing agents, new count:", newParams.agentCount)
      this.initializeAgents()
    }

    if (newParams.density !== undefined && newParams.density > this.params.density) {
      console.log("[v0] Density increased, adding new clusters")
      const additionalClusters = Math.floor((newParams.density - this.params.density) * 10)
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
      maxRadius: 4 + Math.floor(this.rng() * 8),
      currentRadius: 1,
      growthRate: 0.1 + this.rng() * 0.2,
      id: this.nextClusterId++,
    }

    this.clusters.push(cluster)

    // Seed initial cell
    if (cluster.x >= 0 && cluster.x < this.gridWidth && cluster.y >= 0 && cluster.y < this.gridHeight) {
      const cell = this.grid[cluster.y][cluster.x]
      cell.glyph = cluster.glyphType
      cell.colorIndex = cluster.colorIndex
      cell.opacity = 0.6
      cell.layer = cluster.layer
      cell.clusterSeed = cluster.id
    }
  }
}
