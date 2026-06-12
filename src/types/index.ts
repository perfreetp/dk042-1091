export type SceneType = 'product_intro' | 'after_sale' | 'campaign_copy'

export type TaskStatus = 'pending' | 'testing' | 'completed'

export interface Task {
  id: string
  name: string
  sceneType: SceneType
  status: TaskStatus
  createdAt: string
  note: string
}

export interface PromptVersion {
  id: string
  taskId: string
  version: string
  content: string
  note: string
  updatedAt: string
}

export interface Sample {
  id: string
  category: SceneType
  title: string
  content: string
  tags: string[]
  starred: boolean
  createdAt: string
}

export interface TestResult {
  id: string
  taskId: string
  sampleId: string
  promptVersionId: string
  answer: string
  scores: { accuracy: number; tone: number; usability: number }
  scored: boolean
}

export const SCENE_LABELS: Record<SceneType, string> = {
  product_intro: '商品介绍',
  after_sale: '售后问答',
  campaign_copy: '活动文案',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待测试',
  testing: '测试中',
  completed: '已完成',
}
