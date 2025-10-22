<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

type Coordinate = [number, number]

const COLS = 10
const ROWS = 20

const TETROMINOES = {
  I: {
    color: 'bg-cyan-400',
    rotations: [
      [
        [-1, 0],
        [0, 0],
        [1, 0],
        [2, 0]
      ],
      [
        [1, -1],
        [1, 0],
        [1, 1],
        [1, 2]
      ],
      [
        [-1, 1],
        [0, 1],
        [1, 1],
        [2, 1]
      ],
      [
        [0, -1],
        [0, 0],
        [0, 1],
        [0, 2]
      ]
    ]
  },
  J: {
    color: 'bg-blue-500',
    rotations: [
      [
        [-1, -1],
        [-1, 0],
        [0, 0],
        [1, 0]
      ],
      [
        [0, -1],
        [1, -1],
        [0, 0],
        [0, 1]
      ],
      [
        [-1, 0],
        [0, 0],
        [1, 0],
        [1, 1]
      ],
      [
        [0, -1],
        [0, 0],
        [-1, 1],
        [0, 1]
      ]
    ]
  },
  L: {
    color: 'bg-orange-400',
    rotations: [
      [
        [-1, 0],
        [0, 0],
        [1, 0],
        [1, -1]
      ],
      [
        [0, -1],
        [0, 0],
        [0, 1],
        [1, 1]
      ],
      [
        [-1, 1],
        [-1, 0],
        [0, 0],
        [1, 0]
      ],
      [
        [-1, -1],
        [0, -1],
        [0, 0],
        [0, 1]
      ]
    ]
  },
  O: {
    color: 'bg-yellow-300',
    rotations: [
      [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1]
      ]
    ]
  },
  S: {
    color: 'bg-emerald-400',
    rotations: [
      [
        [0, 0],
        [1, 0],
        [-1, 1],
        [0, 1]
      ],
      [
        [0, -1],
        [0, 0],
        [1, 0],
        [1, 1]
      ],
      [
        [0, 0],
        [1, 0],
        [-1, 1],
        [0, 1]
      ],
      [
        [0, -1],
        [0, 0],
        [1, 0],
        [1, 1]
      ]
    ]
  },
  T: {
    color: 'bg-purple-400',
    rotations: [
      [
        [-1, 0],
        [0, 0],
        [1, 0],
        [0, -1]
      ],
      [
        [0, -1],
        [0, 0],
        [0, 1],
        [1, 0]
      ],
      [
        [0, 1],
        [-1, 0],
        [0, 0],
        [1, 0]
      ],
      [
        [0, -1],
        [-1, 0],
        [0, 0],
        [0, 1]
      ]
    ]
  },
  Z: {
    color: 'bg-rose-400',
    rotations: [
      [
        [-1, 0],
        [0, 0],
        [0, 1],
        [1, 1]
      ],
      [
        [1, -1],
        [0, 0],
        [1, 0],
        [0, 1]
      ],
      [
        [-1, 0],
        [0, 0],
        [0, 1],
        [1, 1]
      ],
      [
        [1, -1],
        [0, 0],
        [1, 0],
        [0, 1]
      ]
    ]
  }
} as const

type TetrominoKey = keyof typeof TETROMINOES

interface ActivePiece {
  type: TetrominoKey
  rotation: number
  position: { x: number; y: number }
}

type Cell = {
  color: string
  ghost?: boolean
} | null

const createEmptyBoard = () => Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null))

const state = reactive({
  board: createEmptyBoard(),
  current: null as ActivePiece | null,
  ghostCells: [] as Coordinate[],
  nextQueue: [] as TetrominoKey[],
  holdPiece: null as TetrominoKey | null,
  canHold: true,
  score: 0,
  level: 1,
  lines: 0,
  isPaused: false,
  isGameOver: false
})

const isClient = ref(false)

let dropTimer: ReturnType<typeof setInterval> | null = null

const dropInterval = computed(() => Math.max(1000 - (state.level - 1) * 100, 100))

const activeCells = computed(() => {
  if (!state.current) return []
  const { type, rotation, position } = state.current
  return TETROMINOES[type].rotations[rotation].map(([x, y]) => [position.x + x, position.y + y] as Coordinate)
})

const mergedBoard = computed(() => {
  const snapshot = state.board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))

  for (const [x, y] of state.ghostCells) {
    if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
      snapshot[y][x] = { color: 'border border-dashed border-slate-500/60' }
    }
  }

  if (state.current) {
    const color = TETROMINOES[state.current.type].color
    for (const [x, y] of activeCells.value) {
      if (y >= 0 && y < ROWS && x >= 0 && x < COLS) {
        snapshot[y][x] = { color }
      }
    }
  }

  return snapshot
})

const scoreFormatted = computed(() => state.score.toLocaleString())

function generateBag(): TetrominoKey[] {
  const types = Object.keys(TETROMINOES) as TetrominoKey[]
  for (let i = types.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[types[i], types[j]] = [types[j], types[i]]
  }
  return types
}

function ensureQueue() {
  while (state.nextQueue.length < 5) {
    state.nextQueue.push(...generateBag())
  }
}

function spawnPiece() {
  ensureQueue()
  const nextType = state.nextQueue.shift()!
  ensureQueue()

  const piece: ActivePiece = {
    type: nextType,
    rotation: 0,
    position: { x: 4, y: nextType === 'I' ? 0 : -1 }
  }

  if (!isValidPosition(piece, 0, 0, piece.rotation)) {
    state.isGameOver = true
    stopTimer()
    state.ghostCells = []
    return
  }

  state.current = piece
  state.canHold = true
  updateGhost()
}

function rotatePiece(direction: 1 | -1) {
  if (!state.current || state.isPaused || state.isGameOver) return
  const { type, rotation } = state.current
  const tetromino = TETROMINOES[type]
  const newRotation = (rotation + direction + tetromino.rotations.length) % tetromino.rotations.length
  const kicks: Coordinate[] = [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1]
  ]

  for (const [kx, ky] of kicks) {
    if (isValidPosition(state.current, kx, ky, newRotation)) {
      state.current.rotation = newRotation
      state.current.position.x += kx
      state.current.position.y += ky
      updateGhost()
      return
    }
  }
}

function isValidPosition(piece: ActivePiece, offsetX: number, offsetY: number, rotation = piece.rotation) {
  const cells = TETROMINOES[piece.type].rotations[rotation]
  for (const [x, y] of cells) {
    const newX = piece.position.x + x + offsetX
    const newY = piece.position.y + y + offsetY

    if (newX < 0 || newX >= COLS || newY >= ROWS) return false
    if (newY >= 0 && state.board[newY][newX]) return false
  }
  return true
}

function movePiece(dx: number, dy: number) {
  if (!state.current || state.isPaused || state.isGameOver) return false
  if (isValidPosition(state.current, dx, dy)) {
    state.current.position.x += dx
    state.current.position.y += dy
    updateGhost()
    return true
  }
  return false
}

function hardDrop() {
  if (!state.current || state.isPaused || state.isGameOver) return
  let moved = 0
  while (movePiece(0, 1)) {
    moved += 1
  }
  if (moved > 0) {
    state.score += moved * 2
  }
  lockPiece()
}

function holdCurrentPiece() {
  if (!state.current || !state.canHold || state.isPaused || state.isGameOver) return
  if (!state.holdPiece) {
    state.holdPiece = state.current.type
    spawnPiece()
  } else {
    const temp = state.holdPiece
    state.holdPiece = state.current.type
    const swappedPiece: ActivePiece = {
      type: temp,
      rotation: 0,
      position: { x: 4, y: temp === 'I' ? 0 : -1 }
    }
    if (!isValidPosition(swappedPiece, 0, 0, swappedPiece.rotation)) {
      state.isGameOver = true
      stopTimer()
      state.current = null
      state.ghostCells = []
      return
    }
    state.current = swappedPiece
  }
  state.canHold = false
  updateGhost()
}

function tick() {
  if (!state.current || state.isPaused || state.isGameOver) return
  if (!movePiece(0, 1)) {
    lockPiece()
  }
}

function lockPiece() {
  if (!state.current) return
  const color = TETROMINOES[state.current.type].color
  for (const [x, y] of activeCells.value) {
    if (y < 0) {
      state.isGameOver = true
      stopTimer()
      state.ghostCells = []
      state.current = null
      return
    }
    state.board[y][x] = { color }
  }
  clearLines()
  state.current = null
  spawnPiece()
}

function clearLines() {
  let cleared = 0
  for (let y = ROWS - 1; y >= 0; y -= 1) {
    if (state.board[y].every((cell) => cell !== null)) {
      state.board.splice(y, 1)
      state.board.unshift(Array<Cell>(COLS).fill(null))
      cleared += 1
      y += 1
    }
  }
  if (cleared > 0) {
    state.lines += cleared
    const lineScores = [0, 100, 300, 500, 800]
    state.score += lineScores[cleared] * state.level
    state.level = Math.floor(state.lines / 10) + 1
  }
}

function updateGhost() {
  if (!state.current) {
    state.ghostCells = []
    return
  }
  const ghostPiece: ActivePiece = {
    type: state.current.type,
    rotation: state.current.rotation,
    position: { ...state.current.position }
  }
  while (isValidPosition(ghostPiece, 0, 1)) {
    ghostPiece.position.y += 1
  }
  state.ghostCells = TETROMINOES[ghostPiece.type].rotations[ghostPiece.rotation].map(([x, y]) => [ghostPiece.position.x + x, ghostPiece.position.y + y])
}

function softDrop() {
  if (!state.current || state.isPaused || state.isGameOver) return
  if (movePiece(0, 1)) {
    state.score += 1
  }
}

function togglePause() {
  if (state.isGameOver) return
  state.isPaused = !state.isPaused
  if (state.isPaused) {
    stopTimer()
  } else {
    startTimer()
  }
}

function resetGame() {
  state.board = createEmptyBoard()
  state.current = null
  state.ghostCells = []
  state.nextQueue = []
  state.holdPiece = null
  state.canHold = true
  state.score = 0
  state.level = 1
  state.lines = 0
  state.isPaused = false
  state.isGameOver = false
  ensureQueue()
  spawnPiece()
  startTimer()
}

function handleKeydown(event: KeyboardEvent) {
  if (!state.current) return
  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      movePiece(-1, 0)
      break
    case 'ArrowRight':
      event.preventDefault()
      movePiece(1, 0)
      break
    case 'ArrowDown':
      event.preventDefault()
      softDrop()
      break
    case 'ArrowUp':
    case 'x':
    case 'X':
      event.preventDefault()
      rotatePiece(1)
      break
    case 'z':
    case 'Z':
      event.preventDefault()
      rotatePiece(-1)
      break
    case ' ': // Space for hard drop
      event.preventDefault()
      hardDrop()
      break
    case 'Shift':
      event.preventDefault()
      holdCurrentPiece()
      break
    case 'Escape':
      event.preventDefault()
      togglePause()
      break
  }
}

function startTimer() {
  stopTimer()
  dropTimer = setInterval(() => {
    tick()
  }, dropInterval.value)
}

function stopTimer() {
  if (dropTimer) {
    clearInterval(dropTimer)
    dropTimer = null
  }
}

watch(dropInterval, () => {
  if (!state.isPaused && !state.isGameOver) {
    startTimer()
  }
})

onMounted(() => {
  isClient.value = true
  resetGame()
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('keydown', handleKeydown)
})

const nextPreviews = computed(() => state.nextQueue.slice(0, 5))

function renderMatrix(type: TetrominoKey) {
  const rotations = TETROMINOES[type].rotations[0]
  const xs = rotations.map(([x]) => x)
  const ys = rotations.map(([, y]) => y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const matrix = Array.from({ length: 4 }, () => Array(4).fill(false))
  rotations.forEach(([x, y]) => {
    const col = x - minX
    const row = y - minY
    if (row >= 0 && row < 4 && col >= 0 && col < 4) {
      matrix[row][col] = true
    }
  })
  return matrix
}

</script>

<template>
  <div class="flex flex-col gap-6 lg:flex-row">
    <div class="flex flex-col gap-4">
      <div class="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-3">
        <div>
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Score</p>
          <p class="text-2xl font-semibold text-white">{{ scoreFormatted }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Lines</p>
          <p class="text-2xl font-semibold text-white">{{ state.lines }}</p>
        </div>
        <div class="text-right">
          <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Level</p>
          <p class="text-2xl font-semibold text-white">{{ state.level }}</p>
        </div>
      </div>

      <div
        class="relative grid h-[600px] w-[300px] grid-cols-10 gap-[3px] rounded-xl border border-slate-800 bg-slate-950/90 p-3 shadow-board"
      >
        <template v-for="(row, y) in mergedBoard" :key="y">
          <div
            v-for="(cell, x) in row"
            :key="x"
            class="aspect-square rounded-sm transition-colors"
            :class="cell ? [cell.color.includes('border') ? `bg-transparent ${cell.color}` : `${cell.color} shadow-inner`] : 'bg-slate-900'"
          />
        </template>

        <div v-if="state.isGameOver" class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80">
          <p class="text-2xl font-bold text-white">Game Over</p>
          <UButton color="cyan" variant="solid" @click="resetGame">다시 시작</UButton>
        </div>
        <div v-else-if="state.isPaused" class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/60">
          <p class="text-xl font-semibold text-white">Pause</p>
          <UButton color="cyan" variant="outline" @click="togglePause">이어하기</UButton>
        </div>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-6">
      <div class="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Hold</p>
        <div class="mt-3 grid h-32 w-32 grid-cols-4 gap-[3px] rounded-md border border-slate-800 bg-slate-900/70 p-2">
          <template v-if="state.holdPiece">
            <template v-for="(row, rowIndex) in renderMatrix(state.holdPiece)" :key="rowIndex">
              <div
                v-for="(filled, colIndex) in row"
                :key="colIndex"
                class="aspect-square rounded-sm"
                :class="filled ? `${TETROMINOES[state.holdPiece].color}` : 'bg-slate-900/80'"
              />
            </template>
          </template>
          <template v-else>
            <div v-for="index in 16" :key="index" class="aspect-square rounded-sm bg-slate-900/40" />
          </template>
        </div>
      </div>

      <div class="rounded-lg border border-slate-800 bg-slate-950/80 p-4">
        <p class="text-xs uppercase tracking-[0.3em] text-slate-400">Next</p>
        <div class="mt-3 flex flex-col gap-4">
          <div
            v-for="type in nextPreviews"
            :key="type"
            class="grid grid-cols-4 gap-[3px] rounded-md border border-slate-800 bg-slate-900/70 p-2"
          >
            <template v-for="(row, rowIndex) in renderMatrix(type)" :key="rowIndex">
              <div
                v-for="(filled, colIndex) in row"
                :key="colIndex"
                class="aspect-square rounded-sm"
                :class="filled ? `${TETROMINOES[type].color}` : 'bg-slate-900/80'"
              />
            </template>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <UButton color="cyan" variant="solid" :disabled="!isClient" @click="resetGame">새 게임</UButton>
        <UButton
          color="sky"
          variant="outline"
          :disabled="state.isGameOver || !isClient"
          @click="togglePause"
        >{{ state.isPaused ? '이어하기' : '일시정지' }}</UButton>
      </div>
    </div>
  </div>
</template>
