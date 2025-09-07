'use client'

export default function DebugAuth() {
  const checkAuth = () => {
    console.log('🔍 Debug: Starting manual auth check')
    
    // Check localStorage directly
    const mockData = localStorage.getItem('mockAuth')
    console.log('🔍 Debug: localStorage mockAuth:', mockData)
    
    if (mockData) {
      try {
        const parsed = JSON.parse(mockData)
        console.log('🔍 Debug: Parsed mockAuth:', parsed)
      } catch (e) {
        console.log('🔍 Debug: Error parsing mockAuth:', e)
      }
    }
    
    // Check if user is authenticated
    const isAuthenticated = mockData && JSON.parse(mockData).authenticated
    console.log('🔍 Debug: Is authenticated:', isAuthenticated)
    
    return { mockData, isAuthenticated }
  }
  
  const authState = checkAuth()
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Authentication</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">localStorage mockAuth:</h2>
          <pre className="text-sm mt-2 overflow-auto">
            {authState.mockData || 'null'}
          </pre>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Is Authenticated:</h2>
          <p className="text-sm mt-2">
            {authState.isAuthenticated ? '✅ Yes' : '❌ No'}
          </p>
        </div>
        
        <button 
          onClick={checkAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Check
        </button>
      </div>
    </div>
  )
}
