// Geocoding utility using free Nominatim service (OpenStreetMap)
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

export const geocodePlace = async (placeName) => {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}?format=json&limit=1&q=${encodeURIComponent(placeName)}`
    );
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      const result = data[0];
      return {
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        displayName: result.display_name,
        success: true
      };
    } else {
      return {
        success: false,
        error: 'Location not found'
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: 'Failed to find location'
    };
  }
};

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data && data.display_name) {
      return {
        displayName: data.display_name,
        success: true
      };
    } else {
      return {
        success: false,
        error: 'Address not found'
      };
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      success: false,
      error: 'Failed to get address'
    };
  }
};