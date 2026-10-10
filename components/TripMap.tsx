"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import { useEffect } from "react";

export type MapLocation = {
  name: string;
  latitude: number;
  longitude: number;
  description: string;
};

const places: MapLocation[] = [
  {
    name: "Hawa Mahal",
    latitude: 26.9239,
    longitude: 75.8267,
    description: "Discover Jaipur's iconic Palace of Winds.",
  },
  {
    name: "City Palace",
    latitude: 26.9258,
    longitude: 75.8237,
    description: "Explore Jaipur's royal heritage.",
  },
  {
    name: "Albert Hall Museum",
    latitude: 26.9117,
    longitude: 75.8197,
    description: "Explore art, history, and architecture.",
  },
  {
    name: "Jantar Mantar",
    latitude: 26.9248,
    longitude: 75.8246,
    description: "Visit the historic astronomical observatory.",
  },
];

const routeCoordinates: [number, number][] = places.map((place) => [
  place.latitude,
  place.longitude,
]);

function FitMapToPlaces() {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(routeCoordinates);
    map.fitBounds(bounds, { padding: [45, 45] });
  }, [map]);

  return null;
}

export default function TripMap() {
  return (
    <div className="trip-map-showcase">
      <div className="trip-map-heading">
        <div>
          <span className="trip-map-eyebrow">YOUR JOURNEY, VISUALIZED</span>
          <h3>Explore Jaipur</h3>
          <p>
            A preview of the places you could discover on your next adventure.
          </p>
        </div>

        <span className="trip-map-badge">MAP PREVIEW</span>
      </div>

      <MapContainer
        center={[26.9124, 75.7873]}
        zoom={13}
        scrollWheelZoom={false}
        className="trip-leaflet-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitMapToPlaces />

        <Polyline
          positions={routeCoordinates}
          pathOptions={{
            color: "#315c45",
            weight: 4,
            opacity: 0.8,
            dashArray: "8 8",
          }}
        />

        {places.map((place, index) => (
          <Marker
            key={place.name}
            position={[place.latitude, place.longitude]}
          >
            <Popup>
              <strong>
                {index + 1}. {place.name}
              </strong>
              <br />
              {place.description}
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <div className="trip-map-footer">
        <span>📍 4 featured destinations</span>
        <span>Illustrative route · Not turn-by-turn navigation</span>
      </div>
    </div>
  );
}