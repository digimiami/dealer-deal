import { useState } from 'react';
import Link from 'next/link';

export default function ExternalVehicleCard({ vehicle, leadId }) {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const primaryImage = vehicle.images && vehicle.images.length > 0 
    ? vehicle.images[0] 
    : null;

  const handleBookAppointment = () => {
    setShowAppointmentModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden border-2 border-blue-200">
        <div className="aspect-w-16 aspect-h-9 bg-gray-200">
          {primaryImage ? (
            <img
              src={primaryImage}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800';
              }}
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
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold text-gray-800">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h3>
              {vehicle.dealer_name && (
                <p className="text-sm text-indigo-600 mt-1">
                  {vehicle.dealer_name}
                </p>
              )}
            </div>
            {vehicle.is_external && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                External
              </span>
            )}
          </div>
          
          {vehicle.price && (
            <p className="text-2xl font-bold text-indigo-600 mt-2">
              ${parseFloat(vehicle.price).toLocaleString()}
            </p>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
            {vehicle.mileage && <span>{vehicle.mileage.toLocaleString()} mi</span>}
            {vehicle.year && <span>{vehicle.year}</span>}
          </div>

          {vehicle.description && (
            <p className="text-sm text-gray-600 mt-3 line-clamp-2">
              {vehicle.description}
            </p>
          )}

          {vehicle.images && vehicle.images.length > 0 && (
            <p className="text-xs text-gray-500 mt-2">
              {vehicle.images.length} photo{vehicle.images.length !== 1 ? 's' : ''}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            {vehicle.dealer_website && (
              <a
                href={vehicle.dealer_website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center text-sm"
              >
                View on Dealer Site
              </a>
            )}
            <button
              onClick={handleBookAppointment}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
            >
              Book Appointment
            </button>
          </div>
        </div>
      </div>

      {showAppointmentModal && (
        <ExternalAppointmentModal
          vehicle={vehicle}
          leadId={leadId}
          onClose={() => setShowAppointmentModal(false)}
        />
      )}
    </>
  );
}

function ExternalAppointmentModal({ vehicle, leadId, onClose }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerZipcode: '',
    preferredDate: '',
    preferredTime: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/appointments/external', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: leadId ? parseInt(leadId) : null,
          externalDealerId: vehicle.external_dealer_id,
          externalVehicleId: vehicle.id,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          customerZipcode: formData.customerZipcode,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          appointmentType: 'test_drive',
          notes: formData.notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to book appointment');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Appointment Booked!</h2>
          <p className="text-gray-600">The dealer will contact you to confirm your appointment.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Book Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          {vehicle.dealer_name && (
            <p className="text-sm text-gray-600">Dealer: {vehicle.dealer_name}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name *
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zip Code
            </label>
            <input
              type="text"
              value={formData.customerZipcode}
              onChange={(e) => setFormData({ ...formData, customerZipcode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="12345"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Date *
              </label>
              <input
                type="date"
                required
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Time *
              </label>
              <input
                type="time"
                required
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Any special requests or questions..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
