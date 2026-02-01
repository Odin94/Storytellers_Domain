import { Routes, Route } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { PlaybackProvider } from '@/contexts/PlaybackContext'
import { DashboardPage } from '@/pages/DashboardPage'
import { AudioPage } from '@/pages/AudioPage'
import { ScenePage } from '@/pages/ScenePage'

const App = () => (
  <PlaybackProvider>
  <Layout>
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/audio" element={<AudioPage />} />
      <Route path="/scenes/:sceneId" element={<ScenePage />} />
    </Routes>
  </Layout>
  </PlaybackProvider>
)

export default App
