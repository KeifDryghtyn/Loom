import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in Leaflet + React
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface GeoMapProps {
  data: any[];
  latField: string;
  lngField: string;
  labelField?: string;
  valueField?: string;
}

export default function GeoMap({ data, latField, lngField, labelField, valueField }: GeoMapProps) {
  const points = data.map(d => ({
    lat: Number(d[latField]),
    lng: Number(d[lngField]),
    label: labelField ? String(d[labelField]) : '',
    value: valueField ? Number(d[valueField]) : 0
  })).filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  if (points.length === 0) {
    return <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">No coordinate data found</div>;
  }

  const center: [number, number] = [points[0].lat, points[0].lng];

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-100">
      <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="opacity-90"
        />
        {points.map((p, i) => (
          valueField ? (
            <CircleMarker 
              key={i} 
              center={[p.lat, p.lng]} 
              radius={Math.min(20, Math.max(5, p.value / 10))}
              pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.5 }}
            >
              <Popup>
                <div className="text-xs font-bold">{p.label}</div>
                <div className="text-xs text-slate-500">{p.value}</div>
              </Popup>
            </CircleMarker>
          ) : (
            <Marker key={i} position={[p.lat, p.lng]}>
              <Popup>
                <div className="text-xs font-bold">{p.label}</div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
