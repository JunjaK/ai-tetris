<template>
  <UContainer class="py-12">
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
      <UCard
        class="bg-slate-900/70 ring-1 ring-slate-800/80 backdrop-blur"
        :ui="{ body: { base: 'p-6' } }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm uppercase tracking-[0.3em] text-sky-400">Nuxt SSG</p>
              <h1 class="mt-1 text-3xl font-bold">AI Tetris</h1>
            </div>
            <UIcon name="i-heroicons-cube-transparent" class="h-10 w-10 text-sky-400" />
          </div>
        </template>
        <TetrisGame />
      </UCard>

      <aside class="space-y-6">
        <UCard class="bg-slate-900/70 ring-1 ring-slate-800/80 backdrop-blur">
          <template #header>
            <h2 class="text-xl font-semibold">조작법</h2>
          </template>
          <ul class="space-y-3 text-sm text-slate-200">
            <li class="flex items-center justify-between">
              <span class="font-medium text-slate-300">← / →</span>
              <span>블록 좌우 이동</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="font-medium text-slate-300">↑</span>
              <span>블록 회전</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="font-medium text-slate-300">↓</span>
              <span>소프트 드롭</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="font-medium text-slate-300">Space</span>
              <span>하드 드롭</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="font-medium text-slate-300">Shift</span>
              <span>블록 보관 / 호출</span>
            </li>
            <li class="flex items-center justify-between">
              <span class="font-medium text-slate-300">Esc</span>
              <span>일시정지</span>
            </li>
          </ul>
        </UCard>
        <UCard class="bg-slate-900/70 ring-1 ring-slate-800/80 backdrop-blur">
          <template #header>
            <h2 class="text-xl font-semibold">게임 설명</h2>
          </template>
          <p class="text-sm leading-relaxed text-slate-300">
            Nuxt 3와 Nuxt UI 4, Tailwind CSS로 구현된 스테이트리스 테트리스입니다. 페이지는 정적 생성(SSG)으로
            배포할 수 있으며, 모든 게임 로직은 클라이언트에서 실행됩니다.
          </p>
        </UCard>
      </aside>
    </div>
  </UContainer>
</template>
