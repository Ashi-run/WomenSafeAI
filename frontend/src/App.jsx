import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import AnalyzePage from './pages/AnalyzePage'
import ResultsPage from './pages/ResultsPage'
import SafetyCenterPage from './pages/SafetyCenterPage'
import SafetyTopicPage from './pages/SafetyTopicPage'
import AboutPage from './pages/AboutPage'
import FaqPage from './pages/FaqPage'
import ContactPage from './pages/ContactPage'
import NotFoundPage from './pages/NotFoundPage'
import { AnalysisProvider } from './context/AnalysisContext'
import ScrollToTop from './components/layout/ScrollToTop'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalysisProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/"               element={<LandingPage />} />
            <Route path="/analyze"        element={<AnalyzePage />} />
            <Route path="/results"        element={<ResultsPage />} />
            <Route path="/safety-center"  element={<SafetyCenterPage />} />
            <Route path="/safety-center/:topic" element={<SafetyTopicPage />} />
            <Route path="/about"          element={<AboutPage />} />
            <Route path="/faq"            element={<FaqPage />} />
            <Route path="/contact"        element={<ContactPage />} />
            <Route path="*"               element={<NotFoundPage />} />
          </Route>
        </Routes>
      </AnalysisProvider>
    </BrowserRouter>
  )
}
