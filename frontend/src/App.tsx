import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import BagArchive from './pages/BagArchive'
import BagDetail from './pages/BagDetail'
import AuthGuide from './pages/AuthGuide'
import Maintenance from './pages/Maintenance'
import Market from './pages/Market'
import Statistics from './pages/Statistics'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<BagArchive />} />
        <Route path="/bags/:id" element={<BagDetail />} />
        <Route path="/auth-guide" element={<AuthGuide />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/market" element={<Market />} />
        <Route path="/stats" element={<Statistics />} />
      </Routes>
    </Layout>
  )
}

export default App
