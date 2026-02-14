import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

// Helper function to parse budget range to max price number
function parseBudgetToMaxPrice(budget) {
  if (!budget || typeof budget !== 'string') return '';
  
  // Extract number from budget strings like "$20k-$30k" or "Under $20k"
  if (budget.includes('Under')) {
    const match = budget.match(/\$?(\d+)k?/i);
    return match ? (parseInt(match[1]) * 1000).toString() : '';
  } else if (budget.includes('Over')) {
    const match = budget.match(/\$?(\d+)k?/i);
    return match ? (parseInt(match[1]) * 1000).toString() : '';
  } else if (budget.includes('-')) {
    // For ranges like "$20k-$30k", use the upper bound
    const parts = budget.split('-');
    if (parts.length === 2) {
      const match = parts[1].match(/\$?(\d+)k?/i);
      return match ? (parseInt(match[1]) * 1000).toString() : '';
    }
  }
  
  // If it's already a number string, return it
  if (!isNaN(parseFloat(budget))) {
    return budget;
  }
  
  return '';
}

export default function VehicleFinder() {
  const router = useRouter();
  const { leadId, search, make, model, budget, bodyType } = router.query;
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dbMessage, setDbMessage] = useState('');
  const [filters, setFilters] = useState({
    make: make || '',
    model: model || '',
    bodyType: bodyType || '',
    minPrice: '',
    maxPrice: parseBudgetToMaxPrice(budget) || '',
    search: search || '',
  });

  // Update filters when router query changes
  useEffect(() => {
    const budgetValue = router.query.budget || '';
    setFilters({
      make: router.query.make || '',
      model: router.query.model || '',
      bodyType: router.query.bodyType || '',
      minPrice: router.query.minPrice || '',
      maxPrice: parseBudgetToMaxPrice(budgetValue) || router.query.maxPrice || '',
      search: router.query.search || '',
    });
  }, [router.query]);

  // Fetch vehicles when router query changes
  useEffect(() => {
    fetchVehicles();
    
    // If searchDealers flag is set, search for external dealers
    if (router.query.searchDealers === 'true' && router.query.zipcode) {
      searchExternalDealers(router.query.zipcode);
    }
  }, [router.query]);

  const searchExternalDealers = async (zipcode) => {
    try {
      const response = await fetch('/api/dealers/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipcode,
          radius: 25,
          vehicleInterest: router.query.search || '',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.dealers) {
        // Merge external vehicles with existing vehicles
        const externalVehicles = [];
        data.dealers.forEach(dealer => {
          if (dealer.vehicles && dealer.vehicles.length > 0) {
            dealer.vehicles.forEach(vehicle => {
              externalVehicles.push({
                ...vehicle,
                dealer_name: dealer.name,
                dealer_website: dealer.website_url,
                is_external: true,
                external_dealer_id: dealer.id,
              });
            });
          }
        });

        // Update vehicles state with external vehicles
        setVehicles(prev => [...prev, ...externalVehicles]);
      }
    } catch (error) {
      console.error('Error searching external dealers:', error);
    }
  };

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    setDbMessage('');
    try {
      const params = new URLSearchParams({
        status: 'available',
        ...router.query,
      });
      
      // Remove empty params
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value || value === 'undefined') params.delete(key);
      });

      const response = await fetch(`/api/vehicles/list?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.vehicles || []);
        if (data.message) {
          setDbMessage(data.message);
        }
      } else {
        setError(data.error || 'Failed to fetch vehicles');
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const applyFilters = () => {
    const query = { ...router.query };
    // Preserve leadId if it exists
    if (router.query.leadId) {
      query.leadId = router.query.leadId;
    }
    
    // Update query with filter values
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim()) {
        query[key] = value.trim();
      } else {
        delete query[key];
      }
    });
    
    router.push({ pathname: '/vehicles', query }, undefined, { shallow: false });
  };

  const clearFilters = () => {
    const query = {};
    if (router.query.leadId) {
      query.leadId = router.query.leadId;
    }
    setFilters({ make: '', model: '', bodyType: '', minPrice: '', maxPrice: '', search: '' });
    router.push({ pathname: '/vehicles', query });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Find Your Perfect Vehicle - Carforsales.net</title>
      </Head>

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Find Your Perfect Vehicle</h1>
          <p className="text-gray-600 mt-1">Browse our extensive inventory</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Filters</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    placeholder="Make, model, keywords..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Press Enter to search</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                  <input
                    type="text"
                    value={filters.make}
                    onChange={(e) => handleFilterChange('make', e.target.value)}
                    placeholder="e.g., Toyota"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                  <select
                    value={filters.bodyType}
                    onChange={(e) => handleFilterChange('bodyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Types</option>
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="truck">Truck</option>
                    <option value="coupe">Coupe</option>
                    <option value="convertible">Convertible</option>
                    <option value="hatchback">Hatchback</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="e.g., 50000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    title="Clear all filters"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-600">Loading vehicles...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                {dbMessage ? (
                  <>
                    <div className="mb-4">
                      <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Database Not Configured</h3>
                    <p className="text-gray-600 mb-4">{dbMessage}</p>
                    <p className="text-sm text-gray-500 mb-4">
                      To view vehicles, you need to set up a PostgreSQL database and add vehicle data.
                    </p>
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left text-sm">
                      <p className="font-semibold mb-2">Quick Setup:</p>
                      <ol className="list-decimal list-inside space-y-1 text-gray-700">
                        <li>Add PostgreSQL database in Vercel (Storage → Postgres)</li>
                        <li>Run database migrations</li>
                        <li>Add vehicle data using the seed file</li>
                      </ol>
                    </div>
                  </>
                ) : error ? (
                  <>
                    <p className="text-red-600 text-lg mb-2">Error: {error}</p>
                    <button
                      onClick={fetchVehicles}
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 text-lg mb-4">No vehicles found matching your criteria.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                    >
                      Clear Filters
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/vehicles/${vehicle.id}${leadId ? `?leadId=${leadId}` : ''}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                  >
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      {vehicle.primary_image ? (
                        <img
                          src={vehicle.primary_image}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      {vehicle.trim && (
                        <p className="text-sm text-gray-600">{vehicle.trim}</p>
                      )}
                      <p className="text-2xl font-bold text-indigo-600 mt-2">
                        ${parseFloat(vehicle.price).toLocaleString()}
                      </p>
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <span>{vehicle.mileage.toLocaleString()} mi</span>
                        <span>{vehicle.body_type}</span>
                        {vehicle.fuel_type && <span>{vehicle.fuel_type}</span>}
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        <p>Dealer: {vehicle.dealer_name}</p>
                        {vehicle.media_count > 0 && (
                          <p>{vehicle.media_count} photo{vehicle.media_count !== 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
