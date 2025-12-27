'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2 } from 'lucide-react';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  onLocationNameDetected?: (name: string) => void; // New prop for building name
  initialLat?: number;
  initialLng?: number;
}

// Custom indigo marker icon
const createCustomIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 30px;
        height: 30px;
        background: rgb(99, 102, 241);
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 10px rgba(99, 102, 241, 0.5);
      ">
        <div style="
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  });
};

function LocationMarker({
  onLocationSelect,
  searchPosition
}: {
  onLocationSelect: (lat: number, lng: number) => void;
  searchPosition: L.LatLng | null;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(searchPosition);

  // Update position when search result changes
  useEffect(() => {
    if (searchPosition) {
      setPosition(searchPosition);
      onLocationSelect(searchPosition.lat, searchPosition.lng);
    }
  }, [searchPosition]); // Removed onLocationSelect to fix React warning

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : (
    <Marker position={position} icon={createCustomIcon()} />
  );
}

function SearchField({
  onSearchResult
}: {
  onSearchResult: (lat: number, lng: number) => void
}) {
  const map = useMap();
  const searchControlRef = useRef<any>(null);

  useEffect(() => {
    if (!map || searchControlRef.current) return;

    // Custom search implementation to avoid CORS issues
    const searchContainer = L.DomUtil.create('div', 'leaflet-control-search');
    searchContainer.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(99, 102, 241, 0.3);
      border-radius: 12px;
      padding: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      max-width: 400px;
    `;

    const searchInput = L.DomUtil.create('input', '', searchContainer) as HTMLInputElement;
    searchInput.type = 'text';
    searchInput.placeholder = 'Search location...';
    searchInput.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      background: transparent;
      border: none;
      color: white;
      font-size: 14px;
      outline: none;
    `;

    const searchResults = L.DomUtil.create('div', '', searchContainer);
    searchResults.style.cssText = `
      max-height: 250px;
      overflow-y: auto;
      margin-top: 8px;
      display: none;
      background: rgba(0, 0, 0, 0.95);
      border-radius: 8px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    `;

    let searchTimeout: NodeJS.Timeout;

    searchInput.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;

      clearTimeout(searchTimeout);

      if (query.length < 3) {
        searchResults.style.display = 'none';
        return;
      }

      searchTimeout = setTimeout(async () => {
        try {
          // Use CORS proxy to avoid CORS issues
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodeURIComponent(query)}&` +
            `countrycodes=in&addressdetails=1&limit=5`,
            {
              method: 'GET',
              headers: {
                'User-Agent': 'CampusFix-App',
              }
            }
          );

          if (!response.ok) {
            throw new Error('Search failed');
          }

          const results = await response.json();

          searchResults.innerHTML = '';
          searchResults.style.display = results.length > 0 ? 'block' : 'none';

          if (results.length === 0) {
            searchResults.innerHTML = '<div style="padding: 12px; color: #a1a1aa; font-size: 13px; text-align: center;">No results found</div>';
            searchResults.style.display = 'block';
            return;
          }

          results.forEach((result: any) => {
            const item = L.DomUtil.create('div', '', searchResults);
            item.style.cssText = `
              padding: 12px;
              cursor: pointer;
              color: #e4e4e7;
              font-size: 13px;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              transition: background 0.2s;
              line-height: 1.5;
              word-wrap: break-word;
              white-space: normal;
              overflow-wrap: break-word;
            `;
            item.textContent = result.display_name;

            item.addEventListener('mouseenter', () => {
              item.style.background = 'rgba(99, 102, 241, 0.3)';
            });

            item.addEventListener('mouseleave', () => {
              item.style.background = 'transparent';
            });

            item.addEventListener('click', () => {
              const lat = parseFloat(result.lat);
              const lng = parseFloat(result.lon);

              onSearchResult(lat, lng);
              map.flyTo([lat, lng], 16, {
                duration: 1.5,
                easeLinearity: 0.25,
              });

              searchInput.value = result.display_name;
              searchResults.style.display = 'none';
            });
          });
        } catch (error) {
          console.error('Search error:', error);
          searchResults.innerHTML = '<div style="padding: 12px; color: #ef4444; font-size: 13px; text-align: center; word-wrap: break-word;">Search failed. Please try again or use "Detect My Building".</div>';
          searchResults.style.display = 'block';
        }
      }, 500);
    });

    // Close results when clicking outside
    map.on('click', () => {
      searchResults.style.display = 'none';
    });

    // Prevent map interactions when clicking on search
    L.DomEvent.disableClickPropagation(searchContainer);
    L.DomEvent.disableScrollPropagation(searchContainer);

    map.getContainer().appendChild(searchContainer);

    return () => {
      if (searchControlRef.current) {
        map.removeControl(searchControlRef.current);
        searchControlRef.current = null;
      }
    };
  }, [map, onSearchResult]);

  return null;
}

export default function MapPicker({
  onLocationSelect,
  onLocationNameDetected,
  initialLat = 19.0726, // Somaiya Vidyavihar University
  initialLng = 72.8978
}: MapPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchPosition, setSearchPosition] = useState<L.LatLng | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectedLocationName, setDetectedLocationName] = useState<string>('');
  const [gpsError, setGpsError] = useState<string>('');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reverse Geocoding using Nominatim
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CampusFix-AI/1.0' // Required by Nominatim
          }
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();

      // Extract building/location name
      const locationName =
        data.address?.building ||
        data.address?.university ||
        data.address?.college ||
        data.address?.school ||
        data.address?.amenity ||
        data.address?.road ||
        data.address?.suburb ||
        data.display_name?.split(',')[0] ||
        'Unknown Location';

      setDetectedLocationName(locationName);

      if (onLocationNameDetected) {
        onLocationNameDetected(locationName);
      }

      return locationName;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return 'Location detected';
    }
  };

  // GPS Detection
  const detectMyLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    setGpsError('');

    // First attempt: High accuracy with longer timeout
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update map position
        setSearchPosition(L.latLng(latitude, longitude));
        onLocationSelect(latitude, longitude);

        // Reverse geocode to get building name
        await reverseGeocode(latitude, longitude);

        setIsDetectingLocation(false);
      },
      (error) => {
        console.warn('GPS high accuracy failed, trying with lower accuracy...', error);

        // Fallback: Try with lower accuracy if high accuracy times out
        if (error.code === 3) { // TIMEOUT
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              setSearchPosition(L.latLng(latitude, longitude));
              onLocationSelect(latitude, longitude);
              await reverseGeocode(latitude, longitude);
              setIsDetectingLocation(false);
            },
            (fallbackError) => {
              let errorMessage = 'Unable to detect location';

              switch (fallbackError.code) {
                case 1: // PERMISSION_DENIED
                  errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
                  break;
                case 2: // POSITION_UNAVAILABLE
                  errorMessage = 'Location unavailable. Please check your GPS/WiFi and try again.';
                  break;
                case 3: // TIMEOUT
                  errorMessage = 'Location detection is taking too long. Please try searching for your building instead.';
                  break;
              }

              setGpsError(errorMessage);
              setIsDetectingLocation(false);
            },
            {
              enableHighAccuracy: false, // Lower accuracy, faster response
              timeout: 15000,
              maximumAge: 60000 // Accept cached location up to 1 minute old
            }
          );
        } else {
          // Handle other errors immediately
          let errorMessage = 'Unable to detect location';

          switch (error.code) {
            case 1: // PERMISSION_DENIED
              errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
              break;
            case 2: // POSITION_UNAVAILABLE
              errorMessage = 'Location unavailable. Please check your GPS/WiFi and try again.';
              break;
          }

          setGpsError(errorMessage);
          setIsDetectingLocation(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased to 30 seconds
        maximumAge: 0
      }
    );
  };

  const handleSearchResult = (lat: number, lng: number) => {
    setSearchPosition(L.latLng(lat, lng));
  };

  if (!isMounted) {
    return (
      <div className="w-full h-[400px] glass rounded-xl flex items-center justify-center">
        <div className="text-zinc-400">Loading map...</div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* GPS Detection Button */}
      <motion.button
        type="button"
        onClick={detectMyLocation}
        disabled={isDetectingLocation}
        className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium smooth-transition touch-target ${isDetectingLocation
          ? 'bg-indigo-500/30 cursor-not-allowed'
          : 'bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30'
          } text-white flex items-center justify-center space-x-2 text-sm sm:text-base`}
        whileHover={{ scale: isDetectingLocation ? 1 : 1.02 }}
        whileTap={{ scale: isDetectingLocation ? 1 : 0.98 }}
      >
        {isDetectingLocation ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="hidden sm:inline">Detecting your location...</span>
            <span className="sm:hidden">Detecting...</span>
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            <span>Detect My Building</span>
          </>
        )}
      </motion.button>

      {/* Detected Location Name */}
      <AnimatePresence>
        {detectedLocationName && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30"
          >
            <p className="text-sm text-emerald-300 flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Detected: <strong>{detectedLocationName}</strong></span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GPS Error */}
      <AnimatePresence>
        {gpsError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30"
          >
            <p className="text-sm text-red-300">{gpsError}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Map Container with Glassmorphism */}
      <motion.div
        className="w-full h-[400px] rounded-xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 shadow-lg"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
      >
        <style jsx global>{`
        /* Premium dark theme for search bar */
        .leaflet-control-geosearch {
          background: rgba(24, 24, 27, 0.95) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 12px !important;
          backdrop-filter: blur(12px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        }

        .leaflet-control-geosearch form {
          background: transparent !important;
        }

        .leaflet-control-geosearch input {
          background: rgba(39, 39, 42, 0.8) !important;
          color: #f4f4f5 !important;
          border: 1px solid rgba(99, 102, 241, 0.3) !important;
          border-radius: 8px !important;
          padding: 10px 40px 10px 12px !important;
          font-size: 14px !important;
          transition: all 0.3s ease !important;
        }

        .leaflet-control-geosearch input:focus {
          border-color: rgb(99, 102, 241) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1) !important;
          outline: none !important;
        }

        .leaflet-control-geosearch input::placeholder {
          color: #a1a1aa !important;
        }

        .leaflet-control-geosearch .results {
          background: rgba(24, 24, 27, 0.98) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          border-radius: 8px !important;
          margin-top: 8px !important;
          backdrop-filter: blur(12px);
          max-height: 300px !important;
          overflow-y: auto !important;
        }

        .leaflet-control-geosearch .results > * {
          background: transparent !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
          color: #e4e4e7 !important;
          padding: 12px !important;
          transition: all 0.2s ease !important;
        }

        .leaflet-control-geosearch .results > *:hover {
          background: rgba(99, 102, 241, 0.15) !important;
          color: #ffffff !important;
        }

        .leaflet-control-geosearch .results.active {
          display: block !important;
        }

        .leaflet-control-geosearch a.reset {
          background: transparent !important;
          color: #a1a1aa !important;
          transition: color 0.2s ease !important;
        }

        .leaflet-control-geosearch a.reset:hover {
          color: rgb(99, 102, 241) !important;
        }

        /* Custom scrollbar for results */
        .leaflet-control-geosearch .results::-webkit-scrollbar {
          width: 6px;
        }

        .leaflet-control-geosearch .results::-webkit-scrollbar-track {
          background: rgba(39, 39, 42, 0.5);
          border-radius: 3px;
        }

        .leaflet-control-geosearch .results::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.5);
          border-radius: 3px;
        }

        .leaflet-control-geosearch .results::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.7);
        }
      `}</style>

        <MapContainer
          center={[initialLat, initialLng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <SearchField onSearchResult={handleSearchResult} />
          <LocationMarker
            onLocationSelect={onLocationSelect}
            searchPosition={searchPosition}
          />
        </MapContainer>
      </motion.div>
    </motion.div>
  );
}
