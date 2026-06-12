import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { SCENE_LABELS, STATUS_LABELS, TaskStatus } from '@/types'
import { Plus, Search, Trash2, ArrowRight, FlaskConical, Clock, CheckCircle2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ReactNode; color: string; strip: string }> = {
  pending: { icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-amber-100 text-amber-700', strip: 'bg-amber-400' },
  testing: { icon: <FlaskConical className="w-3.5 h-3.5" />, color: 'bg-blue-100 text-blue-700', strip: 'bg-blue-400' },
  completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, color: 'bg-green-100 text-green-700', strip: 'bg-green-400' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? '刚刚' : `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

const INITIAL_FORM = { name: '', sceneType: 'product_intro' as const, note: '' }

export default function TaskBoard() {
  const navigate = useNavigate()
  const { tasks, promptVersions, addTask, deleteTask } = useStore()

  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'' | TaskStatus>('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTask, setNewTask] = useState(INITIAL_FORM)

  const filtered = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleCreate = () => {
    if (!newTask.name.trim()) return
    addTask(newTask)
    setShowCreateModal(false)
    setNewTask(INITIAL_FORM)
  }

  const versionCount = (taskId: string) => promptVersions.filter((pv) => pv.taskId === taskId).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">任务看板</h1>
          <p className="text-sm text-slate-500 mt-1">管理和监控你的提示词 A/B 测试任务</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition"
        >
          <Plus className="w-4 h-4" />
          创建任务
        </button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索任务..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <div className="flex items-center gap-1.5">
          {[{ label: '全部', value: '' }, { label: '待测试', value: 'pending' }, { label: '测试中', value: 'testing' }, { label: '已完成', value: 'completed' }].map((s) => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value as '' | TaskStatus)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition',
                filterStatus === s.value ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg">暂无任务</p>
          <p className="text-sm mt-1">点击"创建任务"开始你的第一个 A/B 测试</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((task) => {
            const cfg = STATUS_CONFIG[task.status]
            return (
              <div
                key={task.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex">
                  <div className={cn('w-1.5 shrink-0', cfg.strip)} />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900 truncate">{task.name}</h3>
                      <span className={cn('shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', cfg.color)}>
                        {cfg.icon}
                        {STATUS_LABELS[task.status]}
                      </span>
                    </div>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">
                      {SCENE_LABELS[task.sceneType]}
                    </span>
                    {task.note && (
                      <p className="mt-2 text-sm text-slate-500 line-clamp-2">{task.note}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                      <span>{versionCount(task.id)} 个版本</span>
                      <span>{timeAgo(task.createdAt)}</span>
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/task/${task.id}/prompts`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition"
                      >
                        进入任务
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">创建新任务</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">任务名称</label>
                <input
                  value={newTask.name}
                  onChange={(e) => setNewTask((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="输入任务名称"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">场景类型</label>
                <div className="relative">
                  <select
                    value={newTask.sceneType}
                    onChange={(e) => setNewTask((p) => ({ ...p, sceneType: e.target.value as typeof p.sceneType }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    <option value="product_intro">商品介绍</option>
                    <option value="after_sale">售后问答</option>
                    <option value="campaign_copy">活动文案</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">备注</label>
                <textarea
                  value={newTask.note}
                  onChange={(e) => setNewTask((p) => ({ ...p, note: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="可选备注信息"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowCreateModal(false); setNewTask(INITIAL_FORM) }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 hover:bg-amber-600 text-white transition"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
