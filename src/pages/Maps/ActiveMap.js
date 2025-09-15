// src/pages/Maps/ActiveMap.js
import React, { useEffect, useState } from "react";
import { Spin, Button } from "antd";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "../../api/axios";

// Leaflet default icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

// Renkli ikon factory
const colorIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

const getIconByDevice = (device) => {
  if (device.status === "BUSY") return colorIcon("black");
  const battery = Number(device.battery);
  if (!isNaN(battery)) {
    if (battery >= 60) return colorIcon("green");
    if (battery >= 40) return colorIcon("blue");
    if (battery >= 20) return colorIcon("orange");
    return colorIcon("red");
  }
  return colorIcon("red");
};

const ActiveMap = () => {
  const [devices, setDevices] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const devRes = await axios.get("/devices/connected");
        setDevices(Array.isArray(devRes.data) ? devRes.data : []);

        try {
          const geoRes = await axios.get("/geofences/list");
          setGeofences(Array.isArray(geoRes.data) ? geoRes.data : []);
        } catch (e) {
          setGeofences([]);
        }
      } catch (err) {
        console.error("devices/connected alınırken hata:", err);
        setDevices([]);
        setGeofences([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const devicesWithLocation = devices.filter(
    (d) =>
      d &&
      d.last_location &&
      d.last_location.location &&
      Array.isArray(d.last_location.location.coordinates) &&
      d.last_location.location.coordinates.length >= 2 &&
      d.last_location.location.coordinates[0] != null &&
      d.last_location.location.coordinates[1] != null
  );

  const center = devicesWithLocation.length
    ? [
        parseFloat(devicesWithLocation[0].last_location.location.coordinates[1]),
        parseFloat(devicesWithLocation[0].last_location.location.coordinates[0]),
      ]
    : [39.75, 37.02]; // Sivas fallback

  const handleRing = async (imei) => {
    try {
      await axios.post("/devices/sendAlarm", { imei });
      alert("Zil çalma komutu gönderildi.");
    } catch {
      alert("Zil gönderilemedi.");
    }
  };

  const handleRequestLocation = async (imei) => {
    try {
      await axios.post("/devices/sendLocation", { imei });
      alert("Konum isteği gönderildi.");
    } catch {
      alert("Konum isteği gönderilemedi.");
    }
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", background: "#f5f7fa" }}>
      {loading ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#f5f7fa",
          }}
        >
          <Spin size="large" tip="Harita yükleniyor..." />
        </div>
      ) : (
        <MapContainer center={center} zoom={devicesWithLocation.length ? 13 : 6} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />

          {/* Markers */}
          {devicesWithLocation.map((device) => {
            const coords = device.last_location.location.coordinates;
            const lon = parseFloat(coords[0]);
            const lat = parseFloat(coords[1]);
            const key = device.imei || device.id || `${lat}-${lon}`;

            return (
              <Marker key={key} position={[lat, lon]} icon={getIconByDevice(device)}>
                <Popup minWidth={200}>
                  <div style={{ lineHeight: 1.5 }}>
                    <div><strong>IMEI:</strong> {device.imei || "-"}</div>
                    <div><strong>QRCODE:</strong> {device.qrlabel || "-"}</div>
                    <div><strong>BATARYA:</strong> %{device.battery ?? "-"}</div>
                    <div><strong>DURUM:</strong> {device.status ?? "-"}</div>
                    <div style={{ marginTop: 6 }}>
                      <a
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`}
                      >
                        Konuma Git
                      </a>
                    </div>
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <Button size="small" onClick={() => handleRing(device.imei)}>Zil Çal</Button>
                      <Button size="small" onClick={() => handleRequestLocation(device.imei)}>Konum İste</Button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Geofences */}
          {Array.isArray(geofences) &&
            geofences.map((area, i) =>
              Array.isArray(area.locations)
                ? area.locations.map((loc, j) => {
                    if (!loc || !loc.polygon || !Array.isArray(loc.polygon.coordinates)) return null;
                    const coords = loc.polygon.coordinates[0].map((c) => [c[1], c[0]]);
                    let color = "grey";
                    let fill = 0.2;
                    switch (loc.type) {
                      case "DENY":
                        color = "red";
                        fill = 0.2;
                        break;
                      case "SCORE":
                        color = "yellow";
                        fill = 0.5;
                        break;
                      case "STATION":
                        color = "green";
                        fill = 0.3;
                        break;
                      case "SpeedLimitedZone":
                        color = "black";
                        fill = 0.4;
                        break;
                    }
                    return <Polygon key={`${i}-${j}`} positions={coords} pathOptions={{ color, fillColor: color, fillOpacity: fill }} />;
                  })
                : null
            )}
        </MapContainer>
      )}
    </div>
  );
};

export default ActiveMap;
