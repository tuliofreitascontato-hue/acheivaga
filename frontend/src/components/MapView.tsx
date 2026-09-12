import { useEffect, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { ParkingSpot } from '../types';

// ícones customizados via divIcon — evita depender dos ícones padrão do
// Leaflet (que quebram fácil no bundler) e já codifica o status por cor.
function spotIcon(status: ParkingSpot['status']) {
  const color = status === 'available' ? '#2ED9A8' : '#8FA0AE';
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 18px; height: 18px; border-radius: 50%;
      background: ${color}; border: 3px solid #101820;
      box-shadow: 0 0 0 2px ${color}55;
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

const meIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 16px; height: 16px; border-radius: 50%;
    background: #4E9BFF; border: 3px solid white;
  "></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Centraliza no usuário apenas na primeira localização recebida — depois
// disso o mapa fica livre para o usuário arrastar/dar zoom sem ser puxado
// de volta a cada tick do GPS (bug comum em apps de mapa "ingênuos").
// O botão "recenter" (RecenterButton) permite voltar manualmente.
function InitialRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const hasCentered = useRef(false);
  useEffect(() => {
    if (hasCentered.current) return;
    hasCentered.current = true;
    map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

function RecenterButton({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <button
      onClick={() => map.setView([lat, lng], 17, { animate: true })}
      aria-label="Centralizar na minha localização"
      style={{
        position: 'absolute',
        right: 16,
        bottom: 96,
        zIndex: 500,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'var(--surface-raised, #1B2530)',
        color: '#4E9BFF',
        border: '1px solid rgba(255,255,255,0.1)',
        fontSize: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      ⦿
    </button>
  );
}

interface Props {
  center: { lat: number; lng: number };
  spots: ParkingSpot[];
  onSelectSpot: (spot: ParkingSpot) => void;
}

export function MapView({ center, spots, onSelectSpot }: Props) {
  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={17}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InitialRecenter lat={center.lat} lng={center.lng} />
      <RecenterButton lat={center.lat} lng={center.lng} />
      <Marker position={[center.lat, center.lng]} icon={meIcon} />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={spotIcon(spot.status)}
          eventHandlers={{ click: () => onSelectSpot(spot) }}
        />
      ))}
    </MapContainer>
  );
}
