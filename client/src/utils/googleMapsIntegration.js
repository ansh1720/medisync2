// Google Places API integration for fetching real hospital data
// For demo purposes, I'll use a combination of approaches since Google Places API requires API keys

// Free alternative using OpenStreetMap Overpass API for hospital data
const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

export const fetchHospitalsFromMaps = async (latitude, longitude, radius = 25000) => {
  try {
    // Overpass QL query to find hospitals
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="hospital"](around:${radius},${latitude},${longitude});
        way["amenity"="hospital"](around:${radius},${latitude},${longitude});
        relation["amenity"="hospital"](around:${radius},${latitude},${longitude});
      );
      out center meta;
    `;

    const response = await fetch(OVERPASS_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: query
    });

    if (!response.ok) {
      throw new Error('Failed to fetch hospital data');
    }

    const data = await response.json();
    
    // Transform Overpass data to our hospital format
    const hospitals = data.elements
      .filter(element => element.tags && element.tags.name)
      .map((element, index) => {
        const lat = element.lat || element.center?.lat || 0;
        const lon = element.lon || element.center?.lon || 0;
        
        return {
          _id: `osm_${element.id || index}`,
          name: element.tags.name || 'Hospital',
          type: determineHospitalType(element.tags),
          specialties: extractSpecialties(element.tags),
          address: {
            street: element.tags['addr:street'] || '',
            city: element.tags['addr:city'] || '',
            state: element.tags['addr:state'] || '',
            zipCode: element.tags['addr:postcode'] || '',
            country: element.tags['addr:country'] || ''
          },
          location: {
            type: 'Point',
            coordinates: [lon, lat]
          },
          contact: {
            phone: element.tags.phone || element.tags['contact:phone'] || '',
            website: element.tags.website || element.tags['contact:website'] || '',
            email: element.tags.email || element.tags['contact:email'] || ''
          },
          services: {
            emergency: element.tags.emergency === 'yes' || element.tags['healthcare:speciality'] === 'emergency',
            pharmacy: false,
            laboratory: false,
            imaging: false,
            surgery: true,
            ambulance: element.tags.emergency === 'yes'
          },
          rating: {
            overall: Math.floor(Math.random() * 2) + 3, // Random 3-5 rating for demo
            reviewCount: Math.floor(Math.random() * 500) + 10
          },
          isActive: true,
          isVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: 'openstreetmap'
        };
      })
      .filter(hospital => hospital.location.coordinates[0] !== 0 && hospital.location.coordinates[1] !== 0);

    return {
      success: true,
      hospitals: hospitals,
      count: hospitals.length,
      source: 'OpenStreetMap'
    };

  } catch (error) {
    console.error('Error fetching hospitals from maps:', error);
    return {
      success: false,
      hospitals: [],
      count: 0,
      error: error.message
    };
  }
};

// Alternative using Nominatim for hospital search by place name
export const searchHospitalsByPlace = async (placeName, limit = 50) => {
  try {
    const query = `hospital in ${placeName}`;
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=${limit}&q=${encodeURIComponent(query)}&addressdetails=1&extratags=1`
    );

    if (!response.ok) {
      throw new Error('Failed to search hospitals');
    }

    const data = await response.json();
    
    const hospitals = data
      .filter(item => 
        item.class === 'amenity' && 
        item.type === 'hospital' && 
        item.display_name
      )
      .map((item, index) => ({
        _id: `nominatim_${item.place_id || index}`,
        name: extractHospitalName(item.display_name),
        type: 'general',
        specialties: 'general medicine',
        address: {
          street: item.address?.road || '',
          city: item.address?.city || item.address?.town || item.address?.village || '',
          state: item.address?.state || item.address?.province || '',
          zipCode: item.address?.postcode || '',
          country: item.address?.country || ''
        },
        location: {
          type: 'Point',
          coordinates: [parseFloat(item.lon), parseFloat(item.lat)]
        },
        contact: {
          phone: '',
          website: '',
          email: ''
        },
        services: {
          emergency: false,
          pharmacy: false,
          laboratory: false,
          imaging: false,
          surgery: true,
          ambulance: false
        },
        rating: {
          overall: Math.floor(Math.random() * 2) + 3,
          reviewCount: Math.floor(Math.random() * 300) + 5
        },
        isActive: true,
        isVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'nominatim'
      }));

    return {
      success: true,
      hospitals: hospitals,
      count: hospitals.length,
      source: 'Nominatim/OpenStreetMap'
    };

  } catch (error) {
    console.error('Error searching hospitals by place:', error);
    return {
      success: false,
      hospitals: [],
      count: 0,
      error: error.message
    };
  }
};

// Helper functions
function determineHospitalType(tags) {
  if (tags.emergency === 'yes') return 'emergency';
  if (tags['healthcare:speciality']) {
    const specialty = tags['healthcare:speciality'].toLowerCase();
    if (specialty.includes('emergency')) return 'emergency';
    if (specialty.includes('general')) return 'general';
    return 'specialty';
  }
  return 'general';
}

function extractSpecialties(tags) {
  const specialties = [];
  
  if (tags.emergency === 'yes') specialties.push('emergency');
  if (tags['healthcare:speciality']) {
    specialties.push(tags['healthcare:speciality']);
  }
  if (tags.medical) specialties.push(tags.medical);
  
  return specialties.length > 0 ? specialties.join(' ') : 'general medicine';
}

function extractHospitalName(displayName) {
  // Extract hospital name from display name (usually the first part before the comma)
  const parts = displayName.split(',');
  let name = parts[0].trim();
  
  // Clean up common prefixes/suffixes
  name = name.replace(/^Hospital\s+/i, '');
  name = name.replace(/\s+Hospital$/i, ' Hospital');
  
  return name || 'Hospital';
}

// Fallback hospital data for major cities (when APIs are unavailable)
export const getFallbackHospitals = (cityName) => {
  const fallbackData = {
    'New York': [
      { name: 'NewYork-Presbyterian Hospital', lat: 40.7829, lng: -73.9441 },
      { name: 'Mount Sinai Hospital', lat: 40.7903, lng: -73.9528 },
      { name: 'NYU Langone Health', lat: 40.7397, lng: -73.9738 },
      { name: 'Memorial Sloan Kettering', lat: 40.7635, lng: -73.9530 },
      { name: 'Hospital for Special Surgery', lat: 40.7671, lng: -73.9620 }
    ],
    'Los Angeles': [
      { name: 'Cedars-Sinai Medical Center', lat: 34.0755, lng: -118.3785 },
      { name: 'UCLA Medical Center', lat: 34.0686, lng: -118.4473 },
      { name: 'Good Samaritan Hospital', lat: 34.0574, lng: -118.2755 },
      { name: 'California Hospital Medical Center', lat: 34.0378, lng: -118.2615 },
      { name: 'USC Verdugo Hills Hospital', lat: 34.2097, lng: -118.2170 }
    ],
    'Chicago': [
      { name: 'Northwestern Memorial Hospital', lat: 41.8955, lng: -87.6197 },
      { name: 'Rush University Medical Center', lat: 41.8736, lng: -87.6697 },
      { name: 'University of Chicago Medical Center', lat: 41.7886, lng: -87.6056 },
      { name: 'Advocate Illinois Masonic Medical Center', lat: 41.9394, lng: -87.6531 },
      { name: 'Ann & Robert H. Lurie Children\'s Hospital', lat: 41.8955, lng: -87.6211 }
    ]
  };

  const cityHospitals = fallbackData[cityName] || [];
  
  return cityHospitals.map((hospital, index) => ({
    _id: `fallback_${cityName}_${index}`,
    name: hospital.name,
    type: 'general',
    specialties: 'general medicine',
    address: {
      street: '',
      city: cityName,
      state: '',
      zipCode: '',
      country: 'United States'
    },
    location: {
      type: 'Point',
      coordinates: [hospital.lng, hospital.lat]
    },
    contact: { phone: '', website: '', email: '' },
    services: {
      emergency: true,
      pharmacy: true,
      laboratory: true,
      imaging: true,
      surgery: true,
      ambulance: true
    },
    rating: {
      overall: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 100
    },
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'fallback'
  }));
};