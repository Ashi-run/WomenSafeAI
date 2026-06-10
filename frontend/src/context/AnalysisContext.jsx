import { createContext, useContext, useState } from 'react'

const AnalysisContext = createContext(null)

export function AnalysisProvider({ children }) {
  const [analysisInput, setAnalysisInput]   = useState(null)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isLoading, setIsLoading]           = useState(false)
  const [error, setError]                   = useState(null)

  const resetAnalysis = () => {
    setAnalysisInput(null)
    setAnalysisResult(null)
    setError(null)
    setIsLoading(false)
  }

  return (
    <AnalysisContext.Provider value={{
      analysisInput,  setAnalysisInput,
      analysisResult, setAnalysisResult,
      isLoading,      setIsLoading,
      error,          setError,
      resetAnalysis,
    }}>
      {children}
    </AnalysisContext.Provider>
  )
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext)
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider')
  return ctx
}
