import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.type === 'dealer') {
        router.push('/dealer/dashboard');
        return;
      }
      setUser(parsedUser);
      fetchUserData(token, parsedUser.email);
    } catch (error) {
      router.push('/login');
    }
  }, []);

  const fetchUserData = async (token, email) => {
    try {
      // Fetch user's leads
      const response = await fetch('/api/user/leads', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) {
        setLeads(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>My Dashboard - Carforsales.net</title>
      </Head>

      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-indigo-600">Carforsales.net</Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">My Dashboard</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">My Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Inquiries */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">My Inquiries</h2>
              {leads.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">You haven't submitted any inquiries yet.</p>
                  <Link
                    href="/"
                    className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Browse Vehicles
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {leads.map((lead) => (
                    <div key={lead.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-800">{lead.vehicle_interest || 'General Inquiry'}</h3>
                          <p className="text-sm text-gray-600">Status: <span className="capitalize">{lead.status}</span></p>
                          <p className="text-sm text-gray-600">Submitted: {new Date(lead.created_at).toLocaleDateString()}</p>
                        </div>
                        {lead.dealer_name && (
                          <span className="text-sm text-indigo-600">{lead.dealer_name}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Vehicles */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Saved Vehicles</h2>
              {favorites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">No saved vehicles yet.</p>
                  <Link
                    href="/vehicles"
                    className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Browse Vehicles
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {favorites.map((vehicle) => (
                    <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-800">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-indigo-600 font-semibold">${vehicle.price.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  href="/vehicles"
                  className="block w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-center"
                >
                  Browse Vehicles
                </Link>
                <Link
                  href="/"
                  className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-center"
                >
                  Submit New Inquiry
                </Link>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Account Information</h3>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {user?.name}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                {user?.phone && (
                  <p><span className="font-medium">Phone:</span> {user.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
