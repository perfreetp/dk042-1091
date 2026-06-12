import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '@/store'
import { SCENE_LABELS, TEST_RUN_STATUS_LABELS, type TestRun, type PromptVersionSnapshot } from '@/types'
import {
  Trophy, Download, Star, ChevronDown, History, BarChart3, Layers, GitCompare,
  X, AlertTriangle, CheckCircle2, FileText, TrendingUp, Sparkles, Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line,
} from 'recharts'

type ViewMode = 'single' | 'aggregate' | 'compare'

interface VersionScore {
  pvId: string
  version: string
  note: string
  accuracy: number
  tone: number
  usability: number
  avgAccuracy: number
  avgTone: number
  avgUsability: number
  total: number
  avgTotal: number
  scoredCount: number
}

interface RunVersionScore {
  runId: string
  runIndex: number
  pvId: string
  version: string
  avgAccuracy: number
  avgTone: number
  avgUsability: number
  avgTotal: number
  scoredCount: number
}

interface ReviewSummary {
  recommendedVersion: string
  riskPoints: string
  nextActions: string
  customNote: string
}

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const h = d.getHours().toString().padStart(2, '0')
  const min = d.getMinutes().toString().padStart(2, '0')
  return `${m}/${day} ${h}:${min}`
}

function calcStdDev(values: number[]): number {
  if (values.length < 2) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

const CHART_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#EF4444']

export default function ScoreStats() {
  const { id: taskId } = useParams()
  const { tasks, testRuns, testResults, updateTestResultScore } = useStore()

  const [viewMode, setViewMode] = useState<ViewMode>('single')
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [compareRunIds, setCompareRunIds] = useState<string[]>([])
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null)
  const [showRunDropdown, setShowRunDropdown] = useState(false)
  const [localScores, setLocalScores] = useState<Record<string, { accuracy: number; tone: number; usability: number }>>({})
  const [showReviewEditor, setShowReviewEditor] = useState(false)
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary>({
    recommendedVersion: '',
    riskPoints: '',
    nextActions: '',
    customNote: '',
  })

  const task = tasks.find((t) => t.id === taskId)
  const validTaskRuns = useMemo(
    () => testRuns
      .filter((tr) => tr.taskId === taskId && tr.status !== 'aborted')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [testRuns, taskId]
  )
  const allTaskRuns = useMemo(
    () => testRuns
      .filter((tr) => tr.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [testRuns, taskId]
  )

  const activeRun = validTaskRuns.find((r) => r.id === selectedRunId) || validTaskRuns[0] || null

  const relevantRuns = useMemo(() => {
    if (viewMode === 'aggregate') return validTaskRuns
    if (viewMode === 'compare') {
      const selected = validTaskRuns.filter((r) => compareRunIds.includes(r.id))
      return selected.length > 0 ? selected : validTaskRuns
    }
    return activeRun ? [activeRun] : []
  }, [viewMode, validTaskRuns, activeRun, compareRunIds])

  const versionScores = useMemo<VersionScore[]>(() => {
    if (relevantRuns.length === 0) return []

    const pvMap = new Map<string, { version: string; note: string; accuracy: number; tone: number; usability: number; count: number }>()

    relevantRuns.forEach((run) => {
      run.promptVersionSnapshots.forEach((snap) => {
        if (!pvMap.has(snap.id)) {
          pvMap.set(snap.id, { version: snap.version, note: snap.note, accuracy: 0, tone: 0, usability: 0, count: 0 })
        }
      })

      testResults
        .filter((tr) => tr.testRunId === run.id && tr.scored)
        .forEach((tr) => {
          const entry = pvMap.get(tr.promptVersionId)
          if (entry) {
            entry.accuracy += tr.scores.accuracy
            entry.tone += tr.scores.tone
            entry.usability += tr.scores.usability
            entry.count += 1
          }
        })
    })

    return Array.from(pvMap.entries()).map(([pvId, data]) => ({
      pvId,
      version: data.version,
      note: data.note,
      accuracy: data.accuracy,
      tone: data.tone,
      usability: data.usability,
      avgAccuracy: data.count > 0 ? data.accuracy / data.count : 0,
      avgTone: data.count > 0 ? data.tone / data.count : 0,
      avgUsability: data.count > 0 ? data.usability / data.count : 0,
      total: data.accuracy + data.tone + data.usability,
      avgTotal: data.count > 0 ? (data.accuracy + data.tone + data.usability) / data.count : 0,
      scoredCount: data.count,
    })).sort((a, b) => b.avgTotal - a.avgTotal)
  }, [relevantRuns, testResults])

  const runVersionScores = useMemo<RunVersionScore[]>(() => {
    const result: RunVersionScore[] = []
    relevantRuns.forEach((run) => {
      const pvMap = new Map<string, { version: string; accuracy: number; tone: number; usability: number; count: number }>()
      run.promptVersionSnapshots.forEach((snap) => {
        pvMap.set(snap.id, { version: snap.version, accuracy: 0, tone: 0, usability: 0, count: 0 })
      })
      testResults
        .filter((tr) => tr.testRunId === run.id && tr.scored)
        .forEach((tr) => {
          const entry = pvMap.get(tr.promptVersionId)
          if (entry) {
            entry.accuracy += tr.scores.accuracy
            entry.tone += tr.scores.tone
            entry.usability += tr.scores.usability
            entry.count += 1
          }
        })
      pvMap.forEach((data, pvId) => {
        result.push({
          runId: run.id,
          runIndex: run.runIndex,
          pvId,
          version: data.version,
          avgAccuracy: data.count > 0 ? data.accuracy / data.count : 0,
          avgTone: data.count > 0 ? data.tone / data.count : 0,
          avgUsability: data.count > 0 ? data.usability / data.count : 0,
          avgTotal: data.count > 0 ? (data.accuracy + data.tone + data.usability) / data.count : 0,
          scoredCount: data.count,
        })
      })
    })
    return result
  }, [relevantRuns, testResults])

  const stabilityData = useMemo(() => {
    const pvMap = new Map<string, { version: string; totals: number[] }>()
    runVersionScores.forEach((rvs) => {
      if (rvs.scoredCount === 0) return
      if (!pvMap.has(rvs.pvId)) {
        pvMap.set(rvs.pvId, { version: rvs.version, totals: [] })
      }
      pvMap.get(rvs.pvId)!.totals.push(rvs.avgTotal)
    })
    return Array.from(pvMap.entries()).map(([pvId, data]) => ({
      pvId,
      version: data.version,
      avg: data.totals.length > 0 ? data.totals.reduce((a, b) => a + b, 0) / data.totals.length : 0,
      stdDev: calcStdDev(data.totals),
      runCount: data.totals.length,
      stability: data.totals.length >= 2
        ? Math.max(0, 100 - calcStdDev(data.totals) * 20)
        : 100,
    })).sort((a, b) => b.stability - a.stability)
  }, [runVersionScores])

  const trendChartData = useMemo(() => {
    const runsInOrder = [...relevantRuns].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    return runsInOrder.map((run) => {
      const row: Record<string, string | number> = {
        run: `第${run.runIndex}次`,
        runIndex: run.runIndex,
      }
      const pvVersionSet = new Set<string>()
      runVersionScores
        .filter((rvs) => rvs.runId === run.id)
        .forEach((rvs) => {
          row[rvs.version] = Number(rvs.avgTotal.toFixed(2))
          pvVersionSet.add(rvs.version)
        })
      return row
    })
  }, [relevantRuns, runVersionScores])

  const winner = versionScores[0] || null
  const hasAnyScores = versionScores.some((v) => v.scoredCount > 0)

  const radarData = useMemo(() => {
    const axes = ['准确性', '语气', '可用性']
    return axes.map((axis, idx) => {
      const row: Record<string, string | number> = { axis }
      versionScores.forEach((v, i) => {
        const key = `${v.version} (${v.scoredCount}条)`
        const val = idx === 0 ? v.avgAccuracy : idx === 1 ? v.avgTone : v.avgUsability
        row[key] = Number(val.toFixed(1))
      })
      return row
    })
  }, [versionScores])

  const barData = useMemo(() => {
    return versionScores.map((v) => ({
      version: v.version,
      准确性: Number(v.avgAccuracy.toFixed(1)),
      语气: Number(v.avgTone.toFixed(1)),
      可用性: Number(v.avgUsability.toFixed(1)),
    }))
  }, [versionScores])

  const samplesWithResults = useMemo(() => {
    const sampleMap = new Map<string, { id: string; title: string; category: string; results: Array<{ pvId: string; pvVersion: string; answer: string; resultId: string; scores: { accuracy: number; tone: number; usability: number }; scored: boolean }> }>()

    relevantRuns.forEach((run) => {
      run.sampleSnapshots.forEach((snap) => {
        if (!sampleMap.has(snap.id)) {
          sampleMap.set(snap.id, { id: snap.id, title: snap.title, category: snap.category, results: [] })
        }
        const sampleEntry = sampleMap.get(snap.id)!

        run.promptVersionSnapshots.forEach((pvSnap) => {
          const result = testResults.find(
            (tr) => tr.testRunId === run.id && tr.sampleId === snap.id && tr.promptVersionId === pvSnap.id
          )
          if (result) {
            sampleEntry.results.push({
              pvId: pvSnap.id,
              pvVersion: pvSnap.version,
              answer: result.answer,
              resultId: result.id,
              scores: result.scores,
              scored: result.scored,
            })
          }
        })
      })
    })

    return Array.from(sampleMap.values())
  }, [relevantRuns, testResults])

  function handleScoreChange(resultId: string, field: 'accuracy' | 'tone' | 'usability', value: number) {
    setLocalScores((prev) => {
      const existing = testResults.find((tr) => tr.id === resultId)
      const base = existing?.scores || { accuracy: 0, tone: 0, usability: 0 }
      const current = prev[resultId] || base
      return { ...prev, [resultId]: { ...current, [field]: value } }
    })
  }

  function getCurrentScore(resultId: string, scores: { accuracy: number; tone: number; usability: number }) {
    return localScores[resultId] || scores
  }

  function handleSaveScore(resultId: string) {
    const scores = localScores[resultId]
    if (!scores) return
    const existing = testResults.find((tr) => tr.id === resultId)
    if (!existing) return
    const changedFields: Partial<{ accuracy: number; tone: number; usability: number }> = {}
    ;(['accuracy', 'tone', 'usability'] as const).forEach((f) => {
      if (scores[f] !== existing.scores[f]) changedFields[f] = scores[f]
    })
    if (Object.keys(changedFields).length === 0) return
    updateTestResultScore(resultId, changedFields)
  }

  function toggleCompareRun(runId: string) {
    setCompareRunIds((prev) =>
      prev.includes(runId) ? prev.filter((id) => id !== runId) : [...prev, runId]
    )
  }

  function handleSelectRun(runId: string) {
    setSelectedRunId(runId)
    setShowRunDropdown(false)
    setExpandedSampleId(null)
    setLocalScores({})
  }

  function generateReportText(): string {
    const lines: string[] = []
    lines.push('═'.repeat(60))
    lines.push('          提示词 A/B 测试复盘报告')
    lines.push('═'.repeat(60))
    lines.push('')
    lines.push(`📋 任务名称：${task?.name || '未命名'}`)
    lines.push(`🎯 场景类型：${task ? SCENE_LABELS[task.sceneType] : ''}`)
    const modeLabel = viewMode === 'single' ? '单批次' : viewMode === 'aggregate' ? '全量汇总' : '批次对比'
    lines.push(`📊 视图模式：${modeLabel}`)
    if (viewMode === 'single' && activeRun) {
      lines.push(`🔢 测试批次：第 ${activeRun.runIndex} 次测试`)
      lines.push(`⏰ 运行时间：${formatDateTime(activeRun.createdAt)}`)
    } else {
      lines.push(`🔢 统计批次：${relevantRuns.length} 次历史测试`)
    }
    lines.push('')

    lines.push('─'.repeat(60))
    lines.push('  📝 测试条件')
    lines.push('─'.repeat(60))
    if (relevantRuns.length > 0) {
      const sampleCount = new Set(relevantRuns.flatMap((r) => r.sampleSnapshots.map((s) => s.id))).size
      const versionCount = new Set(relevantRuns.flatMap((r) => r.promptVersionSnapshots.map((p) => p.id))).size
      lines.push(`• 参与版本：${versionCount} 个`)
      lines.push(`• 测试样本：${sampleCount} 个`)
      lines.push(`• 评分维度：准确性 / 语气 / 可用性（各5分）`)
    }
    lines.push('')

    lines.push('─'.repeat(60))
    lines.push('  📦 样本清单')
    lines.push('─'.repeat(60))
    const uniqueSamples: string[] = []
    relevantRuns.forEach((run) => {
      run.sampleSnapshots.forEach((s) => {
        if (!uniqueSamples.includes(s.title)) uniqueSamples.push(s.title)
      })
    })
    uniqueSamples.forEach((title, idx) => {
      lines.push(`  ${idx + 1}. ${title}`)
    })
    lines.push('')

    lines.push('─'.repeat(60))
    lines.push('  📝 各版本备注')
    lines.push('─'.repeat(60))
    versionScores.forEach((v) => {
      lines.push(`  ${v.version}：${v.note || '无备注'}`)
    })
    lines.push('')

    if (viewMode === 'compare' && stabilityData.length > 0) {
      lines.push('─'.repeat(60))
      lines.push('  📈 版本稳定性分析')
      lines.push('─'.repeat(60))
      stabilityData.forEach((s, i) => {
        lines.push(`  ${i + 1}. ${s.version}`)
        lines.push(`     平均分：${s.avg.toFixed(2)} / 15  |  标准差：${s.stdDev.toFixed(2)}  |  稳定性：${s.stability.toFixed(0)}%`)
      })
      lines.push('')
    }

    lines.push('─'.repeat(60))
    lines.push('  🏆 胜出版本')
    lines.push('─'.repeat(60))
    if (winner && hasAnyScores) {
      lines.push(`  ${winner.version} 以综合得分 ${winner.avgTotal.toFixed(2)} / 15 胜出`)
      lines.push(`  • 准确性：${winner.avgAccuracy.toFixed(2)} 分`)
      lines.push(`  • 语　气：${winner.avgTone.toFixed(2)} 分`)
      lines.push(`  • 可用性：${winner.avgUsability.toFixed(2)} 分`)
      lines.push(`  • 样本数：${winner.scoredCount} 条已评分`)
      lines.push('')
      lines.push('  胜出原因分析：')
      if (winner.avgAccuracy >= 4) lines.push('    ✓ 准确性表现优秀，信息完整度高')
      if (winner.avgTone >= 4) lines.push('    ✓ 语气恰当，符合目标场景氛围')
      if (winner.avgUsability >= 4) lines.push('    ✓ 可用性强，落地性好')
      const runnerUp = versionScores[1]
      if (runnerUp) {
        const diff = winner.avgTotal - runnerUp.avgTotal
        lines.push(`    领先第2名 ${diff.toFixed(2)} 分`)
      }
    } else {
      lines.push('  暂无评分数据')
    }
    lines.push('')

    lines.push('─'.repeat(60))
    lines.push('  📊 各版本得分详情')
    lines.push('─'.repeat(60))
    versionScores.forEach((v, i) => {
      lines.push(`  ${i + 1}. ${v.version}`)
      lines.push(`     准确性：${v.avgAccuracy.toFixed(2)} 分  语气：${v.avgTone.toFixed(2)} 分  可用性：${v.avgUsability.toFixed(2)} 分`)
      lines.push(`     综合得分：${v.avgTotal.toFixed(2)} / 15  （已评 ${v.scoredCount} 条）`)
      lines.push('')
    })

    if (reviewSummary.recommendedVersion || reviewSummary.riskPoints || reviewSummary.nextActions || reviewSummary.customNote) {
      lines.push('─'.repeat(60))
      lines.push('  🧑‍💼 团队复盘结论')
      lines.push('─'.repeat(60))
      if (reviewSummary.recommendedVersion) {
        lines.push(`  ✅ 推荐版本：${reviewSummary.recommendedVersion}`)
        lines.push('')
      }
      if (reviewSummary.riskPoints) {
        lines.push('  ⚠️ 风险点：')
        reviewSummary.riskPoints.split('\n').forEach((l) => l.trim() && lines.push(`     ${l.trim()}`))
        lines.push('')
      }
      if (reviewSummary.nextActions) {
        lines.push('  🚀 后续动作：')
        reviewSummary.nextActions.split('\n').forEach((l) => l.trim() && lines.push(`     ${l.trim()}`))
        lines.push('')
      }
      if (reviewSummary.customNote) {
        lines.push('  📝 补充说明：')
        reviewSummary.customNote.split('\n').forEach((l) => l.trim() && lines.push(`     ${l.trim()}`))
        lines.push('')
      }
    }

    lines.push('─'.repeat(60))
    lines.push(`  📅 报告生成时间：${formatDateTime(new Date().toISOString())}`)
    lines.push('═'.repeat(60))

    return lines.join('\n')
  }

  function handleExport() {
    const text = generateReportText()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `A/B测试复盘报告_${task?.name || '未命名'}_${formatDateTime(new Date().toISOString()).replace(/[/: ]/g, '-')}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  if (!task) {
    return <div className="flex items-center justify-center h-64 text-slate-400">任务不存在</div>
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <a href="/" className="hover:text-slate-700">任务看板</a>
            <span>/</span>
            <span>{task.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">评分统计</h1>
          <p className="text-sm text-slate-500 mt-1">
            {SCENE_LABELS[task.sceneType]} · {validTaskRuns.length} 次有效测试
            {allTaskRuns.length > validTaskRuns.length && (
              <span className="ml-2 text-amber-600">
                （{allTaskRuns.length - validTaskRuns.length} 次已中止）
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
            <button
              onClick={() => { setViewMode('single'); setCompareRunIds([]) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'single'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <BarChart3 className="w-4 h-4" />
              单批次
            </button>
            <button
              onClick={() => { setViewMode('aggregate'); setCompareRunIds([]) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'aggregate'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <Layers className="w-4 h-4" />
              全量汇总
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                viewMode === 'compare'
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <GitCompare className="w-4 h-4" />
              批次对比
            </button>
          </div>
          <button
            onClick={() => setShowReviewEditor(!showReviewEditor)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              showReviewEditor
                ? 'bg-blue-500 text-white hover:bg-blue-400'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            )}
          >
            <FileText className="w-4 h-4" />
            复盘编辑
          </button>
          <button
            onClick={handleExport}
            disabled={!hasAnyScores}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>

      {viewMode === 'single' && validTaskRuns.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowRunDropdown(!showRunDropdown)}
            className="flex items-center gap-3 w-full md:w-96 px-4 py-3 bg-white border border-slate-200 rounded-lg text-left hover:border-slate-300 transition-colors"
          >
            <History className="w-5 h-5 text-amber-500" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-slate-900">第 {activeRun?.runIndex || '-'} 次测试</div>
              <div className="text-xs text-slate-500">
                {activeRun ? formatDateTime(activeRun.createdAt) : ''}
                <span className="text-slate-300 mx-2">·</span>
                {activeRun?.promptVersionSnapshots.length || 0} 个版本
                <span className="text-slate-300 mx-2">·</span>
                {activeRun?.sampleSnapshots.length || 0} 个样本
              </div>
            </div>
            <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', showRunDropdown && 'rotate-180')} />
          </button>
          {showRunDropdown && (
            <div className="absolute top-full left-0 right-0 md:w-96 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-72 overflow-y-auto">
              {allTaskRuns.map((run) => (
                <div
                  key={run.id}
                  onClick={() => run.status !== 'aborted' && handleSelectRun(run.id)}
                  className={cn(
                    'px-4 py-3 border-b border-slate-100 last:border-b-0 transition-colors',
                    run.status === 'aborted' ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer hover:bg-slate-50',
                    run.id === activeRun?.id && 'bg-amber-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">第 {run.runIndex} 次测试</span>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full',
                      run.status === 'completed' && 'bg-green-100 text-green-700',
                      run.status === 'running' && 'bg-amber-100 text-amber-700',
                      run.status === 'aborted' && 'bg-red-100 text-red-700',
                    )}>
                      {TEST_RUN_STATUS_LABELS[run.status]}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatDateTime(run.createdAt)} · {run.promptVersionSnapshots.length} 版本 × {run.sampleSnapshots.length} 样本
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === 'aggregate' && (
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg px-4 py-3 border border-slate-200">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Layers className="w-4 h-4 text-amber-500" />
            <span>
              汇总视图：基于 <strong>{relevantRuns.length}</strong> 次有效历史测试，共{' '}
              <strong>{new Set(relevantRuns.flatMap(r => r.sampleSnapshots.map(s => s.id))).size}</strong> 个不同样本，
              <strong> {new Set(relevantRuns.flatMap(r => r.promptVersionSnapshots.map(p => p.id))).size}</strong> 个提示词版本
            </span>
          </div>
        </div>
      )}

      {viewMode === 'compare' && (
        <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <GitCompare className="w-4 h-4 text-amber-500" />
              选择要对比的测试批次（已选 {compareRunIds.length} 个）
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCompareRunIds(validTaskRuns.map(r => r.id))}
                className="text-xs px-3 py-1 rounded text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                全选
              </button>
              <button
                onClick={() => setCompareRunIds([])}
                className="text-xs px-3 py-1 rounded text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                清空
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {validTaskRuns.map((run) => {
              const selected = compareRunIds.includes(run.id)
              return (
                <button
                  key={run.id}
                  onClick={() => toggleCompareRun(run.id)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all',
                    selected
                      ? 'bg-amber-50 border-amber-400 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                  )}
                >
                  <div className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center',
                    selected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                  )}>
                    {selected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <span>第 {run.runIndex} 次</span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(run.createdAt)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {showReviewEditor && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800 font-semibold">
              <FileText className="w-5 h-5" />
              复盘摘要 & 团队结论
            </div>
            <button
              onClick={() => setShowReviewEditor(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Sparkles className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                推荐版本
              </label>
              <input
                value={reviewSummary.recommendedVersion}
                onChange={(e) => setReviewSummary({ ...reviewSummary, recommendedVersion: e.target.value })}
                placeholder="例如：V2 - 沉稳专业版"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
                风险点（每行一条）
              </label>
              <textarea
                value={reviewSummary.riskPoints}
                onChange={(e) => setReviewSummary({ ...reviewSummary, riskPoints: e.target.value })}
                placeholder="例如：&#10;V1 在复杂售后场景下容易答非所问&#10;V2 语气过于正式，对年轻用户不够亲切"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <Zap className="w-3.5 h-3.5 inline mr-1 text-emerald-500" />
                后续动作（每行一条）
              </label>
              <textarea
                value={reviewSummary.nextActions}
                onChange={(e) => setReviewSummary({ ...reviewSummary, nextActions: e.target.value })}
                placeholder="例如：&#10;本周内上线 V2 版本到客服工作台&#10;V1 补充售后场景的 few-shot 示例后重新测试"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <FileText className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                补充说明
              </label>
              <textarea
                value={reviewSummary.customNote}
                onChange={(e) => setReviewSummary({ ...reviewSummary, customNote: e.target.value })}
                placeholder="其他需要记录的复盘内容..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[60px] focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>
      )}

      {viewMode === 'compare' && stabilityData.length > 0 && stabilityData.some(s => s.runCount >= 2) && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="font-semibold text-slate-900">版本稳定性分析</h3>
            <span className="text-xs text-slate-400">基于多批次数据计算</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {stabilityData.map((s, i) => (
              <div key={s.pvId} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-slate-900">{s.version}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full font-medium',
                    s.stability >= 85 ? 'bg-emerald-100 text-emerald-700' :
                    s.stability >= 70 ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  )}>
                    稳定性 {s.stability.toFixed(0)}%
                  </span>
                </div>
                <div className="text-sm text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>平均分</span>
                    <span className="font-medium">{s.avg.toFixed(2)} / 15</span>
                  </div>
                  <div className="flex justify-between">
                    <span>标准差</span>
                    <span className="font-medium">{s.stdDev.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>参与批次</span>
                    <span className="font-medium">{s.runCount} 次</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'compare' && trendChartData.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">分数趋势对比</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="run" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis domain={[0, 15]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {Array.from(new Set(runVersionScores.map(r => r.version))).map((ver, i) => (
                  <Line
                    key={ver}
                    type="monotone"
                    dataKey={ver}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {winner && hasAnyScores && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-xl p-5 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-white/80 mb-1">🏆 胜出版本</div>
              <div className="text-2xl font-bold mb-2">{winner.version}</div>
              <div className="text-sm text-white/90">
                综合得分 <span className="font-bold text-lg">{winner.avgTotal.toFixed(1)}</span> / 15 分
              </div>
              <div className="flex gap-6 mt-3 text-sm text-white/80">
                <span>准确性 {winner.avgAccuracy.toFixed(1)}</span>
                <span>语气 {winner.avgTone.toFixed(1)}</span>
                <span>可用性 {winner.avgUsability.toFixed(1)}</span>
              </div>
              {winner.note && (
                <div className="mt-2 text-xs text-white/70">
                  版本备注：{winner.note}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!hasAnyScores && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">暂无评分数据</p>
          <p className="text-sm text-slate-400 mt-1">请先完成测试并为各版本回答打分</p>
        </div>
      )}

      {hasAnyScores && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">雷达图对比</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="axis" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  {versionScores.map((v, i) => (
                    <Radar
                      key={v.pvId}
                      name={`${v.version}`}
                      dataKey={`${v.version} (${v.scoredCount}条)`}
                      stroke={CHART_COLORS[i % CHART_COLORS.length]}
                      fill={CHART_COLORS[i % CHART_COLORS.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 mb-4">柱状图对比</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="version" tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis domain={[0, 5]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  />
                  <Bar dataKey="准确性" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="语气" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="可用性" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">逐样本评分</h3>
        {samplesWithResults.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            暂无测试结果
          </div>
        ) : (
          <div className="space-y-3">
            {samplesWithResults.map((sample) => {
              const isExpanded = expandedSampleId === sample.id
              const avgScore = sample.results.length > 0
                ? sample.results.reduce((sum, r) => sum + r.scores.accuracy + r.scores.tone + r.scores.usability, 0) / sample.results.length
                : 0
              const scoredCount = sample.results.filter(r => r.scored).length

              return (
                <div key={sample.id} className="border border-slate-200 rounded-lg overflow-hidden">
                  <div
                    onClick={() => setExpandedSampleId(isExpanded ? null : sample.id)}
                    className="flex items-center justify-between px-4 py-3 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
                      <span className="font-medium text-slate-900">{sample.title}</span>
                      <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">
                        {sample.results.length} 个版本
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">
                        {scoredCount}/{sample.results.length} 已评分
                      </span>
                      {scoredCount > 0 && (
                        <span className="text-sm font-semibold text-amber-600">
                          均分 {(avgScore / 3).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 space-y-4">
                      {sample.results.map((result) => {
                        const currentScores = getCurrentScore(result.resultId, result.scores)
                        return (
                          <div key={result.pvId} className="border border-slate-100 rounded-lg p-4 bg-slate-50/50">
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-medium text-slate-900 bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-sm">
                                {result.pvVersion}
                              </span>
                              <button
                                onClick={() => handleSaveScore(result.resultId)}
                                disabled={!localScores[result.resultId]}
                                className="text-xs px-3 py-1 rounded bg-amber-500 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-400 transition-colors"
                              >
                                保存评分
                              </button>
                            </div>
                            <div className="text-sm text-slate-700 whitespace-pre-wrap bg-white rounded p-3 border border-slate-200 mb-4 max-h-40 overflow-y-auto">
                              {result.answer}
                            </div>
                            <div className="space-y-3">
                              {(['accuracy', 'tone', 'usability'] as const).map((field) => {
                                const labelMap = { accuracy: '准确性', tone: '语气', usability: '可用性' }
                                const val = currentScores[field] || 0
                                return (
                                  <div key={field} className="flex items-center gap-3">
                                    <span className="text-sm text-slate-600 w-14">{labelMap[field]}</span>
                                    <input
                                      type="range"
                                      min={0}
                                      max={5}
                                      step={0.5}
                                      value={val}
                                      onChange={(e) => handleScoreChange(result.resultId, field, Number(e.target.value))}
                                      className="flex-1"
                                    />
                                    <span className="text-sm font-semibold text-slate-800 w-8 text-right">
                                      {val.toFixed(1)}
                                    </span>
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                          key={star}
                                          className={cn(
                                            'w-4 h-4',
                                            val >= star ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                          )}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
