import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Chatbot from '../components/Chatbot';

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleInterest: '',
    budget: '',
    timeline: '',
    preferredContact: 'email',
  });
  const [submitting, setSubmitting] = useState(false);
  const [leadId, setLeadId] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: 'website',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit lead');
      }

      // Store lead ID and redirect to vehicle finder
      if (data.lead && data.lead.id) {
        setLeadId(data.lead.id);
        const queryParams = new URLSearchParams({
          leadId: data.lead.id,
        });
        if (formData.vehicleInterest) queryParams.append('search', formData.vehicleInterest);
        if (formData.budget) queryParams.append('budget', formData.budget);
        if (formData.make) queryParams.append('make', formData.make);
        
        router.push(`/vehicles?${queryParams.toString()}`);
      }
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        vehicleInterest: '',
        budget: '',
        timeline: '',
        preferredContact: 'email',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleVehicleRecommendation = (vehicles) => {
    if (vehicles && vehicles.length > 0) {
      const queryParams = new URLSearchParams();
      if (leadId) queryParams.append('leadId', leadId);
      if (vehicles[0].make) queryParams.append('make', vehicles[0].make);
      router.push(`/vehicles?${queryParams.toString()}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Head>
        <title>Carforsales.net - Find Your Perfect Vehicle Today</title>
        <meta name="description" content="Browse thousands of quality vehicles from trusted dealers. Get matched with your perfect car, truck, or SUV. Schedule a test drive today!" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <span className="text-2xl font-bold text-gray-800">Carforsales.net</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#vehicles" className="text-gray-600 hover:text-indigo-600 transition">Browse Vehicles</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-indigo-600 transition">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-indigo-600 transition">Testimonials</a>
              <button
                onClick={() => router.push('/vehicles')}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                Find Your Car
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }}></div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Find Your Perfect Vehicle
              <span className="block text-yellow-300">Today</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-indigo-100">
              Connect with trusted dealers. Browse thousands of quality vehicles. 
              Get matched with your dream car in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => document.getElementById('lead-form').scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
              >
                Get Started Free
              </button>
              <button
                onClick={() => router.push('/vehicles')}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-indigo-600 transition"
              >
                Browse Inventory
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture Form Section */}
      <section id="lead-form" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">
                Tell Us What You're Looking For
              </h2>
              <p className="text-xl text-gray-600">
                Get matched with the perfect vehicle from our network of trusted dealers
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label htmlFor="vehicleInterest" className="block text-sm font-medium text-gray-700 mb-2">
                    What vehicle are you interested in?
                  </label>
                  <input
                    type="text"
                    id="vehicleInterest"
                    name="vehicleInterest"
                    value={formData.vehicleInterest}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                    placeholder="e.g., 2024 Toyota Camry, Luxury SUV, Electric Vehicle"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                      Budget Range
                    </label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                    >
                      <option value="">Select budget range</option>
                      <option value="Under $20k">Under $20,000</option>
                      <option value="$20k-$30k">$20,000 - $30,000</option>
                      <option value="$30k-$50k">$30,000 - $50,000</option>
                      <option value="$50k-$100k">$50,000 - $100,000</option>
                      <option value="Over $100k">Over $100,000</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                      Purchase Timeline
                    </label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                    >
                      <option value="">Select timeline</option>
                      <option value="Immediate">Immediate (This week)</option>
                      <option value="This month">This month</option>
                      <option value="2-3 months">2-3 months</option>
                      <option value="3-6 months">3-6 months</option>
                      <option value="6+ months">6+ months or longer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="preferredContact" className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Contact Method
                  </label>
                  <select
                    id="preferredContact"
                    name="preferredContact"
                    value={formData.preferredContact}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-indigo-600 text-white rounded-lg font-semibold text-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-wait shadow-lg"
                >
                  {submitting ? 'Finding Your Perfect Vehicle...' : 'Find My Perfect Vehicle'}
                </button>

                <p className="text-sm text-gray-500 text-center">
                  By submitting this form, you agree to be contacted by our dealer network. 
                  We respect your privacy and will never share your information.
                </p>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">Simple, fast, and hassle-free car buying experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="bg-indigo-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">1. Tell Us What You Want</h3>
              <p className="text-gray-600">
                Fill out our simple form with your preferences, budget, and timeline. Our AI assistant is here to help!
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">2. Browse Matched Vehicles</h3>
              <p className="text-gray-600">
                View personalized vehicle recommendations from our network of trusted dealers with detailed photos and specs.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-pink-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-gray-800 mb-3">3. Schedule & Drive</h3>
              <p className="text-gray-600">
                Book a test drive directly online. Get instant confirmations and notifications. Drive away in your dream car!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Why Choose Carforsales.net?</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { icon: '🚗', title: 'Wide Selection', desc: 'Thousands of vehicles from trusted dealers' },
              { icon: '🤖', title: 'AI-Powered Matching', desc: 'Smart recommendations based on your preferences' },
              { icon: '💰', title: 'Best Prices', desc: 'Competitive pricing from multiple dealers' },
              { icon: '⚡', title: 'Fast & Easy', desc: 'Find and book in minutes, not days' },
              { icon: '🛡️', title: 'Trusted Dealers', desc: 'Verified network of reputable dealers' },
              { icon: '📱', title: '24/7 Support', desc: 'AI assistant available anytime to help' },
              { icon: '📸', title: 'Detailed Photos', desc: 'High-quality images and videos of every vehicle' },
              { icon: '✅', title: 'No Hidden Fees', desc: 'Transparent pricing, no surprises' },
            ].map((benefit, idx) => (
              <div key={idx} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition">
                <div className="text-4xl mb-3">{benefit.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">What Our Customers Say</h2>
            <p className="text-xl text-gray-600">Real stories from real car buyers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Sarah Johnson',
                location: 'Austin, TX',
                text: 'Found my dream car in just 2 days! The AI assistant helped me narrow down options and the dealer was amazing. Highly recommend!',
                rating: 5,
              },
              {
                name: 'Michael Chen',
                location: 'Seattle, WA',
                text: 'The test drive booking was so easy. Got matched with a great dealer and drove away in my new SUV the same week. Love this platform!',
                rating: 5,
              },
              {
                name: 'Emily Rodriguez',
                location: 'Miami, FL',
                text: 'As a first-time car buyer, I was nervous. But the chatbot answered all my questions and made the whole process stress-free. Thank you!',
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div>
                  <p className="font-semibold text-gray-800">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Find Your Perfect Vehicle?</h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join thousands of happy customers who found their dream car with us
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => document.getElementById('lead-form').scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition shadow-lg"
            >
              Get Started Now
            </button>
            <button
              onClick={() => router.push('/vehicles')}
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-indigo-600 transition"
            >
              Browse All Vehicles
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span className="text-xl font-bold text-white">Carforsales.net</span>
              </div>
              <p className="text-sm">Your trusted partner in finding the perfect vehicle.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#vehicles" className="hover:text-white transition">Browse Vehicles</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#testimonials" className="hover:text-white transition">Testimonials</a></li>
                <li><a href="/vehicles" className="hover:text-white transition">Vehicle Finder</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">For Dealers</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Carforsales.net. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* AI Chatbot */}
      <Chatbot 
        leadId={leadId} 
        sessionKey={leadId ? `lead:${leadId}` : null}
        onVehicleRecommendation={handleVehicleRecommendation}
      />
    </div>
  );
}
