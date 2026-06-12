import { useState } from 'react'
import { useStore } from '@/store'
import { SCENE_LABELS, SceneType, Sample } from '@/types'
import { Plus, Star, Trash2, Pencil, X, Search, Tag, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<SceneType, string> = {
  product_intro: 'bg-amber-400',
  after_sale: 'bg-blue-400',
  campaign_copy: 'bg-emerald-400',
}

const CATEGORY_BADGE_COLORS: Record<SceneType, string> = {
  product_intro: 'bg-amber-50 text-amber-700',
  after_sale: 'bg-blue-50 text-blue-700',
  campaign_copy: 'bg-emerald-50 text-emerald-700',
}

const CATEGORY_PILLS: { value: '' | SceneType; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'product_intro', label: '商品介绍' },
  { value: 'after_sale', label: '售后问答' },
  { value: 'campaign_copy', label: '活动文案' },
]

const emptyForm = { title: '', content: '', category: 'product_intro' as SceneType, tags: [] as string[], tagInput: '' }

export default function SampleLibrary() {
  const { samples, addSample, updateSample, deleteSample, toggleStarSample } = useStore()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState<'' | SceneType>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editSampleId, setEditSampleId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [starredOnly, setStarredOnly] = useState(false)

  const filtered = samples.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false
    if (starredOnly && !s.starred) return false
    if (search && !s.title.includes(search) && !s.content.includes(search)) return false
    return true
  })

  function openAdd() {
    setForm(emptyForm)
    setEditSampleId(null)
    setShowAddModal(true)
  }

  function openEdit(sample: Sample) {
    setForm({ title: sample.title, content: sample.content, category: sample.category, tags: [...sample.tags], tagInput: '' })
    setEditSampleId(sample.id)
    setShowAddModal(true)
  }

  function closeModal() {
    setShowAddModal(false)
    setEditSampleId(null)
    setForm(emptyForm)
  }

  function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return
    if (editSampleId) {
      updateSample(editSampleId, { title: form.title, content: form.content, category: form.category, tags: form.tags })
    } else {
      addSample({ title: form.title, content: form.content, category: form.category, tags: form.tags, starred: false })
    }
    closeModal()
  }

  function addTag() {
    const tag = form.tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag], tagInput: '' })
    }
  }

  function removeTag(tag: string) {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-amber-500" />
            样本库
          </h1>
          <p className="text-slate-500 mt-1">管理商品介绍、售后问答、活动文案等测试样本</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium">
          <Plus className="w-4 h-4" />
          添加样本
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索标题或内容..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {CATEGORY_PILLS.map((pill) => (
            <button
              key={pill.value}
              onClick={() => setFilterCategory(pill.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                filterCategory === pill.value ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setStarredOnly(!starredOnly)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            starredOnly ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          )}
        >
          <Star className={cn('w-4 h-4', starredOnly ? 'fill-amber-400 text-amber-400' : '')} />
          仅收藏
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg">暂无匹配的样本</p>
          <p className="text-sm mt-1">尝试调整筛选条件或添加新样本</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((sample) => (
            <div key={sample.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              <div className={cn('h-1', CATEGORY_COLORS[sample.category])} />
              <div className="p-4 space-y-3">
                <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', CATEGORY_BADGE_COLORS[sample.category])}>
                  {SCENE_LABELS[sample.category]}
                </span>
                <h3 className="font-semibold text-slate-800">{sample.title}</h3>
                <p className="text-sm text-slate-500 line-clamp-3">{sample.content}</p>
                {sample.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {sample.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                        <Tag className="w-3 h-3" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button onClick={() => toggleStarSample(sample.id)} className="p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <Star className={cn('w-4 h-4', sample.starred ? 'fill-amber-400 text-amber-400' : 'text-slate-300')} />
                  </button>
                  <button onClick={() => openEdit(sample)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-blue-500 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteSample(sample.id)} className="p-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-800">{editSampleId ? '编辑样本' : '添加样本'}</h2>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标题</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">分类</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as SceneType })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                >
                  {Object.entries(SCENE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">内容</label>
                <textarea
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 min-h-[200px] resize-y"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">标签</label>
                <div className="flex gap-2">
                  <input
                    value={form.tagInput}
                    onChange={(e) => setForm({ ...form, tagInput: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                  />
                  <button onClick={addTag} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors">
                    添加
                  </button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map((tag) => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-amber-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors">
                取消
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors font-medium">
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
