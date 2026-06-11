import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import BagArchive from './pages/BagArchive'
import BagDetail from './pages/BagDetail'
import AuthGuide from './pages/AuthGuide'
import Maintenance from './pages/Maintenance'
import Market from './pages/Market'
import Statistics from './pages/Statistics'
import AppraisalList from './pages/AppraisalList'
import AppraisalDetail from './pages/AppraisalDetail'
import ConsignmentList from './pages/ConsignmentList'
import ConsignmentDetail from './pages/ConsignmentDetail'
import ValueAlertList from './pages/ValueAlertList'
import ValueAnalysisDetail from './pages/ValueAnalysisDetail'
import InsuranceDetail from './pages/InsuranceDetail'
import ClaimDetail from './pages/ClaimDetail'

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
        <Route path="/appraisals" element={<AppraisalList />} />
        <Route path="/appraisals/:id" element={<AppraisalDetail />} />
        <Route path="/consignments" element={<ConsignmentList />} />
        <Route path="/consignments/:id" element={<ConsignmentDetail />} />
        <Route path="/value-alerts" element={<ValueAlertList />} />
        <Route path="/value-analysis/:id" element={<ValueAnalysisDetail />} />
        <Route path="/insurance/:id" element={<InsuranceDetail />} />
        <Route path="/claims/:id" element={<ClaimDetail />} />
      </Routes>
    </Layout>
  )
}

export default App
