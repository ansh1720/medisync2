import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icon for hospitals
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map view updates
function MapUpdater({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
}

function HospitalMap({ hospitals = [], userLocation, onHospitalClick, getDirections }) {
  const mapRef = useRef();
  
  // Calculate map center and zoom
  const getMapCenter = () => {
    if (userLocation) {
      return [userLocation.latitude, userLocation.longitude];
    }
    if (hospitals.length > 0) {
      const [lng, lat] = hospitals[0].location.coordinates;
      return [lat, lng];
    }
    // Default to NYC
    return [40.7128, -74.0060];
  };

  const getMapZoom = () => {
    if (hospitals.length > 1) {
      return 11; // Zoom out to show multiple hospitals
    }
    return 13; // Zoom in for single hospital or user location
  };

  const center = getMapCenter();
  const zoom = getMapZoom();

  return (
    <div className="h-full w-full rounded-lg overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapUpdater center={center} zoom={zoom} />
        
        {/* User Location Marker */}
        {userLocation && (
          <Marker 
            position={[userLocation.latitude, userLocation.longitude]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>Your Location</strong>
                <br />
                <span className="text-sm text-gray-600">
                  {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* Hospital Markers */}
        {hospitals.map((hospital) => {
          const [lng, lat] = hospital.location.coordinates;
          return (
            <Marker
              key={hospital._id}
              position={[lat, lng]}
              icon={hospitalIcon}
              eventHandlers={{
                click: () => {
                  if (onHospitalClick) {
                    onHospitalClick(hospital);
                  }
                }
              }}
            >
              <Popup>
                <div className="min-w-[200px]">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {hospital.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 capitalize">
                    {hospital.type?.replace('_', ' ')}
                  </p>
                  <div className="text-sm text-gray-600 mb-2">
                    {hospital.address?.street}<br />
                    {hospital.address?.city}, {hospital.address?.state} {hospital.address?.zipCode}
                  </div>
                  {hospital.contact?.phone && (
                    <div className="text-sm mb-2">
                      <a 
                        href={`tel:${hospital.contact.phone}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {hospital.contact.phone}
                      </a>
                    </div>
                  )}
                  {hospital.rating?.overall && (
                    <div className="text-sm mb-2">
                      {hospital.rating.overall.toFixed(1)} / 5 stars
                    </div>
                  )}
                  <div className="mt-2">
                    {getDirections ? (
                      <button
                        onClick={() => getDirections(hospital)}
                        disabled={!userLocation}
                        className={`px-3 py-1 rounded text-sm ${
                          userLocation 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={!userLocation ? 'Set your location first' : `Get directions to ${hospital.name}`}
                      >
                        {userLocation ? '🗺️ Get Directions' : '📍 Set Location'}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (userLocation) {
                            const url = `https://www.google.com/maps/dir/${userLocation.latitude},${userLocation.longitude}/${lat},${lng}`;
                            window.open(url, '_blank');
                          }
                        }}
                        disabled={!userLocation}
                        className={`px-3 py-1 rounded text-sm ${
                          userLocation 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Get Directions
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default HospitalMap;