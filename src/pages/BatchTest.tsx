import { useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useStore, generateMockAnswer } from '@/store'
import { SCENE_LABELS, type SceneType } from '@/types'
import { Play, Square, CheckCircle2, Loader2, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = ['选择样本', '运行测试', '查看结果'] as const
const CATEGORY_PILLS: { value: '' | SceneType; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'product_intro', label: '商品介绍' },
  { value: 'after_sale', label: '售后问答' },
  { value: 'campaign_copy', label: '活动文案' },
]

export default function BatchTest() {
  const { id: taskId } = useParams()
  const { tasks, promptVersions, samples, addTestResult, updateTask } = useStore()

  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [streamingResults, setStreamingResults] = useState<Map<string, string>>(new Map())
  const [completedKeys, setCompletedKeys] = useState<Set<string>>(new Set())
  const [filterCategory, setFilterCategory] = useState<'' | SceneType>('')

  const intervalsRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map())

  const task = tasks.find((t) => t.id === taskId)
  const versions = promptVersions.filter((pv) => pv.taskId === taskId)

  const currentStep = isRunning ? 2 : streamingResults.size > 0 ? 3 : 1

  const filteredSamples = filterCategory
    ? samples.filter((s) => s.category === filterCategory)
    : samples

  const toggleSample = (sampleId: string) => {
    setSelectedSampleIds((prev) =>
      prev.includes(sampleId) ? prev.filter((id) => id !== sampleId) : [...prev, sampleId]
    )
  }

  const stopRunning = useCallback(() => {
    intervalsRef.current.forEach((iv) => clearInterval(iv))
    intervalsRef.current.clear()
    setIsRunning(false)
  }, [])

  const runTests = useCallback(() => {
    if (!task || selectedSampleIds.length === 0 || versions.length === 0) return

    setIsRunning(true)
    setStreamingResults(new Map())
    setCompletedKeys(new Set())

    const newResults = new Map<string, string>()
    const newCompleted = new Set<string>()
    let pending = selectedSampleIds.length * versions.length

    selectedSampleIds.forEach((sampleId) => {
      const sample = samples.find((s) => s.id === sampleId)
      if (!sample) return

      versions.forEach((pv) => {
        const key = `${sampleId}-${pv.id}`
        const fullText = generateMockAnswer(pv.content, sample.content, task.sceneType)
        let charIndex = 0
        newResults.set(key, '')

        const iv = setInterval(() => {
          charIndex += Math.floor(Math.random() * 2) + 1
          if (charIndex >= fullText.length) {
            charIndex = fullText.length
            clearInterval(iv)
            intervalsRef.current.delete(key)
            newCompleted.add(key)
            setCompletedKeys(new Set(newCompleted))
            addTestResult({
              taskId: task.id,
              sampleId,
              promptVersionId: pv.id,
              answer: fullText,
              scores: { accuracy: 0, tone: 0, usability: 0 },
              scored: false,
            })
            pending--
            if (pending <= 0) {
              setIsRunning(false)
              updateTask(task.id, { status: 'testing' })
            }
          }
          newResults.set(key, fullText.slice(0, charIndex))
          setStreamingResults(new Map(newResults))
        }, 20 + Math.random() * 10)

        intervalsRef.current.set(key, iv)
      })
    })
  }, [task, selectedSampleIds, versions, samples, addTestResult, updateTask])

  const completedCount = completedKeys.size
  const totalCount = selectedSampleIds.length * versions.length

  if (!task) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        任务不存在
      </div>
    )
  }

  const selectedSamples = samples.filter((s) => selectedSampleIds.includes(s.id))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
          <a href="/" className="hover:text-slate-700">任务看板</a>
          <span>/</span>
          <span>{task.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">批量测试</h1>
      </div>

      <div className="flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                i + 1 === currentStep
                  ? 'bg-amber-100 text-amber-700 border border-amber-300'
                  : i + 1 < currentStep
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
              )}
            >
              {i + 1 < currentStep ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              ) : (
                <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-200 text-xs text-slate-600">
                  {i + 1}
                </span>
              )}
              {label}
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-8 h-0.5 mx-1',
                  i + 1 < currentStep ? 'bg-emerald-400' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">选择样本</h2>
          <span className="text-sm text-amber-600 font-medium">
            已选择 {selectedSampleIds.length} 个样本
          </span>
        </div>

        <div className="flex gap-2">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setFilterCategory(pill.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                filterCategory === pill.value
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredSamples.map((sample) => {
            const isSelected = selectedSampleIds.includes(sample.id)
            return (
              <div
                key={sample.id}
                onClick={() => toggleSample(sample.id)}
                className={cn(
                  'relative p-4 rounded-lg border cursor-pointer transition-all',
                  isSelected
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                )}
              >
                <div className="absolute top-3 left-3">
                  <div
                    className={cn(
                      'w-4 h-4 rounded border-2 flex items-center justify-center',
                      isSelected ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                    )}
                  >
                    {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                </div>
                <div className="pl-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-900 truncate">
                      {sample.title}
                    </span>
                    {sample.starred && (
                      <span className="text-amber-400 text-xs">★</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                    {sample.content}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                    {SCENE_LABELS[sample.category]}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {!isRunning ? (
          <button
            onClick={runTests}
            disabled={selectedSampleIds.length === 0 || versions.length === 0}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-amber-400 hover:to-amber-500 transition-all"
          >
            <Play className="w-5 h-5" />
            开始测试
          </button>
        ) : (
          <button
            onClick={stopRunning}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-400 transition-all"
          >
            <Square className="w-4 h-4" />
            停止
          </button>
        )}
        {isRunning && (
          <span className="text-sm text-slate-600 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            正在测试 {completedCount}/{totalCount}...
          </span>
        )}
      </div>

      {(streamingResults.size > 0 || isRunning) && (
        <div className="space-y-6">
          {selectedSamples.map((sample) => (
            <div key={sample.id} className="space-y-3">
              <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                {sample.title}
              </h3>
              <div className="flex gap-4">
                {versions.map((pv) => {
                  const key = `${sample.id}-${pv.id}`
                  const text = streamingResults.get(key) ?? ''
                  const done = completedKeys.has(key)
                  return (
                    <div key={pv.id} className="flex-1 min-w-0">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 mb-2">
                        {pv.version}
                      </span>
                      <div className="bg-slate-900 text-slate-100 rounded-lg p-4 min-h-[200px] font-mono text-sm whitespace-pre-wrap">
                        {text}
                        {!done && text && (
                          <span className="animate-pulse text-amber-400">▌</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {streamingResults.size === 0 && !isRunning && currentStep === 3 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <BookOpen className="w-10 h-10 mb-3" />
          <p>暂无测试结果</p>
        </div>
      )}
    </div>
  )
}
