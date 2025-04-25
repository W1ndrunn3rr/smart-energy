import { useState } from 'react';
import { getUser } from './scripts/api';



function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUser = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getUser(id);
      setUser(userData);
    } catch (err) {
      setError('Failed to fetch user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ars-whitegrey py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden border border-ars-lightlightgrey">
        {/* Nagłówek z logo */}
        <div className="bg-ars-deepblue p-4 flex items-center">
          <div className="mr-4">
            <div className="w-12 h-12 bg-ars-lightblue rounded flex items-center justify-center text-white font-bold">
              <div>
                <img
                  src="ars.jpg"
                  alt="ARS System Logo"
                  className="h-12 mr-4"
                />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">User Data Fetcher</h1>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-8">
            <button
              onClick={() => fetchUser(1)}
              disabled={loading}
              className={`px-6 py-3 rounded-md text-white font-medium ${loading
                ? 'bg-ars-lightgrey cursor-not-allowed'
                : 'bg-ars-green hover:bg-ars-lightgreen'
                } transition-colors shadow-md`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </span>
              ) : (
                'Get User Data'
              )}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {user && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-ars-darkgrey">User Details</h2>
              <div className="bg-ars-whitegrey p-4 rounded-lg border border-ars-lightlightgrey">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-ars-lightgrey">Email</p>
                    <p className="mt-1 text-sm text-ars-darkgrey">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ars-lightgrey">Password</p>
                    <p className="mt-1 text-sm text-ars-darkgrey">
                      {'•'.repeat(user.password ? user.password.length : 8)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!user && !loading && !error && (
            <div className="text-center py-8">
              <p className="text-ars-lightgrey">No user data available. Click the button to fetch.</p>
            </div>
          )}
        </div>

        {/* Stopka */}
        <div className="bg-ars-whitegrey px-6 py-3 border-t border-ars-lightlightgrey">
          <p className="text-xs text-ars-lightgrey text-center">
            © {new Date().getFullYear()} ARS System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;