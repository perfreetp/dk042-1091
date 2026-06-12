import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@/components/Layout'
import TaskBoard from '@/pages/TaskBoard'
import PromptEditor from '@/pages/PromptEditor'
import BatchTest from '@/pages/BatchTest'
import ScoreStats from '@/pages/ScoreStats'
import SampleLibrary from '@/pages/SampleLibrary'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TaskBoard />} />
          <Route path="/task/:id/prompts" element={<PromptEditor />} />
          <Route path="/task/:id/test" element={<BatchTest />} />
          <Route path="/task/:id/results" element={<ScoreStats />} />
          <Route path="/samples" element={<SampleLibrary />} />
        </Route>
      </Routes>
    </Router>
  )
}
