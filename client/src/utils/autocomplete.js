// Advanced autocomplete utility for place names with real-time suggestions

// Popular Indian cities and towns for quick suggestions
const INDIAN_CITIES = [
  { name: 'Mumbai', state: 'Maharashtra', country: 'India' },
  { name: 'Delhi', state: 'Delhi', country: 'India' },
  { name: 'Bangalore', state: 'Karnataka', country: 'India' },
  { name: 'Hyderabad', state: 'Telangana', country: 'India' },
  { name: 'Chennai', state: 'Tamil Nadu', country: 'India' },
  { name: 'Kolkata', state: 'West Bengal', country: 'India' },
  { name: 'Pune', state: 'Maharashtra', country: 'India' },
  { name: 'Ahmedabad', state: 'Gujarat', country: 'India' },
  { name: 'Jaipur', state: 'Rajasthan', country: 'India' },
  { name: 'Surat', state: 'Gujarat', country: 'India' },
  { name: 'Lucknow', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Kanpur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Nagpur', state: 'Maharashtra', country: 'India' },
  { name: 'Indore', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Thane', state: 'Maharashtra', country: 'India' },
  { name: 'Bhopal', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Pimpri-Chinchwad', state: 'Maharashtra', country: 'India' },
  { name: 'Patna', state: 'Bihar', country: 'India' },
  { name: 'Vadodara', state: 'Gujarat', country: 'India' },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Ludhiana', state: 'Punjab', country: 'India' },
  { name: 'Agra', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Nashik', state: 'Maharashtra', country: 'India' },
  { name: 'Faridabad', state: 'Haryana', country: 'India' },
  { name: 'Meerut', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Rajkot', state: 'Gujarat', country: 'India' },
  { name: 'Kalyan-Dombivali', state: 'Maharashtra', country: 'India' },
  { name: 'Vasai-Virar', state: 'Maharashtra', country: 'India' },
  { name: 'Varanasi', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Srinagar', state: 'Jammu and Kashmir', country: 'India' },
  { name: 'Aurangabad', state: 'Maharashtra', country: 'India' },
  { name: 'Dhanbad', state: 'Jharkhand', country: 'India' },
  { name: 'Amritsar', state: 'Punjab', country: 'India' },
  { name: 'Navi Mumbai', state: 'Maharashtra', country: 'India' },
  { name: 'Allahabad', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Ranchi', state: 'Jharkhand', country: 'India' },
  { name: 'Howrah', state: 'West Bengal', country: 'India' },
  { name: 'Coimbatore', state: 'Tamil Nadu', country: 'India' },
  { name: 'Jabalpur', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Gwalior', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Vijayawada', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Jodhpur', state: 'Rajasthan', country: 'India' },
  { name: 'Madurai', state: 'Tamil Nadu', country: 'India' },
  { name: 'Raipur', state: 'Chhattisgarh', country: 'India' },
  { name: 'Kota', state: 'Rajasthan', country: 'India' },
  { name: 'Guwahati', state: 'Assam', country: 'India' },
  { name: 'Chandigarh', state: 'Chandigarh', country: 'India' },
  { name: 'Solapur', state: 'Maharashtra', country: 'India' },
  { name: 'Hubballi-Dharwad', state: 'Karnataka', country: 'India' },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', country: 'India' },
  { name: 'Bareilly', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Moradabad', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Mysore', state: 'Karnataka', country: 'India' },
  { name: 'Tiruppur', state: 'Tamil Nadu', country: 'India' },
  { name: 'Gurgaon', state: 'Haryana', country: 'India' },
  { name: 'Aligarh', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Jalandhar', state: 'Punjab', country: 'India' },
  { name: 'Bhubaneswar', state: 'Odisha', country: 'India' },
  { name: 'Salem', state: 'Tamil Nadu', country: 'India' },
  { name: 'Warangal', state: 'Telangana', country: 'India' },
  { name: 'Guntur', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Bhiwandi', state: 'Maharashtra', country: 'India' },
  { name: 'Saharanpur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Gorakhpur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Bikaner', state: 'Rajasthan', country: 'India' },
  { name: 'Amravati', state: 'Maharashtra', country: 'India' },
  { name: 'Noida', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Jamshedpur', state: 'Jharkhand', country: 'India' },
  { name: 'Bhilai Nagar', state: 'Chhattisgarh', country: 'India' },
  { name: 'Cuttack', state: 'Odisha', country: 'India' },
  { name: 'Firozabad', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Kochi', state: 'Kerala', country: 'India' },
  { name: 'Nellore', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Bhavnagar', state: 'Gujarat', country: 'India' },
  { name: 'Dehradun', state: 'Uttarakhand', country: 'India' },
  { name: 'Durgapur', state: 'West Bengal', country: 'India' },
  { name: 'Asansol', state: 'West Bengal', country: 'India' },
  { name: 'Rourkela', state: 'Odisha', country: 'India' },
  { name: 'Nanded', state: 'Maharashtra', country: 'India' },
  { name: 'Kolhapur', state: 'Maharashtra', country: 'India' },
  { name: 'Ajmer', state: 'Rajasthan', country: 'India' },
  { name: 'Akola', state: 'Maharashtra', country: 'India' },
  { name: 'Gulbarga', state: 'Karnataka', country: 'India' },
  { name: 'Jamnagar', state: 'Gujarat', country: 'India' },
  { name: 'Ujjain', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Loni', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Siliguri', state: 'West Bengal', country: 'India' },
  { name: 'Jhansi', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Ulhasnagar', state: 'Maharashtra', country: 'India' },
  { name: 'Jammu', state: 'Jammu and Kashmir', country: 'India' },
  { name: 'Sangli-Miraj & Kupwad', state: 'Maharashtra', country: 'India' },
  { name: 'Mangalore', state: 'Karnataka', country: 'India' },
  { name: 'Erode', state: 'Tamil Nadu', country: 'India' },
  { name: 'Belgaum', state: 'Karnataka', country: 'India' },
  { name: 'Ambattur', state: 'Tamil Nadu', country: 'India' },
  { name: 'Tirunelveli', state: 'Tamil Nadu', country: 'India' },
  { name: 'Malegaon', state: 'Maharashtra', country: 'India' },
  { name: 'Gaya', state: 'Bihar', country: 'India' },
  { name: 'Jalgaon', state: 'Maharashtra', country: 'India' },
  { name: 'Udaipur', state: 'Rajasthan', country: 'India' },
  { name: 'Maheshtala', state: 'West Bengal', country: 'India' },
  { name: 'Davanagere', state: 'Karnataka', country: 'India' },
  { name: 'Kozhikode', state: 'Kerala', country: 'India' },
  { name: 'Kurnool', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Rajpur Sonarpur', state: 'West Bengal', country: 'India' },
  { name: 'Rajahmundry', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Bokaro', state: 'Jharkhand', country: 'India' },
  { name: 'South Dumdum', state: 'West Bengal', country: 'India' },
  { name: 'Bellary', state: 'Karnataka', country: 'India' },
  { name: 'Patiala', state: 'Punjab', country: 'India' },
  { name: 'Gopalpur', state: 'West Bengal', country: 'India' },
  { name: 'Agartala', state: 'Tripura', country: 'India' },
  { name: 'Bhagalpur', state: 'Bihar', country: 'India' },
  { name: 'Muzaffarnagar', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Bhatpara', state: 'West Bengal', country: 'India' },
  { name: 'Panihati', state: 'West Bengal', country: 'India' },
  { name: 'Latur', state: 'Maharashtra', country: 'India' },
  { name: 'Dhule', state: 'Maharashtra', country: 'India' },
  { name: 'Rohtak', state: 'Haryana', country: 'India' },
  { name: 'Korba', state: 'Chhattisgarh', country: 'India' },
  { name: 'Bhilwara', state: 'Rajasthan', country: 'India' },
  { name: 'Berhampur', state: 'Odisha', country: 'India' },
  { name: 'Muzaffarpur', state: 'Bihar', country: 'India' },
  { name: 'Ahmednagar', state: 'Maharashtra', country: 'India' },
  { name: 'Mathura', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Kollam', state: 'Kerala', country: 'India' },
  { name: 'Avadi', state: 'Tamil Nadu', country: 'India' },
  { name: 'Kadapa', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Kamarhati', state: 'West Bengal', country: 'India' },
  { name: 'Sambalpur', state: 'Odisha', country: 'India' },
  { name: 'Bilaspur', state: 'Chhattisgarh', country: 'India' },
  { name: 'Shahjahanpur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Satara', state: 'Maharashtra', country: 'India' },
  { name: 'Bijapur', state: 'Karnataka', country: 'India' },
  { name: 'Rampur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Shivamogga', state: 'Karnataka', country: 'India' },
  { name: 'Chandrapur', state: 'Maharashtra', country: 'India' },
  { name: 'Junagadh', state: 'Gujarat', country: 'India' },
  { name: 'Thrissur', state: 'Kerala', country: 'India' },
  { name: 'Alwar', state: 'Rajasthan', country: 'India' },
  { name: 'Bardhaman', state: 'West Bengal', country: 'India' },
  { name: 'Kulti', state: 'West Bengal', country: 'India' },
  { name: 'Kakinada', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Nizamabad', state: 'Telangana', country: 'India' },
  { name: 'Parbhani', state: 'Maharashtra', country: 'India' },
  { name: 'Tumkur', state: 'Karnataka', country: 'India' },
  { name: 'Khammam', state: 'Telangana', country: 'India' },
  { name: 'Ozhukarai', state: 'Puducherry', country: 'India' },
  { name: 'Bihar Sharif', state: 'Bihar', country: 'India' },
  { name: 'Panipat', state: 'Haryana', country: 'India' },
  { name: 'Darbhanga', state: 'Bihar', country: 'India' },
  { name: 'Bally', state: 'West Bengal', country: 'India' },
  { name: 'Aizawl', state: 'Mizoram', country: 'India' },
  { name: 'Dewas', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Ichalkaranji', state: 'Maharashtra', country: 'India' },
  { name: 'Karnal', state: 'Haryana', country: 'India' },
  { name: 'Bathinda', state: 'Punjab', country: 'India' },
  { name: 'Jalna', state: 'Maharashtra', country: 'India' },
  { name: 'Eluru', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Kirari Suleman Nagar', state: 'Delhi', country: 'India' },
  { name: 'Barabanki', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Purnia', state: 'Bihar', country: 'India' },
  { name: 'Satna', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Mau', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Sonipat', state: 'Haryana', country: 'India' },
  { name: 'Farrukhabad', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Sagar', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Rourkela', state: 'Odisha', country: 'India' },
  { name: 'Durg', state: 'Chhattisgarh', country: 'India' },
  { name: 'Imphal', state: 'Manipur', country: 'India' },
  { name: 'Ratlam', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Hapur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Arrah', state: 'Bihar', country: 'India' },
  { name: 'Karimnagar', state: 'Telangana', country: 'India' },
  { name: 'Anantapur', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Etawah', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Ambernath', state: 'Maharashtra', country: 'India' },
  { name: 'North Dumdum', state: 'West Bengal', country: 'India' },
  { name: 'Bharatpur', state: 'Rajasthan', country: 'India' },
  { name: 'Begusarai', state: 'Bihar', country: 'India' },
  { name: 'New Delhi', state: 'Delhi', country: 'India' },
  { name: 'Gandhidham', state: 'Gujarat', country: 'India' },
  { name: 'Baranagar', state: 'West Bengal', country: 'India' },
  { name: 'Tiruvottiyur', state: 'Tamil Nadu', country: 'India' },
  { name: 'Pondicherry', state: 'Puducherry', country: 'India' },
  { name: 'Sikar', state: 'Rajasthan', country: 'India' },
  { name: 'Thoothukudi', state: 'Tamil Nadu', country: 'India' },
  { name: 'Rewa', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Mirzapur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Raichur', state: 'Karnataka', country: 'India' },
  { name: 'Pali', state: 'Rajasthan', country: 'India' },
  { name: 'Ramagundam', state: 'Telangana', country: 'India' },
  { name: 'Haridwar', state: 'Uttarakhand', country: 'India' },
  { name: 'Vijayanagaram', state: 'Andhra Pradesh', country: 'India' },
  { name: 'Katihar', state: 'Bihar', country: 'India' },
  { name: 'Nagarcoil', state: 'Tamil Nadu', country: 'India' },
  { name: 'Sri Ganganagar', state: 'Rajasthan', country: 'India' },
  { name: 'Karawal Nagar', state: 'Delhi', country: 'India' },
  { name: 'Mango', state: 'Jharkhand', country: 'India' },
  { name: 'Thanjavur', state: 'Tamil Nadu', country: 'India' },
  { name: 'Bulandshahr', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Uluberia', state: 'West Bengal', country: 'India' },
  { name: 'Murwara', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Sambhal', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Singrauli', state: 'Madhya Pradesh', country: 'India' },
  { name: 'Jaunpur', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Kumbakonam', state: 'Tamil Nadu', country: 'India' },
  { name: 'Olean', state: 'Uttar Pradesh', country: 'India' },
  { name: 'Dibrugarh', state: 'Assam', country: 'India' },
  { name: 'Rajkot', state: 'Gujarat', country: 'India' },
  { name: 'Shillong', state: 'Meghalaya', country: 'India' },
  { name: 'Vapi', state: 'Gujarat', country: 'India' },
  { name: 'Valsad', state: 'Gujarat', country: 'India' },
  { name: 'Vasai', state: 'Maharashtra', country: 'India' },
  { name: 'Virar', state: 'Maharashtra', country: 'India' },
  { name: 'Vellore', state: 'Tamil Nadu', country: 'India' },
  { name: 'Velachery', state: 'Tamil Nadu', country: 'India' }
];

// Global cities for international support
const GLOBAL_CITIES = [
  { name: 'New York', state: 'New York', country: 'United States' },
  { name: 'Los Angeles', state: 'California', country: 'United States' },
  { name: 'Chicago', state: 'Illinois', country: 'United States' },
  { name: 'Houston', state: 'Texas', country: 'United States' },
  { name: 'Phoenix', state: 'Arizona', country: 'United States' },
  { name: 'Philadelphia', state: 'Pennsylvania', country: 'United States' },
  { name: 'San Antonio', state: 'Texas', country: 'United States' },
  { name: 'San Diego', state: 'California', country: 'United States' },
  { name: 'Dallas', state: 'Texas', country: 'United States' },
  { name: 'San Jose', state: 'California', country: 'United States' },
  { name: 'London', state: 'England', country: 'United Kingdom' },
  { name: 'Paris', state: 'Île-de-France', country: 'France' },
  { name: 'Berlin', state: 'Berlin', country: 'Germany' },
  { name: 'Madrid', state: 'Madrid', country: 'Spain' },
  { name: 'Rome', state: 'Lazio', country: 'Italy' },
  { name: 'Tokyo', state: 'Tokyo', country: 'Japan' },
  { name: 'Beijing', state: 'Beijing', country: 'China' },
  { name: 'Shanghai', state: 'Shanghai', country: 'China' },
  { name: 'Seoul', state: 'Seoul', country: 'South Korea' },
  { name: 'Sydney', state: 'New South Wales', country: 'Australia' },
  { name: 'Melbourne', state: 'Victoria', country: 'Australia' },
  { name: 'Toronto', state: 'Ontario', country: 'Canada' },
  { name: 'Vancouver', state: 'British Columbia', country: 'Canada' },
  { name: 'Montreal', state: 'Quebec', country: 'Canada' },
  { name: 'Dubai', state: 'Dubai', country: 'United Arab Emirates' },
  { name: 'Singapore', state: 'Singapore', country: 'Singapore' },
  { name: 'Hong Kong', state: 'Hong Kong', country: 'Hong Kong' }
];

// Combine all cities for comprehensive search
const ALL_CITIES = [...INDIAN_CITIES, ...GLOBAL_CITIES];

// Fast local search function for instant suggestions
export const getLocalSuggestions = (query, limit = 10) => {
  if (!query || query.length < 1) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Find cities that start with the query
  const startsWith = ALL_CITIES.filter(city => 
    city.name.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Find cities that contain the query but don't start with it
  const contains = ALL_CITIES.filter(city => 
    city.name.toLowerCase().includes(normalizedQuery) && 
    !city.name.toLowerCase().startsWith(normalizedQuery)
  );
  
  // Combine and limit results
  const results = [...startsWith, ...contains].slice(0, limit);
  
  return results.map(city => ({
    name: city.name,
    displayName: `${city.name}, ${city.state}, ${city.country}`,
    type: 'city',
    confidence: startsWith.includes(city) ? 'high' : 'medium'
  }));
};

// Advanced search using Nominatim API for real-time suggestions
export const getAdvancedSuggestions = async (query, limit = 8) => {
  if (!query || query.length < 2) return [];
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}&addressdetails=1&extratags=1&namedetails=1`
    );
    
    if (!response.ok) {
      return getLocalSuggestions(query, limit);
    }
    
    const data = await response.json();
    
    return data.map(item => ({
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      type: item.type || 'place',
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      confidence: 'high',
      source: 'nominatim'
    }));
    
  } catch (error) {
    console.error('Advanced suggestions error:', error);
    // Fallback to local suggestions
    return getLocalSuggestions(query, limit);
  }
};

// Debounced search function to prevent too many API calls
export const debouncedSearch = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    return new Promise((resolve) => {
      timeoutId = setTimeout(async () => {
        const result = await func(...args);
        resolve(result);
      }, delay);
    });
  };
};

// Get hybrid suggestions (combine local + API results + hospital names)
export const getHybridSuggestions = async (query, limit = 10, hospitals = []) => {
  const localResults = getLocalSuggestions(query, Math.ceil(limit / 3));
  
  // Add hospital name suggestions
  const hospitalSuggestions = getHospitalSuggestions(query, hospitals, Math.ceil(limit / 3));
  
  try {
    const apiResults = await getAdvancedSuggestions(query, Math.ceil(limit / 3));
    
    // Merge and deduplicate
    const combined = [...hospitalSuggestions, ...localResults];
    
    apiResults.forEach(apiResult => {
      const exists = combined.some(item => 
        item.name.toLowerCase() === apiResult.name.toLowerCase()
      );
      
      if (!exists) {
        combined.push(apiResult);
      }
    });
    
    return combined.slice(0, limit);
    
  } catch (error) {
    console.error('Hybrid suggestions error:', error);
    return [...hospitalSuggestions, ...localResults].slice(0, limit);
  }
};

// Get hospital name suggestions from loaded hospitals
export const getHospitalSuggestions = (query, hospitals = [], limit = 5) => {
  if (!query || query.length < 1 || !hospitals.length) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  
  // Find hospitals that match the query
  const matchingHospitals = hospitals.filter(hospital => {
    const name = hospital.name.toLowerCase();
    const specialties = hospital.specialties?.toLowerCase() || '';
    const type = hospital.type?.toLowerCase() || '';
    const city = hospital.address?.city?.toLowerCase() || '';
    
    return name.includes(normalizedQuery) || 
           specialties.includes(normalizedQuery) ||
           type.includes(normalizedQuery) ||
           city.includes(normalizedQuery);
  });
  
  // Sort by relevance (name matches first)
  matchingHospitals.sort((a, b) => {
    const aNameMatch = a.name.toLowerCase().startsWith(normalizedQuery);
    const bNameMatch = b.name.toLowerCase().startsWith(normalizedQuery);
    
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;
    
    // Then by rating
    const aRating = a.rating?.overall || 0;
    const bRating = b.rating?.overall || 0;
    return bRating - aRating;
  });
  
  return matchingHospitals.slice(0, limit).map(hospital => ({
    name: hospital.name,
    displayName: `${hospital.name} - ${hospital.address?.city || 'Hospital'}`,
    type: 'hospital',
    confidence: 'high',
    hospitalData: hospital,
    specialties: hospital.specialties,
    rating: hospital.rating?.overall,
    distance: hospital.distance
  }));
};

// Create debounced version for real-time use
export const debouncedHybridSearch = debouncedSearch((query, limit, hospitals) => 
  getHybridSuggestions(query, limit, hospitals), 300);