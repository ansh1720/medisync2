import { useState, useEffect } from 'react';
import { hospitalAPI } from '../utils/api';
import { MapPinIcon, PhoneIcon, GlobeAltIcon, StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';

const HOSPITAL_TYPES = [
  { value: 'all', label: 'All Hospitals' },
  { value: 'general', label: 'General Hospital' },
  { value: 'specialty', label: 'Specialty Clinic' },
  { value: 'emergency', label: 'Emergency Care' },
  { value: 'pediatric', label: 'Pediatric' },
  { value: 'cardiac', label: 'Cardiac Center' },
  { value: 'cancer', label: 'Cancer Center' },
  { value: 'orthopedic', label: 'Orthopedic' },
  { value: 'mental_health', label: 'Mental Health' }
];

const DISTANCE_OPTIONS = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' }
];

function HospitalLocator() {
  const [hospitals, setHospitals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [maxDistance, setMaxDistance] = useState(25);
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Get user's current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setUserLocation(location);
        setIsGettingLocation(false);
        toast.success('Location detected successfully!');
        
        // Auto-search hospitals near user
        searchHospitals(location);
      },
      (error) => {
        console.error('Error getting location:', error);
        let message = 'Unable to get your location';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        
        toast.error(message);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Search hospitals
  const searchHospitals = async (location = userLocation) => {
    setIsLoading(true);
    
    try {
      const params = {
        radius: maxDistance, // Keep in km for nearby endpoint
        limit: 20
      };

      // Use different endpoints based on whether we have location
      let response;
      if (location) {
        // Use nearby endpoint for geolocation search
        params.lat = location.latitude;
        params.lng = location.longitude;
        
        if (selectedType !== 'all') {
          params.type = selectedType;
        }
        
        if (searchQuery.trim()) {
          params.services = searchQuery.trim(); // Search in services for nearby
        }

        console.log('Searching nearby hospitals with params:', params);
        response = await hospitalAPI.getNearbyHospitals(params);
      } else {
        // Use search endpoint for text-based search
        const searchParams = { limit: 20 };
        
        if (searchQuery.trim()) {
          searchParams.q = searchQuery.trim();
        }
        
        if (selectedType !== 'all') {
          // For search endpoint, we'll need to handle type differently
          searchParams.services = selectedType;
        }

        console.log('Searching hospitals by text with params:', searchParams);
        response = await hospitalAPI.searchHospitals(searchParams);
      }
      console.log('Hospital search response:', response.data);
      
      setHospitals(response.data.data || response.data.hospitals || []);
      
      if (response.data.data?.length === 0) {
        toast.info('No hospitals found matching your criteria');
      }
      
    } catch (error) {
      console.error('Hospital search error:', error);
      toast.error(error.response?.data?.message || 'Failed to search hospitals');
      setHospitals([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    searchHospitals();
  };

  // Get directions to hospital
  const getDirections = (hospital) => {
    if (!userLocation) {
      toast.error('Please enable location services to get directions');
      return;
    }
    
    const { latitude, longitude } = hospital.location.coordinates;
    const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${latitude},${longitude}`;
    window.open(url, '_blank');
  };

  // Format distance
  const formatDistance = (distance) => {
    if (distance < 1000) {
      return `${Math.round(distance)}m`;
    }
    return `${(distance / 1000).toFixed(1)}km`;
  };

  // Get rating stars
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon key={i} className="h-4 w-4 text-yellow-400 fill-current" />
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <StarIcon key="half" className="h-4 w-4 text-yellow-400 fill-current opacity-50" />
      );
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-gray-300" />
      );
    }
    
    return stars;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hospital Locator
          </h1>
          <p className="text-lg text-gray-600">
            Find nearby hospitals and healthcare facilities
          </p>
        </div>

        {/* Search Form */}
        <div className="card mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Location Section */}
            <div>
              <label className="label">Your Location</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  {userLocation ? (
                    <div className="input bg-green-50 text-green-700">
                      📍 Location detected ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})
                    </div>
                  ) : (
                    <div className="input bg-gray-50 text-gray-500">
                      Location not detected
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  disabled={isGettingLocation}
                  className="btn btn-secondary"
                >
                  {isGettingLocation ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Getting...
                    </div>
                  ) : (
                    'Get Location'
                  )}
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="search" className="label">Search</label>
                <input
                  id="search"
                  type="text"
                  className="input"
                  placeholder="Hospital name or speciality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="type" className="label">Hospital Type</label>
                <select
                  id="type"
                  className="input"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  {HOSPITAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="distance" className="label">Max Distance</label>
                <select
                  id="distance"
                  className="input"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                >
                  {DISTANCE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </div>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                      Search
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hospitals.map((hospital) => (
            <div key={hospital._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {hospital.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {hospital.type?.replace('_', ' ')} • {hospital.category}
                  </p>
                </div>
                
                {hospital.rating && (
                  <div className="flex items-center">
                    <div className="flex mr-1">
                      {renderStars(hospital.rating)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {hospital.rating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Address */}
              <div className="flex items-start mb-3">
                <MapPinIcon className="h-4 w-4 text-gray-400 mt-0.5 mr-2 flex-shrink-0" />
                <p className="text-sm text-gray-600">
                  {hospital.address?.street}, {hospital.address?.city}, {hospital.address?.state} {hospital.address?.zipCode}
                </p>
              </div>

              {/* Distance */}
              {hospital.distance && (
                <div className="flex items-center mb-3">
                  <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {formatDistance(hospital.distance)}
                  </div>
                </div>
              )}

              {/* Contact Info */}
              <div className="space-y-2 mb-4">
                {hospital.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a 
                      href={`tel:${hospital.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {hospital.phone}
                    </a>
                  </div>
                )}
                
                {hospital.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a 
                      href={hospital.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              {/* Services */}
              {hospital.services && hospital.services.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">SERVICES</p>
                  <div className="flex flex-wrap gap-1">
                    {hospital.services.slice(0, 3).map((service, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {service}
                      </span>
                    ))}
                    {hospital.services.length > 3 && (
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        +{hospital.services.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => getDirections(hospital)}
                  disabled={!userLocation}
                  className="btn btn-secondary flex-1 text-sm"
                >
                  Get Directions
                </button>
                {hospital.phone && (
                  <a
                    href={`tel:${hospital.phone}`}
                    className="btn btn-primary flex-1 text-sm text-center"
                  >
                    Call Now
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {!isLoading && hospitals.length === 0 && (
          <div className="text-center py-12">
            <MapPinIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
            <p className="text-gray-600 mb-4">
              Try expanding your search radius or adjusting your filters
            </p>
            <button
              onClick={getCurrentLocation}
              className="btn btn-primary"
            >
              Enable Location & Search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalLocator;