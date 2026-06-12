import { create } from 'zustand'
import type { Task, PromptVersion, Sample, TestResult, SceneType } from '@/types'

const DEFAULT_SAMPLES: Sample[] = [
  {
    id: 's1',
    category: 'product_intro',
    title: '智能手机商品介绍',
    content: '请为以下商品撰写一段电商详情页描述：星耀 X90 Pro 手机，搭载最新骁龙8 Gen3处理器，6.78英寸2K AMOLED屏幕，5000mAh大电池，1亿像素主摄，支持100W快充。目标用户为追求性能的年轻职场人群。',
    tags: ['手机', '数码', '高性能'],
    starred: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 's2',
    category: 'product_intro',
    title: '护肤品套装介绍',
    content: '请为以下商品撰写一段电商详情页描述：润颜时光修护精华套装（含精华液30ml+面霜50ml+眼霜15ml），主打烟酰胺+视黄醇配方，28天显著改善细纹和暗沉。目标用户为25-35岁关注抗初老的女性。',
    tags: ['护肤', '美妆', '抗衰老'],
    starred: false,
    createdAt: '2026-01-16T14:30:00Z',
  },
  {
    id: 's3',
    category: 'product_intro',
    title: '智能洗地机介绍',
    content: '请为以下商品撰写一段电商详情页描述：净享S1智能洗地机，干湿垃圾一次搞定，自清洁热风烘干，180°平躺深入低矮空间，续航60分钟，适用面积200㎡。目标用户为追求高效家务的家庭主妇。',
    tags: ['家电', '清洁', '智能家居'],
    starred: true,
    createdAt: '2026-01-17T09:00:00Z',
  },
  {
    id: 's4',
    category: 'after_sale',
    title: '退换货咨询',
    content: '客户咨询：我3天前买的衣服，尺码偏大想换小一码，吊牌还在没洗过，但优惠劵已经过期了，换货还能享受原来的优惠价吗？',
    tags: ['退换货', '优惠券', '尺码'],
    starred: true,
    createdAt: '2026-01-18T11:00:00Z',
  },
  {
    id: 's5',
    category: 'after_sale',
    title: '物流查询',
    content: '客户咨询：我的订单已经显示发货3天了，但物流信息一直停在"已揽收"没有更新，订单号SF1234567890，请问是什么情况？',
    tags: ['物流', '快递', '查询'],
    starred: false,
    createdAt: '2026-01-19T15:20:00Z',
  },
  {
    id: 's6',
    category: 'after_sale',
    title: '商品质量问题',
    content: '客户咨询：刚收到货就发现蓝牙耳机左耳有电流杂音，充电仓盖也关不紧，请问怎么处理？我需要退货还是可以换新？运费谁承担？',
    tags: ['质量问题', '退货', '换新'],
    starred: true,
    createdAt: '2026-01-20T08:45:00Z',
  },
  {
    id: 's7',
    category: 'campaign_copy',
    title: '618大促活动文案',
    content: '请撰写618年中大促的活动推广文案：全店满300减50，叠加品类券满500减100，前1小时限时加赠小样三件套。重点推荐夏季新品防晒系列。需要突出限时紧迫感和优惠力度。',
    tags: ['618', '大促', '满减'],
    starred: true,
    createdAt: '2026-01-21T10:00:00Z',
  },
  {
    id: 's8',
    category: 'campaign_copy',
    title: '新品首发文案',
    content: '请撰写新品首发推广文案：品牌首款智能体脂秤S2即将上市，支持20项身体指标检测，AI智能分析报告，亲友模式支持8人使用。首发价仅需99元（原价199元），限量5000台。',
    tags: ['新品', '首发', '限量'],
    starred: false,
    createdAt: '2026-01-22T13:30:00Z',
  },
  {
    id: 's9',
    category: 'campaign_copy',
    title: '会员日活动文案',
    content: '请撰写会员专享日活动文案：每月8号会员日，积分兑好礼，全场会员专享9折，消费双倍积分，积分可抵现（100积分=1元）。新会员注册即送200积分。需要强调会员专属感和积分价值。',
    tags: ['会员', '积分', '专属'],
    starred: false,
    createdAt: '2026-01-23T16:00:00Z',
  },
]

const MOCK_RESPONSES: Record<SceneType, string[]> = {
  product_intro: [
    '✨【{product}】重新定义你的生活品质！\n\n强劲性能，优雅设计，{product}为你带来前所未有的使用体验。采用行业领先技术，每一个细节都经过精心打磨，只为给你最好的。\n\n🔥 核心亮点：\n• 顶级配置，性能拉满\n• 精工细作，品质保障\n• 用户体验，全面升级\n\n💡 为什么选择{product}？因为它不只是一件商品，更是你生活品质的象征。\n\n⚡ 限时优惠中，立即下单享受专属折扣！',
    '亲爱的用户，为您隆重推荐【{product}】！\n\n在这个追求品质的时代，{product}以其卓越的表现脱颖而出。我们深知您的需求，从设计到功能，每一处都贴合您的使用习惯。\n\n🌟 产品特色：\n- 创新技术，行业领先\n- 贴心设计，使用便捷\n- 高性价比，物超所值\n\n无论工作还是生活，{product}都是您可靠的伙伴。现在购买更享首发优惠！\n\n👉 点击了解更多详情',
    '【{product}】— 你值得拥有的好物！\n\n好产品自己会说话。{product}凭借出色的性能和精良的做工，已成为众多用户的首选。\n\n📌 突出优势：\n1️⃣ 性能卓越，快人一步\n2️⃣ 品质过硬，用得放心\n3️⃣ 价格亲民，性价比高\n\n还在犹豫什么？{product}等你来体验！限时优惠，先到先得！',
  ],
  after_sale: [
    '您好！感谢您的咨询 🙏\n\n关于您提到的问题，我来为您解答：\n\n✅ 根据我们的退换货政策，您的商品在7天无理由退换货范围内，吊牌未拆、未使用，完全符合换货条件。\n\n📌 关于优惠券问题：换货订单可以保留原订单的优惠价格，请您放心。具体操作：在订单详情页点击"申请换货"，选择需要更换的尺码即可。\n\n⏰ 温馨提示：换货申请需在签收后7天内提交哦~\n\n如有其他问题，随时联系我！',
    '亲，您好！很高兴为您服务 😊\n\n关于您反馈的情况，请放心处理：\n\n🚚 物流信息停留在"已揽收"可能是以下原因：\n1. 快递中转站信息更新延迟\n2. 节假日/高峰期物流时效延长\n\n📋 建议您：\n• 等待24-48小时查看是否更新\n• 如仍未更新，我可帮您联系快递核实\n\n您方便提供一下手机号吗？我帮您查一下具体情况~',
    '您好！非常抱歉给您带来不好的体验 🙏\n\n关于您收到的商品问题：\n\n✅ 我们承诺7天质量问题免费退换，运费由我们承担。\n\n🔄 建议处理方式：\n1. 换新：重新为您寄出全新同款商品\n2. 退货：全额退款，1-3个工作日到账\n\n两种方式运费均由我方承担，请您选择方便的方式~\n\n📞 操作指引：进入"我的订单"→ 选择该订单 → 点击"申请售后"→ 选择换货/退货\n\n再次为质量问题致歉，我们会加强品控！',
  ],
  campaign_copy: [
    '🔥🔥🔥 618年中大促，错过等一年！🔥🔥🔥\n\n💰 满300减50 → 叠加满500减100 → 前1小时再加赠小样三件套！\n\n三重优惠叠加上限，聪明人都在囤！\n\n☀️ 夏日防晒系列重磅推荐：\n• 清透防晒霜 SPF50+\n• 修护防晒喷雾\n• 晒后修复面膜\n\n⏰ 6月1日0点正式开抢！\n⏰ 前1小时加赠限量小样三件套（价值99元）\n\n🛒 先加购，定好闹钟，手慢无！',
    '🎉 新品首发 | 智能体脂秤S2 来了！🎉\n\n一个人买，全家都能用！\n\n📊 20项身体指标，AI智能分析\n👨‍👩‍👧‍👦 亲友模式，支持8人使用\n💰 首发价仅99元（原价199元）\n\n⭐ 限量5000台，售完即恢复原价\n\n💡 你还在用传统体重秤？\n体重≠健康！体脂率、肌肉量、水分率……S2帮你全面了解身体状态，科学管理健康。\n\n👉 立即抢购，健康管理从今天开始！',
    '👑 每月8号会员日，尊享专属福利！👑\n\n🎁 新会员注册即送200积分\n💎 全场会员专享9折\n📈 消费双倍积分\n💰 100积分=1元直接抵现\n\n━━━━━━━━━━━━━━━\n\n🔐 会员专属，非会员无法享受！\n\n✨ 积分能做什么？\n• 购物直接抵扣现金\n• 兑换精选好礼\n• 参与积分抽奖\n\n📱 还不是会员？立即注册，200积分等你领！\n\n下个8号，我们不见不散~',
  ],
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateMockAnswer(promptContent: string, sampleContent: string, sceneType: SceneType): string {
  const responses = MOCK_RESPONSES[sceneType]
  const base = pickRandom(responses)
  const variations = [
    base,
    base.replace(/🔥/g, '⚡').replace(/💰/g, '💎'),
    base.replace(/您/g, '亲').replace(/亲爱的/g, ''),
  ]
  const seed = (promptContent + sampleContent).split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return variations[seed % variations.length]
}

interface AppState {
  tasks: Task[]
  promptVersions: PromptVersion[]
  samples: Sample[]
  testResults: TestResult[]

  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'status'>) => Task
  updateTask: (id: string, data: Partial<Task>) => void
  deleteTask: (id: string) => void

  addPromptVersion: (pv: Omit<PromptVersion, 'id' | 'updatedAt'>) => PromptVersion
  updatePromptVersion: (id: string, data: Partial<PromptVersion>) => void
  deletePromptVersion: (id: string) => void

  addSample: (sample: Omit<Sample, 'id' | 'createdAt'>) => Sample
  updateSample: (id: string, data: Partial<Sample>) => void
  deleteSample: (id: string) => void
  toggleStarSample: (id: string) => void

  addTestResult: (tr: Omit<TestResult, 'id'>) => TestResult
  updateTestResultScore: (id: string, scores: { accuracy: number; tone: number; usability: number }) => void
  deleteTestResultsByTask: (taskId: string) => void
}

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key: string, data: unknown) {
  localStorage.setItem(key, JSON.stringify(data))
}

export const useStore = create<AppState>((set, get) => ({
  tasks: loadFromStorage<Task[]>('ab_tasks', []),
  promptVersions: loadFromStorage<PromptVersion[]>('ab_prompt_versions', []),
  samples: loadFromStorage<Sample[]>('ab_samples', DEFAULT_SAMPLES),
  testResults: loadFromStorage<TestResult[]>('ab_test_results', []),

  addTask: (data) => {
    const task: Task = { ...data, id: generateId(), status: 'pending', createdAt: new Date().toISOString() }
    set((s) => {
      const tasks = [...s.tasks, task]
      saveToStorage('ab_tasks', tasks)
      return { tasks }
    })
    return task
  },

  updateTask: (id, data) => {
    set((s) => {
      const tasks = s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t))
      saveToStorage('ab_tasks', tasks)
      return { tasks }
    })
  },

  deleteTask: (id) => {
    set((s) => {
      const tasks = s.tasks.filter((t) => t.id !== id)
      const promptVersions = s.promptVersions.filter((pv) => pv.taskId !== id)
      const testResults = s.testResults.filter((tr) => tr.taskId !== id)
      saveToStorage('ab_tasks', tasks)
      saveToStorage('ab_prompt_versions', promptVersions)
      saveToStorage('ab_test_results', testResults)
      return { tasks, promptVersions, testResults }
    })
  },

  addPromptVersion: (data) => {
    const pv: PromptVersion = { ...data, id: generateId(), updatedAt: new Date().toISOString() }
    set((s) => {
      const promptVersions = [...s.promptVersions, pv]
      saveToStorage('ab_prompt_versions', promptVersions)
      return { promptVersions }
    })
    return pv
  },

  updatePromptVersion: (id, data) => {
    set((s) => {
      const promptVersions = s.promptVersions.map((pv) =>
        pv.id === id ? { ...pv, ...data, updatedAt: new Date().toISOString() } : pv
      )
      saveToStorage('ab_prompt_versions', promptVersions)
      return { promptVersions }
    })
  },

  deletePromptVersion: (id) => {
    set((s) => {
      const promptVersions = s.promptVersions.filter((pv) => pv.id !== id)
      const testResults = s.testResults.filter((tr) => tr.promptVersionId !== id)
      saveToStorage('ab_prompt_versions', promptVersions)
      saveToStorage('ab_test_results', testResults)
      return { promptVersions, testResults }
    })
  },

  addSample: (data) => {
    const sample: Sample = { ...data, id: generateId(), createdAt: new Date().toISOString() }
    set((s) => {
      const samples = [...s.samples, sample]
      saveToStorage('ab_samples', samples)
      return { samples }
    })
    return sample
  },

  updateSample: (id, data) => {
    set((s) => {
      const samples = s.samples.map((s2) => (s2.id === id ? { ...s2, ...data } : s2))
      saveToStorage('ab_samples', samples)
      return { samples }
    })
  },

  deleteSample: (id) => {
    set((s) => {
      const samples = s.samples.filter((s2) => s2.id !== id)
      const testResults = s.testResults.filter((tr) => tr.sampleId !== id)
      saveToStorage('ab_samples', samples)
      saveToStorage('ab_test_results', testResults)
      return { samples, testResults }
    })
  },

  toggleStarSample: (id) => {
    set((s) => {
      const samples = s.samples.map((s2) => (s2.id === id ? { ...s2, starred: !s2.starred } : s2))
      saveToStorage('ab_samples', samples)
      return { samples }
    })
  },

  addTestResult: (data) => {
    const tr: TestResult = { ...data, id: generateId() }
    set((s) => {
      const testResults = [...s.testResults, tr]
      saveToStorage('ab_test_results', testResults)
      return { testResults }
    })
    return tr
  },

  updateTestResultScore: (id, scores) => {
    set((s) => {
      const testResults = s.testResults.map((tr) => (tr.id === id ? { ...tr, scores, scored: true } : tr))
      saveToStorage('ab_test_results', testResults)
      return { testResults }
    })
  },

  deleteTestResultsByTask: (taskId) => {
    set((s) => {
      const testResults = s.testResults.filter((tr) => tr.taskId !== taskId)
      saveToStorage('ab_test_results', testResults)
      return { testResults }
    })
  },
}))
