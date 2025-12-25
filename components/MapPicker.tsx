'use client';

import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
import 'leaflet-geosearch/dist/geosearch.css';

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
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

    const provider = new OpenStreetMapProvider({
      params: {
        countrycodes: 'in', // Restrict to India
        addressdetails: 1,
      },
    });

    // @ts-ignore - GeoSearchControl types are incomplete
    const searchControl = new GeoSearchControl({
      provider,
      style: 'bar',
      autoComplete: true,
      autoCompleteDelay: 250,
      showMarker: false, // We'll use our custom marker
      showPopup: false,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: true,
      searchLabel: 'Search for your college or location...',
    });

    map.addControl(searchControl);
    searchControlRef.current = searchControl;

    // Listen for search results
    map.on('geosearch/showlocation', (result: any) => {
      const { x, y } = result.location;
      onSearchResult(y, x); // lat, lng
      map.flyTo([y, x], 16, {
        duration: 1.5,
        easeLinearity: 0.25,
      });
    });

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
  initialLat = 19.0726, // Somaiya Vidyavihar University
  initialLng = 72.8978
}: MapPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [searchPosition, setSearchPosition] = useState<L.LatLng | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <div className="w-full h-[400px] rounded-xl overflow-hidden border border-white/10 shadow-lg">
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
    </div>
  );
}
