import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TestDriveModal from '../../components/TestDriveModal';

export default function VehicleDetail() {
  const router = useRouter();
  const { id, leadId } = router.query;
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTestDriveModal, setShowTestDriveModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  const fetchVehicle = async () => {
    setLoading(true);
    try {
      const url = `/api/vehicles/${id}${leadId ? `?leadId=${leadId}` : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setVehicle(data.vehicle);
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading vehicle details...</p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Vehicle not found</h1>
          <button
            onClick={() => router.push('/vehicles')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Browse all vehicles
          </button>
        </div>
      </div>
    );
  }

  const images = vehicle.media?.filter(m => m.media_type === 'image') || [];
  const videos = vehicle.media?.filter(m => m.media_type === 'video') || [];
  const primaryImage = images.find(img => img.is_primary) || images[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{vehicle.year} {vehicle.make} {vehicle.model} - Carforsales.net</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-4 text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to search
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images/Media */}
          <div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {primaryImage ? (
                <img
                  src={primaryImage.url}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="p-4 grid grid-cols-4 gap-2">
                  {images.slice(0, 8).map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(idx)}
                      className={`aspect-square rounded overflow-hidden border-2 ${
                        selectedImage === idx ? 'border-indigo-600' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={img.thumbnail_url || img.url}
                        alt={img.alt_text || `Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div className="p-4 border-t">
                  <h4 className="font-semibold mb-2">Videos</h4>
                  <div className="space-y-2">
                    {videos.map((video) => (
                      <div key={video.id} className="aspect-video bg-gray-900 rounded">
                        <video
                          src={video.url}
                          controls
                          className="w-full h-full"
                        >
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-3xl font-bold text-gray-800">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              {vehicle.trim && (
                <p className="text-lg text-gray-600 mt-1">{vehicle.trim}</p>
              )}
              <p className="text-4xl font-bold text-indigo-600 mt-4">
                ${parseFloat(vehicle.price).toLocaleString()}
              </p>

              {/* Key Specs */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Mileage</p>
                  <p className="font-semibold">{vehicle.mileage.toLocaleString()} mi</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Body Type</p>
                  <p className="font-semibold capitalize">{vehicle.body_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fuel Type</p>
                  <p className="font-semibold capitalize">{vehicle.fuel_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Transmission</p>
                  <p className="font-semibold capitalize">{vehicle.transmission}</p>
                </div>
                {vehicle.engine && (
                  <div>
                    <p className="text-sm text-gray-600">Engine</p>
                    <p className="font-semibold">{vehicle.engine}</p>
                  </div>
                )}
                {vehicle.horsepower && (
                  <div>
                    <p className="text-sm text-gray-600">Horsepower</p>
                    <p className="font-semibold">{vehicle.horsepower} HP</p>
                  </div>
                )}
              </div>

              {/* Dealer Info */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Dealer</p>
                <p className="font-semibold text-lg">{vehicle.dealer_name}</p>
                {vehicle.dealer_territory && (
                  <p className="text-sm text-gray-600">{vehicle.dealer_territory}</p>
                )}
              </div>

              {/* Description */}
              {vehicle.description && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{vehicle.description}</p>
                </div>
              )}

              {/* Features */}
              {vehicle.features && vehicle.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Features</h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {vehicle.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* CTA Buttons */}
              <div className="mt-8 space-y-3">
                <button
                  onClick={() => setShowTestDriveModal(true)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Schedule Test Drive
                </button>
                <button
                  className="w-full bg-white border-2 border-indigo-600 text-indigo-600 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
                >
                  Contact Dealer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Test Drive Modal */}
      {showTestDriveModal && (
        <TestDriveModal
          vehicle={vehicle}
          leadId={leadId}
          onClose={() => setShowTestDriveModal(false)}
        />
      )}
    </div>
  );
}
