import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '@/store'
import { SCENE_LABELS } from '@/types'
import { Trophy, Download, Star, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'

const VERSION_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#ec4899']

function getTotalScore(scores: { accuracy: number; tone: number; usability: number }) {
  return scores.accuracy + scores.tone + scores.usability
}

export default function ScoreStats() {
  const { id } = useParams()
  const { tasks, promptVersions, samples, testResults, updateTestResultScore } = useStore()
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null)
  const [localScores, setLocalScores] = useState<Record<string, { accuracy: number; tone: number; usability: number }>>({})

  const task = tasks.find((t) => t.id === id)
  const versions = promptVersions.filter((pv) => pv.taskId === id)
  const results = testResults.filter((tr) => tr.taskId === id)

  const scoredResults = results.filter((tr) => tr.scored)

  const getAverageScores = (versionId: string) => {
    const vr = scoredResults.filter((tr) => tr.promptVersionId === versionId)
    if (vr.length === 0) return null
    const avg = vr.reduce(
      (acc, tr) => ({ accuracy: acc.accuracy + tr.scores.accuracy, tone: acc.tone + tr.scores.tone, usability: acc.usability + tr.scores.usability }),
      { accuracy: 0, tone: 0, usability: 0 }
    )
    return { accuracy: +(avg.accuracy / vr.length).toFixed(1), tone: +(avg.tone / vr.length).toFixed(1), usability: +(avg.usability / vr.length).toFixed(1) }
  }

  const versionStats = versions.map((v) => {
    const avg = getAverageScores(v.id)
    return { version: v, avg, total: avg ? getTotalScore(avg) : 0 }
  })

  const winner = versionStats.filter((v) => v.avg).sort((a, b) => b.total - a.total)[0] || null
  const hasScores = scoredResults.length > 0

  const radarData = ['准确性', '语气', '可用性'].map((label, i) => {
    const keys: ('accuracy' | 'tone' | 'usability')[] = ['accuracy', 'tone', 'usability']
    const row: Record<string, string | number> = { dimension: label }
    versionStats.forEach((vs) => {
      if (vs.avg) row[vs.version.version] = vs.avg[keys[i]]
    })
    return row
  })

  const barData = versionStats.filter((vs) => vs.avg).map((vs) => ({
    version: vs.version.version,
    准确性: vs.avg!.accuracy,
    语气: vs.avg!.tone,
    可用性: vs.avg!.usability,
  }))

  const sampleIds = [...new Set(results.map((tr) => tr.sampleId))]
  const sampleCards = sampleIds.map((sid) => {
    const sample = samples.find((s) => s.id === sid)
    const sampleResults = results.filter((tr) => tr.sampleId === sid)
    const scored = sampleResults.filter((tr) => tr.scored)
    const avgTotal = scored.length > 0
      ? +(scored.reduce((a, tr) => a + getTotalScore(tr.scores), 0) / scored.length).toFixed(1)
      : 0
    return { sample, results: sampleResults, avgTotal, versionCount: new Set(sampleResults.map((r) => r.promptVersionId)).size }
  })

  const handleSave = (resultId: string) => {
    const scores = localScores[resultId]
    if (scores) updateTestResultScore(resultId, scores)
  }

  const getLocalScore = (resultId: string, result: typeof results[0]) => {
    return localScores[resultId] || result.scores
  }

  const handleExport = () => {
    if (!task) return
    const lines: string[] = [
      `任务: ${task.name}`,
      `场景: ${SCENE_LABELS[task.sceneType]}`,
      '',
      '=== 版本评分对比 ===',
    ]
    versionStats.forEach((vs) => {
      if (vs.avg) {
        lines.push(`${vs.version.version}: 准确性=${vs.avg.accuracy} 语气=${vs.avg.tone} 可用性=${vs.avg.usability} 总分=${vs.total}`)
      }
    })
    if (winner) {
      lines.push('', `🏆 胜出版本: ${winner.version.version} (总分: ${winner.total})`)
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${task.name}-评分对比.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const StarRating = ({ value }: { value: number }) => (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn('w-3.5 h-3.5', n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
      ))}
    </span>
  )

  if (!task) return <div className="text-slate-500">任务不存在</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <span>任务看板</span><ArrowRight className="w-3.5 h-3.5" /><span>评分统计</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">评分统计</h1>
          <p className="text-slate-500 mt-1">{task.name} · {SCENE_LABELS[task.sceneType]}</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Download className="w-4 h-4" />导出对比结论
        </button>
      </div>

      {hasScores && winner ? (
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white rounded-xl p-5 flex items-center gap-4">
          <Trophy className="w-8 h-8 shrink-0" />
          <div>
            <div className="text-lg font-bold">🏆 胜出版本: {winner.version.version}</div>
            <div className="text-amber-100 text-sm mt-1">
              准确性 {winner.avg!.accuracy} · 语气 {winner.avg!.tone} · 可用性 {winner.avg!.usability} · 总分 {winner.total}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-100 text-slate-500 rounded-xl p-5 text-center">尚无评分数据</div>
      )}

      {hasScores && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold mb-4">多维度雷达图</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="dimension" className="text-sm" />
                <PolarRadiusAxis domain={[0, 5]} tickCount={6} />
                {versionStats.filter((vs) => vs.avg).map((vs, i) => (
                  <Radar key={vs.version.id} name={vs.version.version} dataKey={vs.version.version}
                    stroke={VERSION_COLORS[i % VERSION_COLORS.length]}
                    fill={VERSION_COLORS[i % VERSION_COLORS.length]}
                    fillOpacity={0.15} />
                ))}
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-lg font-semibold mb-4">版本评分对比</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="version" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="准确性" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="语气" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="可用性" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">逐样本评分</h2>
        {sampleCards.map(({ sample, results: sResults, avgTotal, versionCount }) => {
          if (!sample) return null
          const expanded = expandedSampleId === sample.id
          return (
            <div key={sample.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedSampleId(expanded ? null : sample.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <span className="font-medium text-slate-900">{sample.title}</span>
                  <span className="ml-3 text-sm text-slate-400">{versionCount} 个版本</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  均分 {avgTotal}<ArrowRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
                </div>
              </button>
              {expanded && (
                <div className="border-t border-slate-100 p-5 space-y-4">
                  {sResults.map((tr) => {
                    const ver = versions.find((v) => v.id === tr.promptVersionId)
                    const scores = getLocalScore(tr.id, tr)
                    const total = getTotalScore(scores)
                    return (
                      <div key={tr.id} className="border border-slate-100 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">{ver?.version || '未知版本'}</span>
                          <div className="flex items-center gap-1 text-sm"><StarRating value={Math.round(total / 3)} /><span className="ml-1 text-slate-500">{total}/15</span></div>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">{tr.answer}</p>
                        <div className="grid grid-cols-3 gap-4">
                          {(['accuracy', 'tone', 'usability'] as const).map((key, i) => (
                            <div key={key}>
                              <label className="text-xs text-slate-500">{['准确性', '语气', '可用性'][i]}</label>
                              <input type="range" min={1} max={5} step={1}
                                value={scores[key]}
                                onChange={(e) => setLocalScores((prev) => ({ ...prev, [tr.id]: { ...scores, [key]: +e.target.value } }))}
                                className="w-full accent-amber-500 mt-1" />
                              <div className="text-center text-sm font-medium text-slate-700">{scores[key]}</div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => handleSave(tr.id)}
                          className="px-3 py-1.5 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors"
                        >
                          保存评分
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
