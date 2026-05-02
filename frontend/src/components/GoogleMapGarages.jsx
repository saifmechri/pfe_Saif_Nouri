import { useMemo, useState } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "24px"
};

const defaultCenter = {
  lat: 35.8256,
  lng: 10.6369
};

const GoogleMapGarages = ({ 
  center, 
  userPosition, 
  garages, 
  featuredGarages = [],
  selectedGarageId, 
  onMarkerClick 
}) => {
  const [selectedFeaturedGarageId, setSelectedFeaturedGarageId] = useState(null);
  const mapCenter = center || defaultCenter;

  const normalizedFeaturedGarages = useMemo(
    () =>
      featuredGarages
        .filter((garage) => garage && garage.latitude !== null && garage.longitude !== null)
        .map((garage) => ({
          ...garage,
          latitude: Number(garage.latitude),
          longitude: Number(garage.longitude)
        })),
    [featuredGarages]
  );

  const userMarkerIcon = {
    path: "M12 0C5.38 0 0 5.38 0 12s5.38 12 12 12 12-5.38 12-12S18.62 0 12 0z",
    fillColor: "#f59e0b",
    fillOpacity: 1,
    strokeColor: "#fff",
    strokeWeight: 3,
    scale: 1.2
  };

  const garageMarkerIcon = {
    path: "M12 0C5.38 0 0 5.38 0 12s5.38 12 12 12 12-5.38 12-12S18.62 0 12 0z",
    fillColor: "#f59e0b",
    fillOpacity: 1,
    strokeColor: "#fff",
    strokeWeight: 2,
    scale: 1
  };

  const selectedGarageMarkerIcon = {
    ...garageMarkerIcon,
    fillColor: "#ea580c",
    scale: 1.2
  };

  const featuredGarageMarkerIcon = {
    ...garageMarkerIcon,
    fillColor: "#2563eb"
  };

  const selectedFeaturedGarageMarkerIcon = {
    ...featuredGarageMarkerIcon,
    fillColor: "#1d4ed8",
    scale: 1.15
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={mapCenter}
      zoom={10}
      options={{
        scrollwheel: true,
        mapTypeControl: true,
        fullscreenControl: true,
        streetViewControl: false
      }}
    >
      {userPosition && (
        <Marker
          position={userPosition}
          icon={userMarkerIcon}
          title="Ma localisation"
        >
          <InfoWindow>
            <div className="text-sm font-semibold">Ma localisation</div>
          </InfoWindow>
        </Marker>
      )}

      {garages
        .filter((garage) => garage.latitude !== null && garage.longitude !== null)
        .map((garage) => (
          <Marker
            key={garage.id}
            position={{ lat: garage.latitude, lng: garage.longitude }}
            icon={selectedGarageId === garage.id ? selectedGarageMarkerIcon : garageMarkerIcon}
            onClick={() => onMarkerClick(garage.id)}
            title={garage.name}
          >
            {selectedGarageId === garage.id && (
              <InfoWindow onCloseClick={() => onMarkerClick(null)}>
                <div className="space-y-1 p-2 w-48">
                  <p className="font-semibold text-sm">{garage.name}</p>
                  <p className="text-xs text-gray-600">{garage.adresse || "Adresse non précisée"}</p>
                  <p className="text-xs text-gray-600">Note: {garage.rating ?? "-"}</p>
                  {garage.specialties && (
                    <p className="text-xs text-amber-700 font-semibold">{String(garage.specialties).split(/\r?\n|,|;/)[0]}</p>
                  )}
                  {garage.distance_km !== null && garage.distance_km !== undefined && (
                    <p className="text-xs text-gray-600">Distance: {garage.distance_km.toFixed(1)} km</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

      {normalizedFeaturedGarages.map((garage) => (
        <Marker
          key={garage.id}
          position={{ lat: garage.latitude, lng: garage.longitude }}
          icon={selectedFeaturedGarageId === garage.id ? selectedFeaturedGarageMarkerIcon : featuredGarageMarkerIcon}
          onClick={() => setSelectedFeaturedGarageId((current) => (current === garage.id ? null : garage.id))}
          title={garage.name}
        >
          {selectedFeaturedGarageId === garage.id && (
            <InfoWindow onCloseClick={() => setSelectedFeaturedGarageId(null)}>
              <div className="space-y-1 p-2 w-52">
                <p className="font-semibold text-sm">{garage.name}</p>
                <p className="text-xs text-gray-600">{garage.adresse || garage.city || "Adresse non précisée"}</p>
                {garage.note && <p className="text-xs text-blue-700 font-semibold">{garage.note}</p>}
              </div>
            </InfoWindow>
          )}
        </Marker>
      ))}
    </GoogleMap>
  );
};

export default GoogleMapGarages;
