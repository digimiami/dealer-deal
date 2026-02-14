import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function DealerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    appointments: 0,
    vehicles: 0,
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    const userType = session.user.user_metadata?.user_type || 'customer';
    if (userType !== 'dealer') {
      router.push('/user/dashboard');
      return;
    }

    setUser({
      id: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || session.user.email,
      type: userType,
      dealerId: session.user.user_metadata?.dealer_id,
    });

    fetchDashboardData(session.user.user_metadata?.dealer_id);
  };

  const fetchDashboardData = async (dealerId) => {
    if (!dealerId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch dealer stats using Supabase
      const [leadsData, vehiclesData, appointmentsData] = await Promise.all([
        supabase.from('leads').select('*').eq('dealer_id', dealerId),
        supabase.from('vehicles').select('*').eq('dealer_id', dealerId),
        supabase.from('test_drive_appointments').select('*').eq('dealer_id', dealerId),
      ]);

      const leads = leadsData.data || [];
      const vehicles = vehiclesData.data || [];
      const appointments = appointmentsData.data || [];

      setStats({
        totalLeads: leads.length,
        newLeads: leads.filter(l => l.status === 'new').length,
        appointments: appointments.length,
        vehicles: vehicles.length,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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
        <title>Dealer Dashboard - Carforsales.net</title>
      </Head>

      {/* Header */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-2xl font-bold text-indigo-600">Carforsales.net</Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">Dealer Dashboard</span>
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
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Leads</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalLeads}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New Leads</p>
                <p className="text-3xl font-bold text-green-600">{stats.newLeads}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Appointments</p>
                <p className="text-3xl font-bold text-purple-600">{stats.appointments}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 7h14a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Vehicles</p>
                <p className="text-3xl font-bold text-blue-600">{stats.vehicles}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dealer/leads"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Leads</h3>
            <p className="text-gray-600">View and manage your assigned leads</p>
          </Link>

          <Link
            href="/dealer/vehicles"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Manage Vehicles</h3>
            <p className="text-gray-600">Add and manage your vehicle inventory</p>
          </Link>

          <Link
            href="/dealer/appointments"
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Appointments</h3>
            <p className="text-gray-600">View and manage test drive appointments</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
