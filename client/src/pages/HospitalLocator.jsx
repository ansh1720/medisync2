import { useState, useEffect } from 'react';
import { hospitalAPI } from '../utils/api';
import { MapPinIcon, PhoneIcon, GlobeAltIcon, StarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import HospitalMap from '../components/HospitalMap';
import { geocodePlace } from '../utils/geocoding';
import { fetchHospitalsFromMaps, searchHospitalsByPlace, getFallbackHospitals } from '../utils/googleMapsIntegration';
import { debouncedHybridSearch } from '../utils/autocomplete';

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
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 250, label: '250 km' },
  { value: 500, label: '500 km' }
];

function HospitalLocator() {
  const [hospitals, setHospitals] = useState([]);
  const [allHospitals, setAllHospitals] = useState([]); // Store all hospitals
  const [filteredHospitals, setFilteredHospitals] = useState([]); // Filtered results for list view
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [maxDistance, setMaxDistance] = useState(100); // Increased default radius
  const [searchFilters, setSearchFilters] = useState({
    services: '',
    minRating: 0,
    emergencyOnly: false,
    verifiedOnly: false
  });
  const [userLocation, setUserLocation] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [viewMode, setViewMode] = useState('map'); // Default to 'map' to showcase the new map
  const [placeSearch, setPlaceSearch] = useState('');
  const [isSearchingPlace, setIsSearchingPlace] = useState(false);
  const [currentLocationName, setCurrentLocationName] = useState('');
  const [dataSource, setDataSource] = useState('maps'); // Always use real data now
  const [isLoadingRealData, setIsLoadingRealData] = useState(false);
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  // Hospital search autocomplete states
  const [hospitalSuggestions, setHospitalSuggestions] = useState([]);
  const [showHospitalSuggestions, setShowHospitalSuggestions] = useState(false);
  const [selectedHospitalIndex, setSelectedHospitalIndex] = useState(-1);

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
        console.log('User location detected:', location);
        
        // Auto-search hospitals near user
        console.log('Starting auto-search for hospitals...');
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

  // Handle place search (like Google search)
  const handlePlaceSearch = async () => {
    if (!placeSearch.trim()) {
      toast.error('Please enter a place name');
      return;
    }
    
    setIsSearchingPlace(true);
    
    try {
      const result = await geocodePlace(placeSearch.trim());
      
      if (result.success) {
        const location = {
          latitude: result.latitude,
          longitude: result.longitude
        };
        
        setUserLocation(location);
        setCurrentLocationName(result.displayName);
        toast.success(`Location found: ${result.displayName.split(',')[0]}`);
        
        // Search hospitals near this location with real data
        await searchHospitals(location);
        
        // Also try to get real hospital data specifically for this place
        try {
          await fetchRealHospitalData(location, 'place');
        } catch (error) {
          console.log('Place-specific hospital search failed:', error);
        }
        
        setPlaceSearch('');
      } else {
        toast.error(result.error || 'Location not found. Try a different place name.');
      }
    } catch (error) {
      console.error('Place search error:', error);
      toast.error('Failed to search for location');
    } finally {
      setIsSearchingPlace(false);
    }
  };

  // Reset location
  const resetLocation = () => {
    setUserLocation(null);
    setCurrentLocationName('');
    setPlaceSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    toast.success(`Showing all ${allHospitals.length} hospitals`);
  };

  // Handle autocomplete input changes for place search
  const handleSearchInputChange = async (value) => {
    setPlaceSearch(value);
    
    if (value.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsLoadingSuggestions(true);
    setShowSuggestions(true);
    
    try {
      const results = await debouncedHybridSearch(value, 8, allHospitals);
      setSuggestions(results);
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Handle hospital search autocomplete
  const handleHospitalSearchChange = (value) => {
    setSearchQuery(value);
    
    if (value.length < 1) {
      setHospitalSuggestions([]);
      setShowHospitalSuggestions(false);
      return;
    }
    
    // Get hospital suggestions from loaded hospitals
    const suggestions = allHospitals
      .filter(hospital => {
        const query = value.toLowerCase();
        return hospital.name.toLowerCase().includes(query) ||
               hospital.specialties?.toLowerCase().includes(query) ||
               hospital.type?.toLowerCase().includes(query) ||
               hospital.address?.city?.toLowerCase().includes(query);
      })
      .slice(0, 8)
      .map(hospital => ({
        name: hospital.name,
        displayName: `${hospital.name} - ${hospital.address?.city || 'Hospital'}`,
        type: hospital.type || 'hospital',
        specialties: hospital.specialties,
        rating: hospital.rating?.overall,
        distance: hospital.distance,
        hospitalData: hospital
      }));
    
    setHospitalSuggestions(suggestions);
    setShowHospitalSuggestions(suggestions.length > 0);
  };

  // Handle hospital suggestion selection
  const handleHospitalSuggestionSelect = (suggestion) => {
    setSearchQuery(suggestion.name);
    setShowHospitalSuggestions(false);
    setHospitalSuggestions([]);
    setSelectedHospitalIndex(-1);
    
    // Optional: Focus on the selected hospital
    if (suggestion.hospitalData) {
      // Could scroll to hospital in list or highlight on map
      console.log('Selected hospital:', suggestion.hospitalData);
    }
  };

  // Handle keyboard navigation for hospital suggestions
  const handleHospitalKeyDown = (e) => {
    if (!showHospitalSuggestions || hospitalSuggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedHospitalIndex(prev => 
          prev < hospitalSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedHospitalIndex(prev => 
          prev > 0 ? prev - 1 : hospitalSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedHospitalIndex >= 0) {
          handleHospitalSuggestionSelect(hospitalSuggestions[selectedHospitalIndex]);
        }
        break;
      case 'Escape':
        setShowHospitalSuggestions(false);
        setSelectedHospitalIndex(-1);
        break;
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    setPlaceSearch(suggestion.name);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    
    // If it's a hospital suggestion, handle differently
    if (suggestion.type === 'hospital' && suggestion.hospitalData) {
      // Set search query to filter to this hospital
      setSearchQuery(suggestion.name);
      toast.success(`Filtering hospitals for: ${suggestion.name}`);
      return;
    }
    
    setIsSearchingPlace(true);
    
    try {
      let location;
      
      if (suggestion.lat && suggestion.lon) {
        // Use coordinates from suggestion
        location = {
          latitude: suggestion.lat,
          longitude: suggestion.lon
        };
      } else {
        // Geocode the suggestion
        const result = await geocodePlace(suggestion.name);
        if (!result.success) {
          throw new Error(result.error || 'Failed to geocode location');
        }
        
        location = {
          latitude: result.latitude,
          longitude: result.longitude
        };
      }
      
      setUserLocation(location);
      setCurrentLocationName(suggestion.displayName || suggestion.name);
      toast.success(`Location set: ${suggestion.name}`);
      
      // Search hospitals near this location
      await searchHospitals(location);
      await fetchRealHospitalData(location, 'place');
      
    } catch (error) {
      console.error('Error selecting suggestion:', error);
      toast.error('Failed to set location');
    } finally {
      setIsSearchingPlace(false);
    }
  };

  // Handle keyboard navigation for suggestions
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        } else {
          handlePlaceSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Load all hospitals on component mount
  useEffect(() => {
    const loadAllHospitals = async () => {
      setIsLoading(true);
      try {
        console.log('Loading all hospitals...');
        const response = await hospitalAPI.getAllHospitals();
        console.log('All hospitals response:', response.data);
        
        // Extract hospitals array from nested response structure
        const hospitalsArray = response.data.data?.hospitals || response.data.hospitals || [];
        console.log('Extracted hospitals array:', hospitalsArray);
        
        setAllHospitals(hospitalsArray); // Store all hospitals
        setHospitals(hospitalsArray); // Map shows all hospitals
        setFilteredHospitals(hospitalsArray); // Initial filtered list
        
        if (hospitalsArray.length > 0) {
          toast.success(`Loaded ${hospitalsArray.length} hospitals`);
        }
      } catch (error) {
        console.error('Error loading hospitals:', error);
        toast.error('Failed to load hospitals');
        setAllHospitals([]);
        setHospitals([]);
        setFilteredHospitals([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAllHospitals();
  }, []);

  // Real-time filtering function (like Google Maps)
  useEffect(() => {
    let filtered = [...allHospitals];
    
    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(hospital => 
        hospital.name.toLowerCase().includes(query) ||
        hospital.specialties?.toLowerCase().includes(query) ||
        hospital.type?.toLowerCase().includes(query) ||
        hospital.address?.city?.toLowerCase().includes(query) ||
        hospital.address?.state?.toLowerCase().includes(query) ||
        hospital.contact?.phone?.includes(query)
      );
    }
    
    // Apply hospital type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(hospital => hospital.type === selectedType);
    }
    
    // Apply advanced filters
    if (searchFilters.services) {
      const services = searchFilters.services.toLowerCase();
      filtered = filtered.filter(hospital => 
        hospital.specialties?.toLowerCase().includes(services) ||
        hospital.services?.some(service => service.toLowerCase().includes(services))
      );
    }
    
    if (searchFilters.minRating > 0) {
      filtered = filtered.filter(hospital => 
        hospital.rating?.overall >= searchFilters.minRating
      );
    }
    
    if (searchFilters.emergencyOnly) {
      filtered = filtered.filter(hospital => 
        hospital.specialties?.includes('emergency') || 
        hospital.type === 'emergency'
      );
    }
    
    if (searchFilters.verifiedOnly) {
      filtered = filtered.filter(hospital => 
        hospital.isVerified === true
      );
    }
    
    // Apply distance filter if location is available
    if (userLocation && maxDistance < 500) {
      filtered = filtered.filter(hospital => {
        const [lng, lat] = hospital.location.coordinates;
        const distance = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          lat, 
          lng
        );
        return distance <= maxDistance;
      });
    }
    
    setFilteredHospitals(filtered);
    
    // Always show all hospitals on map, but update the list view
    setHospitals(allHospitals); // Map shows all hospitals
    
  }, [searchQuery, selectedType, searchFilters, userLocation, maxDistance, allHospitals]);

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  // Search hospitals (now mainly for location-based sorting)
  // Fetch hospitals from real-world data sources
  const fetchRealHospitalData = async (location = userLocation, source = 'maps') => {
    if (!location) return;
    
    setIsLoadingRealData(true);
    setDataSource(source);
    
    try {
      let result;
      
      if (source === 'maps') {
        // Fetch hospitals from OpenStreetMap/Overpass API
        result = await fetchHospitalsFromMaps(location.latitude, location.longitude, 25000);
      } else if (source === 'place') {
        // Search hospitals by place name
        const placeName = currentLocationName || 'hospitals near me';
        result = await searchHospitalsByPlace(placeName);
      }
      
      if (result.success && result.hospitals.length > 0) {
        setAllHospitals(result.hospitals);
        toast.success(`Found ${result.hospitals.length} real hospitals from ${result.source}`);
        console.log(`Loaded ${result.hospitals.length} hospitals from ${result.source}`);
      } else {
        // Fallback to major city data if no results
        const cityName = currentLocationName || 'New York';
        const fallbackHospitals = getFallbackHospitals(cityName);
        
        if (fallbackHospitals.length > 0) {
          setAllHospitals(fallbackHospitals);
          toast.success(`Using ${fallbackHospitals.length} hospitals for ${cityName}`);
        } else {
          toast.error('No hospital data available for this location');
        }
      }
    } catch (error) {
      console.error('Error fetching real hospital data:', error);
      toast.error('Failed to load real hospital data');
    } finally {
      setIsLoadingRealData(false);
    }
  };

  const searchHospitals = async (location = userLocation) => {
    if (!location) {
      console.log('No location available for search');
      return;
    }

    setIsLoading(true);
    
    try {
      // Always fetch real-world hospital data
      await fetchRealHospitalData(location, 'maps');
      
    } catch (error) {
      console.error('Error searching hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setIsLoading(false);
    }
  };

  // Get directions to hospital
  const getDirections = (hospital) => {
    console.log('Get directions clicked for hospital:', hospital.name);
    
    if (!userLocation) {
      toast.error('Please set your location first to get directions');
      return;
    }
    
    try {
      // Hospital coordinates are stored as [longitude, latitude]
      const [longitude, latitude] = hospital.location.coordinates;
      
      // Build hospital destination - prefer address over coordinates
      let hospitalDestination;
      if (hospital.address && hospital.address.street && hospital.address.city) {
        // Use full address if available
        const address = [
          hospital.address.street,
          hospital.address.city,
          hospital.address.state,
          hospital.address.country
        ].filter(Boolean).join(', ');
        hospitalDestination = encodeURIComponent(`${hospital.name}, ${address}`);
      } else if (hospital.address && hospital.address.city) {
        // Use hospital name + city
        hospitalDestination = encodeURIComponent(`${hospital.name}, ${hospital.address.city}`);
      } else {
        // Fallback to coordinates
        hospitalDestination = `${latitude},${longitude}`;
      }
      
      // Build user origin - prefer location name over coordinates  
      let userOrigin;
      if (currentLocationName && currentLocationName.trim()) {
        userOrigin = encodeURIComponent(currentLocationName);
      } else {
        userOrigin = `${userLocation.latitude},${userLocation.longitude}`;
      }
      
      // Build Google Maps directions URL
      const url = `https://www.google.com/maps/dir/${userOrigin}/${hospitalDestination}`;
      
      console.log('Opening directions URL:', url);
      console.log('User location:', userLocation, 'Name:', currentLocationName);
      console.log('Hospital location:', { latitude, longitude, name: hospital.name });
      console.log('Hospital address:', hospital.address);
      
      // Open Google Maps in new tab
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        toast.success(`Opening directions to ${hospital.name}...`);
      } else {
        // Fallback: copy URL to clipboard if popup blocked
        navigator.clipboard.writeText(url).then(() => {
          toast.success('Directions URL copied to clipboard!');
        }).catch(() => {
          toast.error('Please allow popups or copy this URL: ' + url);
        });
      }
      
    } catch (error) {
      console.error('Error opening directions:', error);
      toast.error('Failed to open directions. Please try again.');
    }
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
          <div className="space-y-6">
            {/* Location Section */}
            <div>
              <label className="label">Your Location (Optional - Leave blank to see all hospitals)</label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    {userLocation ? (
                      <div className="input bg-green-50 text-green-700">
                        Location set: {currentLocationName || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
                      </div>
                    ) : (
                      <div className="input bg-blue-50 text-blue-700">
                        Showing all hospitals - Add location for distance-based search
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
                      'Auto Detect'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nycLocation = { latitude: 40.7128, longitude: -74.0060 };
                      setUserLocation(nycLocation);
                      setCurrentLocationName('New York, NY');
                      toast.success('Test location set to NYC');
                      searchHospitals(nycLocation);
                    }}
                    className="btn btn-secondary text-sm"
                  >
                    Test NYC
                  </button>
                  {userLocation && (
                    <button
                      type="button"
                      onClick={resetLocation}
                      className="btn btn-secondary text-sm bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      Reset
                    </button>
                  )}
                </div>
                
                {/* Directions Info */}
                {!userLocation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Get Directions:</strong> Set your location above to enable "Get Directions" buttons that will open 
                      Google Maps with turn-by-turn navigation to any hospital.
                    </p>
                  </div>
                )}
                
                {/* Advanced Place Search with Autocomplete */}
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-3">🔍 Search Any Location or Hospital</h4>
                  <div className="relative">
                    <div className="flex gap-3">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          className="input w-full pr-10"
                          placeholder="Type place names (va for Vapi, Valsad) OR hospital names..."
                          value={placeSearch}
                          onChange={(e) => handleSearchInputChange(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onFocus={() => placeSearch.length >= 2 && setShowSuggestions(true)}
                          onBlur={() => {
                            // Delay hiding suggestions to allow click
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                        />
                        {isLoadingSuggestions && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          </div>
                        )}
                        
                        {/* Autocomplete Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            {suggestions.map((suggestion, index) => (
                              <div
                                key={`${suggestion.name}-${index}`}
                                className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                  index === selectedSuggestionIndex ? 'bg-blue-50 border-blue-200' : ''
                                }`}
                                onClick={() => handleSuggestionSelect(suggestion)}
                              >
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 mr-2">
                                    {suggestion.type === 'hospital' ? (
                                      <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                                        <span className="text-red-600 text-xs">🏥</span>
                                      </div>
                                    ) : (
                                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">
                                      {suggestion.name}
                                    </div>
                                    <div className="text-sm text-gray-600 truncate">
                                      {suggestion.specialties && suggestion.type === 'hospital' && (
                                        <span className="text-blue-600">{suggestion.specialties} • </span>
                                      )}
                                      {suggestion.displayName}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {suggestion.rating && suggestion.type === 'hospital' && (
                                      <div className="flex items-center">
                                        <StarIcon className="h-3 w-3 text-yellow-400 fill-current" />
                                        <span className="text-xs font-medium ml-1">{suggestion.rating}</span>
                                      </div>
                                    )}
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                      suggestion.type === 'hospital'
                                        ? 'bg-red-100 text-red-800'
                                        : suggestion.confidence === 'high' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                      {suggestion.type}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* No suggestions message */}
                        {showSuggestions && !isLoadingSuggestions && suggestions.length === 0 && placeSearch.length >= 2 && (
                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                            <div className="text-gray-500 text-center">
                              <MagnifyingGlassIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                              <p>No suggestions found for "{placeSearch}"</p>
                              <p className="text-xs mt-1">Try typing a different place name</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handlePlaceSearch}
                        disabled={isSearchingPlace || !placeSearch.trim()}
                        className="btn btn-primary"
                      >
                        {isSearchingPlace ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Searching...
                          </div>
                        ) : (
                          'Search'
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <p className="text-xs text-gray-600 w-full">
                      💡 <strong>Smart Search:</strong> Type partial names like "va" for places (Vapi, Valsad) OR hospital names for direct filtering!
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['Mumbai', 'Delhi', 'Bangalore', 'Vapi', 'Valsad', 'Chennai'].map((city) => (
                        <button
                          key={city}
                          onClick={() => handleSearchInputChange(city)}
                          className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-4">
              {/* Main Search Bar - Google Maps Style with Hospital Autocomplete */}
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search hospitals, specialties, or services... (e.g., 'cardiology', 'emergency', 'Mount Sinai')"
                      value={searchQuery}
                      onChange={(e) => handleHospitalSearchChange(e.target.value)}
                      onKeyDown={handleHospitalKeyDown}
                      onFocus={() => searchQuery.length >= 1 && hospitalSuggestions.length > 0 && setShowHospitalSuggestions(true)}
                      onBlur={() => {
                        // Delay hiding suggestions to allow click
                        setTimeout(() => setShowHospitalSuggestions(false), 200);
                      }}
                    />
                    
                    {/* Hospital Autocomplete Suggestions Dropdown */}
                    {showHospitalSuggestions && hospitalSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {hospitalSuggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.name}-${index}`}
                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                              index === selectedHospitalIndex ? 'bg-blue-50 border-blue-200' : ''
                            }`}
                            onClick={() => handleHospitalSuggestionSelect(suggestion)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="flex-shrink-0 mr-3">
                                  {suggestion.type === 'hospital' ? (
                                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                      <span className="text-red-600 text-sm font-bold">🏥</span>
                                    </div>
                                  ) : (
                                    <MapPinIcon className="h-6 w-6 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate">
                                    {suggestion.name}
                                  </div>
                                  <div className="text-sm text-gray-600 truncate">
                                    {suggestion.specialties && (
                                      <span className="text-blue-600">{suggestion.specialties}</span>
                                    )}
                                    {suggestion.specialties && suggestion.displayName && ' • '}
                                    {suggestion.displayName}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {suggestion.rating && (
                                  <div className="flex items-center">
                                    <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="text-sm font-medium ml-1">{suggestion.rating}</span>
                                  </div>
                                )}
                                {suggestion.distance && (
                                  <span className="text-xs text-gray-500">
                                    {suggestion.distance < 1000 
                                      ? `${Math.round(suggestion.distance)}m`
                                      : `${(suggestion.distance / 1000).toFixed(1)}km`
                                    }
                                  </span>
                                )}
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                  {suggestion.type}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No hospital suggestions message */}
                    {showHospitalSuggestions && !hospitalSuggestions.length && searchQuery.length >= 1 && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
                        <div className="text-gray-500 text-center">
                          <MagnifyingGlassIcon className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                          <p>No hospitals found for "{searchQuery}"</p>
                          <p className="text-xs mt-1">Try searching for hospital names, specialties, or services</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={selectedType}
                      onChange={(e) => setSelectedType(e.target.value)}
                    >
                      {HOSPITAL_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    {userLocation && (
                      <select
                        className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={maxDistance}
                        onChange={(e) => setMaxDistance(Number(e.target.value))}
                      >
                        {DISTANCE_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
                
                {/* Real-time Results Counter */}
                <div className="mt-3 flex justify-between items-center text-sm text-gray-600">
                  <span>
                    Showing {viewMode === 'list' ? filteredHospitals.length : allHospitals.length} 
                    {viewMode === 'list' ? ' filtered' : ''} hospitals
                    {userLocation && ` near ${currentLocationName || 'your location'}`}
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      🗺️ Real Hospital Data
                    </span>
                  </span>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
              
              {/* Advanced Filters - Collapsible */}
              <details className="bg-gray-50 rounded-lg">
                <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-100 rounded-lg">
                  Advanced Filters
                </summary>
                <div className="px-4 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label htmlFor="services" className="label">Specific Services</label>
                      <input
                        id="services"
                        type="text"
                        className="input"
                        placeholder="e.g., cardiology, emergency..."
                        value={searchFilters.services}
                        onChange={(e) => setSearchFilters({...searchFilters, services: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="rating" className="label">Minimum Rating</label>
                      <select
                        id="rating"
                        className="input"
                        value={searchFilters.minRating}
                        onChange={(e) => setSearchFilters({...searchFilters, minRating: Number(e.target.value)})}
                      >
                        <option value={0}>Any Rating</option>
                        <option value={1}>1+ Stars</option>
                        <option value={2}>2+ Stars</option>
                        <option value={3}>3+ Stars</option>
                        <option value={4}>4+ Stars</option>
                        <option value={5}>5 Stars Only</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          checked={searchFilters.emergencyOnly}
                          onChange={(e) => setSearchFilters({...searchFilters, emergencyOnly: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Emergency Only</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-6">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          checked={searchFilters.verifiedOnly}
                          onChange={(e) => setSearchFilters({...searchFilters, verifiedOnly: e.target.checked})}
                        />
                        <span className="ml-2 text-sm text-gray-700">Verified Only</span>
                      </label>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'map'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Map View
            </button>
          </div>
        </div>

        {/* Results */}
        {viewMode === 'list' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((hospital) => (
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
                
                {hospital.rating?.overall && (
                  <div className="flex items-center">
                    <div className="flex mr-1">
                      {renderStars(hospital.rating.overall)}
                    </div>
                    <span className="text-sm text-gray-600">
                      {hospital.rating.overall.toFixed(1)}
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
                {hospital.contact?.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a 
                      href={`tel:${hospital.contact.phone}`}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {hospital.contact.phone}
                    </a>
                  </div>
                )}
                
                {hospital.contact?.website && (
                  <div className="flex items-center">
                    <GlobeAltIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <a 
                      href={hospital.contact.website}
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
                  className={`btn flex-1 text-sm ${
                    userLocation 
                      ? 'btn-secondary hover:bg-blue-600 hover:text-white' 
                      : 'btn-secondary opacity-50 cursor-not-allowed'
                  }`}
                  title={!userLocation ? 'Set your location first to get directions' : `Get directions to ${hospital.name}`}
                >
                  {userLocation ? '🗺️ Get Directions' : '📍 Set Location First'}
                </button>
                {hospital.contact?.phone && (
                  <a
                    href={`tel:${hospital.contact.phone}`}
                    className="btn btn-primary flex-1 text-sm text-center"
                  >
                    📞 Call Now
                  </a>
                )}
                {hospital.contact?.website && (
                  <a
                    href={hospital.contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary flex-1 text-sm text-center"
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
        ) : (
          /* Map View */
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Hospital Locations {userLocation && `(${hospitals.length} found)`}
              </h3>
            </div>
            <div className="h-[500px]">
              <HospitalMap 
                hospitals={hospitals}
                userLocation={userLocation}
                getDirections={getDirections}
                onHospitalClick={(hospital) => {
                  console.log('Hospital clicked:', hospital.name);
                  toast.success(`Selected: ${hospital.name}`);
                }}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredHospitals.length === 0 && viewMode === 'list' && (
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