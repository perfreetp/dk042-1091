import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '@/store'
import { SCENE_LABELS, TEST_RUN_STATUS_LABELS, type TestRun } from '@/types'
import { Plus, Save, Trash2, FileText, Pencil, X, Copy, History, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PromptEditor() {
  const { tasks, promptVersions, testRuns, addPromptVersion, updatePromptVersion, deletePromptVersion } = useStore()
  const { id } = useParams()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editVersion, setEditVersion] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newNote, setNewNote] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [historyDetailRun, setHistoryDetailRun] = useState<TestRun | null>(null)

  const task = tasks.find((t) => t.id === id)
  const versions = promptVersions.filter((pv) => pv.taskId === id)
  const selected = versions.find((v) => v.id === selectedId)

  const versionHistory = selected
    ? testRuns
        .filter((tr) => tr.taskId === id && tr.promptVersionSnapshots.some((s) => s.id === selected.id))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : []

  const nextVersionNum = versions.length + 1

  function handleSelect(pvId: string) {
    const pv = versions.find((v) => v.id === pvId)
    if (!pv) return
    setSelectedId(pvId)
    setEditContent(pv.content)
    setEditNote(pv.note)
    setEditVersion(pv.version)
    setIsEditing(false)
  }

  function handleSave() {
    if (!selectedId) return
    updatePromptVersion(selectedId, { content: editContent, note: editNote, version: editVersion })
    setIsEditing(false)
  }

  function handleDelete() {
    if (!selectedId) return
    deletePromptVersion(selectedId)
    setSelectedId(null)
    setIsEditing(false)
  }

  function handleCopy() {
    if (!editContent) return
    navigator.clipboard.writeText(editContent)
  }

  function handleAdd() {
    if (!id || !newVersion.trim() || !newContent.trim()) return
    addPromptVersion({ taskId: id, version: newVersion.trim(), content: newContent.trim(), note: newNote.trim() })
    setNewVersion('')
    setNewContent('')
    setNewNote('')
    setShowAddForm(false)
  }

  function openAddForm() {
    setNewVersion(`V${nextVersionNum}`)
    setNewContent('')
    setNewNote('')
    setShowAddForm(true)
  }

  function formatDate(iso: string) {
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  function openHistory() {
    setShowHistory(true)
    setHistoryDetailRun(null)
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        任务不存在
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">任务看板</a>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-600">{task.name}</span>
        <span className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          'bg-amber-100 text-amber-800'
        )}>
          {SCENE_LABELS[task.sceneType]}
        </span>
        <h1 className="text-xl font-bold text-slate-800 ml-auto">提示词编辑</h1>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700 text-sm">
            版本列表 ({versions.length})
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {versions.map((pv) => (
              <div
                key={pv.id}
                onClick={() => handleSelect(pv.id)}
                className={cn(
                  'p-3 rounded-lg cursor-pointer transition-colors border-l-4',
                  pv.id === selectedId
                    ? 'border-l-amber-400 bg-amber-50'
                    : 'border-l-transparent hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded">
                    {pv.version}
                  </span>
                  {pv.id === selectedId && <Pencil className="w-3 h-3 text-amber-500" />}
                </div>
                <p className="text-xs text-slate-500 mt-1 truncate">
                  {pv.note || '无备注'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatDate(pv.updatedAt)}
                </p>
              </div>
            ))}
            {versions.length === 0 && (
              <div className="text-center text-xs text-slate-400 py-6">暂无版本</div>
            )}
          </div>
          <div className="p-3 border-t border-slate-100">
            <button
              onClick={openAddForm}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Plus className="w-4 h-4" />
              添加版本
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <FileText className="w-12 h-12" />
              <p className="text-lg">选择或创建一个提示词版本</p>
            </div>
          ) : isEditing ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 w-16">版本名</label>
                <input
                  value={editVersion}
                  onChange={(e) => setEditVersion(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>
              <div className="relative">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full min-h-[400px] bg-slate-900 text-green-400 font-mono rounded-lg p-4 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="absolute bottom-2 right-3 text-xs text-slate-500">
                  {editContent.length} 字
                </span>
              </div>
              <p className="text-xs text-slate-400">支持变量: {'{{变量名}}'}</p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600 w-16">备注</label>
                <input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="版本备注..."
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
                <button
                  onClick={() => { setIsEditing(false); handleSelect(selectedId!) }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded">
                  {selected.version}
                </span>
                {selected.note && (
                  <span className="text-sm text-slate-500">{selected.note}</span>
                )}
                <span className="ml-auto text-xs text-slate-400">{formatDate(selected.updatedAt)}</span>
              </div>
              <div className="relative">
                <pre className="w-full min-h-[400px] bg-slate-900 text-green-400 font-mono rounded-lg p-4 text-sm whitespace-pre-wrap overflow-auto">
                  {selected.content}
                </pre>
              </div>
              <p className="text-xs text-slate-400">支持变量: {'{{变量名}}'}</p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  复制
                </button>
                <button
                  onClick={openHistory}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <History className="w-4 h-4" />
                  历史快照
                  {versionHistory.length > 0 && (
                    <span className="bg-amber-500 text-white text-[10px] px-1.5 rounded-full">
                      {versionHistory.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors ml-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-[480px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">添加新版本</h3>
              <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">版本标签</label>
                <input
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="V1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">提示词内容</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[160px] font-mono focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="输入提示词内容..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">备注</label>
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  placeholder="版本备注（可选）"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-[680px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-amber-500" />
                {historyDetailRun
                  ? `第 ${historyDetailRun.runIndex} 次测试 - 快照详情`
                  : `${selected?.version} 的历史测试记录`}
              </h3>
              <button
                onClick={() => historyDetailRun ? setHistoryDetailRun(null) : setShowHistory(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {!historyDetailRun ? (
                versionHistory.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p>该版本暂无测试记录</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {versionHistory.map((run) => {
                      const snap = run.promptVersionSnapshots.find((s) => s.id === selected?.id)
                      return (
                        <div
                          key={run.id}
                          onClick={() => setHistoryDetailRun(run)}
                          className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
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
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(run.createdAt)}
                              <span className="text-slate-300">·</span>
                              {run.promptVersionSnapshots.length} 个版本
                              <span className="text-slate-300">·</span>
                              {run.sampleSnapshots.length} 个样本
                            </div>
                            {snap && snap.note && (
                              <div className="text-xs text-slate-400 mt-1">备注：{snap.note}</div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300" />
                        </div>
                      )
                    })}
                  </div>
                )
              ) : (
                (() => {
                  const snap = historyDetailRun.promptVersionSnapshots.find((s) => s.id === selected?.id)
                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-slate-500 text-xs mb-1">测试批次</div>
                          <div className="font-medium text-slate-900">第 {historyDetailRun.runIndex} 次</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-slate-500 text-xs mb-1">运行时间</div>
                          <div className="font-medium text-slate-900">{formatDate(historyDetailRun.createdAt)}</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-slate-500 text-xs mb-1">参与版本数</div>
                          <div className="font-medium text-slate-900">{historyDetailRun.promptVersionSnapshots.length} 个</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="text-slate-500 text-xs mb-1">测试样本数</div>
                          <div className="font-medium text-slate-900">{historyDetailRun.sampleSnapshots.length} 个</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-amber-500" />
                          当时的提示词内容快照
                          {snap?.note && <span className="text-xs text-slate-400">（备注：{snap.note}）</span>}
                        </div>
                        <pre className="bg-slate-900 text-green-400 font-mono text-sm rounded-lg p-4 whitespace-pre-wrap overflow-auto max-h-[400px]">
                          {snap?.content || '(未找到快照)'}
                        </pre>
                      </div>
                    </div>
                  )
                })()
              )}
            </div>
            {historyDetailRun && (
              <div className="px-6 py-3 border-t border-slate-100">
                <button
                  onClick={() => setHistoryDetailRun(null)}
                  className="text-sm text-slate-600 hover:text-slate-800"
                >
                  ← 返回列表
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
