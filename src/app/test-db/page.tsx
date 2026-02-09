import { createClient } from '@/lib/supabase/server'
import ClientTest from './client-test'

export default async function TestDBPage() {
  let connectionStatus = {
    connected: false,
    error: null as string | null,
    profilesCount: 0,
    categoriesCount: 0,
    envVarsSet: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  }

  try {
    const supabase = await createClient()

    // Test connection with a simple query
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (testError) {
      throw new Error(`Database query failed: ${testError.message}`)
    }

    // Test 1: Check profiles table
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (profilesError) {
      throw new Error(`Profiles query failed: ${profilesError.message}`)
    }

    // Test 2: Check categories table
    const { count: categoriesCount, error: categoriesError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    if (categoriesError) {
      throw new Error(`Categories query failed: ${categoriesError.message}`)
    }

    connectionStatus = {
      connected: true,
      error: null,
      profilesCount: profilesCount || 0,
      categoriesCount: categoriesCount || 0,
      envVarsSet: connectionStatus.envVarsSet,
    }
  } catch (error: any) {
    console.error('Supabase connection test error:', error)
    connectionStatus.error = error.message || error.toString()
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Supabase Connection Test
          </h1>

          {/* Environment Variables */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold mb-3 text-lg">Environment Variables:</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.envVarsSet.url ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>NEXT_PUBLIC_SUPABASE_URL: {connectionStatus.envVarsSet.url ? '✅ Set' : '❌ Missing'}</span>
              </div>
              <div className="flex items-center">
                <span className={`w-3 h-3 rounded-full mr-2 ${connectionStatus.envVarsSet.key ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY: {connectionStatus.envVarsSet.key ? '✅ Set' : '❌ Missing'}</span>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className={`mb-6 p-4 rounded-lg ${connectionStatus.connected ? 'bg-green-50' : 'bg-red-50'}`}>
            <h2 className="font-semibold mb-3 text-lg">Connection Status:</h2>
            <div className="flex items-center text-lg">
              {connectionStatus.connected ? (
                <>
                  <span className="text-4xl mr-3">✅</span>
                  <span className="text-green-700 font-bold">Connected to Supabase!</span>
                </>
              ) : (
                <>
                  <span className="text-4xl mr-3">❌</span>
                  <span className="text-red-700 font-bold">Not Connected</span>
                </>
              )}
            </div>
            {connectionStatus.error && (
              <div className="mt-3 text-sm text-red-600 bg-red-100 p-3 rounded">
                <strong>Error:</strong> {connectionStatus.error}
              </div>
            )}
          </div>

          {/* Database Stats */}
          {connectionStatus.connected && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h2 className="font-semibold mb-3 text-lg">Database Stats:</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white rounded">
                  <span className="font-medium">Total Profiles:</span>
                  <span className="text-2xl font-bold text-purple-600">{connectionStatus.profilesCount}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-white rounded">
                  <span className="font-medium">Categories:</span>
                  <span className="text-2xl font-bold text-purple-600">{connectionStatus.categoriesCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Client-side test */}
          <ClientTest />

          {/* Next Steps */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <h2 className="font-semibold mb-3 text-lg">Next Steps:</h2>
            <ul className="space-y-2 text-sm">
              {!connectionStatus.connected ? (
                <>
                  <li>• Check your .env.local file in the nice-models folder</li>
                  <li>• Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set</li>
                  <li>• Restart the development server after changing .env.local</li>
                </>
              ) : connectionStatus.profilesCount === 0 ? (
                <>
                  <li>• ✅ Supabase is connected!</li>
                  <li>• Register a test user at <a href="/register" className="text-blue-600 hover:underline">/register</a></li>
                  <li>• Add model_details in Supabase SQL Editor</li>
                  <li>• Add photos and other test data</li>
                </>
              ) : (
                <>
                  <li>• ✅ Everything looks good!</li>
                  <li>• You have {connectionStatus.profilesCount} profile(s) in the database</li>
                  <li>• Go to <a href="/" className="text-blue-600 hover:underline">homepage</a> to see them</li>
                  <li>• Or <a href="/search" className="text-blue-600 hover:underline">search page</a></li>
                </>
              )}
            </ul>
          </div>

          {/* Links */}
          <div className="mt-6 flex gap-3">
            <a
              href="/"
              className="flex-1 bg-pink-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-pink-600 transition"
            >
              Go to Homepage
            </a>
            <a
              href="/search"
              className="flex-1 bg-purple-500 text-white text-center py-3 rounded-lg font-semibold hover:bg-purple-600 transition"
            >
              Go to Search
            </a>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mt-6 p-4 bg-gray-800 text-gray-300 rounded-lg text-xs font-mono">
          <div className="font-bold mb-2 text-white">Debug Info:</div>
          <div>URL Set: {String(connectionStatus.envVarsSet.url)}</div>
          <div>Key Set: {String(connectionStatus.envVarsSet.key)}</div>
          <div>Connected: {String(connectionStatus.connected)}</div>
          <div>Error: {connectionStatus.error || 'none'}</div>
        </div>
      </div>
    </div>
  )
}

