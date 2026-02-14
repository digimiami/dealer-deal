import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function VehicleFinder() {
  const router = useRouter();
  const { leadId, search, make, model, budget, bodyType } = router.query;
  
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    make: make || '',
    model: model || '',
    bodyType: bodyType || '',
    minPrice: '',
    maxPrice: budget || '',
    search: search || '',
  });

  useEffect(() => {
    fetchVehicles();
  }, [router.query]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: 'available',
        ...filters,
        ...router.query,
      });
      
      // Remove empty params
      Array.from(params.entries()).forEach(([key, value]) => {
        if (!value) params.delete(key);
      });

      const response = await fetch(`/api/vehicles/list?${params.toString()}`);
      const data = await response.json();

      if (response.ok) {
        setVehicles(data.vehicles || []);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const applyFilters = () => {
    const query = { ...router.query };
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        query[key] = value;
      } else {
        delete query[key];
      }
    });
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
                    placeholder="Make, model, keywords..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
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

                <button
                  onClick={applyFilters}
                  className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                  Apply Filters
                </button>
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
                <p className="text-gray-600 text-lg">No vehicles found matching your criteria.</p>
                <button
                  onClick={() => {
                    setFilters({ make: '', model: '', bodyType: '', minPrice: '', maxPrice: '', search: '' });
                    router.push('/vehicles');
                  }}
                  className="mt-4 text-indigo-600 hover:text-indigo-700"
                >
                  Clear filters and browse all vehicles
                </button>
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
