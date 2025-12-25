'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';

interface HeatmapPoint {
    lat: number;
    lng: number;
    intensity: number;
}

interface AdminHeatmapProps {
    tickets: Array<{
        id: string;
        location: { lat: number; lng: number };
        status: string;
        ai_priority?: number;
    }>;
    flyToLocation?: { lat: number; lng: number } | null;
}

function HeatmapLayer({ points }: { points: HeatmapPoint[] }) {
    const map = useMap();
    const heatLayerRef = useRef<any>(null);

    useEffect(() => {
        if (!map || points.length === 0) return;

        // Remove existing heat layer
        if (heatLayerRef.current) {
            map.removeLayer(heatLayerRef.current);
        }

        // Create heat points array [lat, lng, intensity]
        const heatPoints = points.map((point) => [
            point.lat,
            point.lng,
            point.intensity / 10, // Normalize to 0-1 range
        ]);

        // @ts-ignore - leaflet.heat types are incomplete
        const heatLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 35,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: '#4f46e5', // Indigo (low priority)
                0.4: '#eab308', // Yellow (medium)
                0.7: '#f97316', // Orange (high)
                1.0: '#ef4444', // Red (critical)
            },
        });

        heatLayer.addTo(map);
        heatLayerRef.current = heatLayer;

        return () => {
            if (heatLayerRef.current) {
                map.removeLayer(heatLayerRef.current);
            }
        };
    }, [map, points]);

    return null;
}

function FlyToLocation({ location }: { location: { lat: number; lng: number } | null }) {
    const map = useMap();

    useEffect(() => {
        if (location) {
            map.flyTo([location.lat, location.lng], 17, {
                duration: 1.5,
                easeLinearity: 0.25,
            });
        }
    }, [location, map]);

    return null;
}

export default function AdminHeatmap({ tickets, flyToLocation }: AdminHeatmapProps) {
    // Filter for open tickets and create heatmap points
    const heatmapPoints: HeatmapPoint[] = tickets
        .filter((ticket) => ticket.status === 'open')
        .map((ticket) => ({
            lat: ticket.location.lat,
            lng: ticket.location.lng,
            intensity: ticket.ai_priority || 5,
        }));

    // Calculate center based on all tickets or default to Somaiya
    const center: [number, number] =
        tickets.length > 0
            ? [
                tickets.reduce((sum, t) => sum + t.location.lat, 0) / tickets.length,
                tickets.reduce((sum, t) => sum + t.location.lng, 0) / tickets.length,
            ]
            : [19.0726, 72.8978];

    return (
        <div className="w-full h-full rounded-xl overflow-hidden border border-white/10 shadow-lg">
            <MapContainer
                center={center}
                zoom={14}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <HeatmapLayer points={heatmapPoints} />
                <FlyToLocation location={flyToLocation || null} />
            </MapContainer>
        </div>
    );
}
