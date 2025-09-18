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

const getIconByDevice = (device) => { // backendden çekilen cihazların durumuna göre iconların rengini ayarlıyoruz
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

const PassiveMap = () => {
  const [activeDevices, setActiveDevices] = useState([]);
  const [allDevices, setAllDevices] = useState([]);
  const [passiveDevices, setPassiveDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [polygons, setPolygons] = useState([]);

  const fetchPolygons = async () => { // polygonları backend den çekiyoruz 
    setLoading(true);
    try {
      const res = await axios.get("/geofences");
      setPolygons(res.data || []);
    } catch {
      console.log("Geofence alınamadı");
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedDevices = async () => { // bağlı cihazları backend den çekiyoruz
    setLoading(true);
    try {
      const devRes = await axios.get("/devices/connected");
      setActiveDevices(Array.isArray(devRes.data) ? devRes.data : []); // response sonucu bir array ise o array i bizim değerimize yüklüyor. yok değilse boş array yüklüyor
    } catch (err) {
      console.error("devices/connected alınırken hata:", err);
      setActiveDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDevices = async () => {
    setLoading(true);
    try {
      const devRes = await axios.get("/devices")
      setAllDevices(Array.isArray(devRes.data) ? devRes.data : []) // response sonucu bir array ise o array i bizim değerimize yüklüyor. yok değilse boş array yüklüyor
    } catch (err) {
      console.error("devices alınırken hata:", err);
      setAllDevices([]);
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllDevices()
    fetchConnectedDevices();
    fetchPolygons();
  }, []);

  useEffect(() => { // endpointlere istek atma işlemi bittikten sonra bütün cihazlar listesinden actif cihazlar listesini çıkarıyoruz ve kalan cihazlar pasif cihazlar oluyor. bu cihazları haritada gösteriyoruz.
    const activeDevicesQrlabels = new Set(activeDevices.map(item => item.qrlabel));
    const filtered = allDevices.filter(item => !activeDevicesQrlabels.has(item.qrlabel))
    setPassiveDevices(filtered)
  }, [loading, activeDevices, allDevices])

  const devicesWithLocation = passiveDevices.filter(
    (d) =>
      d?.last_location?.location &&
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

  // Dünya poligonu (gri arkaplan)
  const worldPolygon = [
    [-90, -180],
    [-90, 180],
    [90, 180],
    [90, -180],
  ];

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative", background: "#f5f7fa" }}>
      {loading ? (
        <div style={{ height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
          <Spin size="large" tip="Harita yükleniyor..." />
        </div>
      ) : (
        <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
          />

          {/* Markers */}
          {devicesWithLocation.map((device) => {
            const [lon, lat] = device.last_location.location.coordinates.map(Number);
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
                      <a target="_blank" rel="noreferrer"
                        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&travelmode=driving`}>
                        Konuma Git
                      </a>
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <a rel="noreferrer"
                        href={`/panel/devices/detail/${device.qrlabel}`}>
                        Son Kullanıcı
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Geofences */}
          {Array.isArray(polygons) &&
            (() => {
              const allowHoles = []; // ALLOW bölgeleri için delik
              const denyPolygons = [];
              const allowBorders = [];

              polygons.forEach((area) => {
                if (!Array.isArray(area.locations)) return;

                area.locations.forEach((loc) => {
                  if (!loc?.polygon?.coordinates) return;

                  const coords = loc.polygon.coordinates[0].map((c) => [c[1], c[0]]);

                  if (loc.type === "ALLOW") {
                    allowHoles.push(coords); // gri poligon içinde delik
                    allowBorders.push(
                      <Polygon
                        key={`allow-${loc._id}`}
                        positions={coords}
                        pathOptions={{ color: "grey", fillOpacity: 0, weight: 2 }}
                      />
                    );
                  }

                  if (loc.type === "DENY") {
                    denyPolygons.push(
                      <Polygon
                        key={`deny-${loc._id}`}
                        positions={coords}
                        pathOptions={{ color: "red", fillColor: "red", fillOpacity: 0.3 }}
                      >
                        <Popup>
                          <strong>{loc.name}</strong> <br />
                          Tip: {loc.type}
                        </Popup>
                      </Polygon>
                    );
                  }
                });
              });

              return (
                <>
                  {/* Gri dünya poligonu + ALLOW delikleri */}
                  <Polygon
                    positions={[worldPolygon, ...allowHoles]}
                    pathOptions={{ color: "grey", fillColor: "grey", fillOpacity: 0.3, stroke: false }}
                  />
                  {denyPolygons}
                  {allowBorders}
                </>
              );
            })()}
        </MapContainer>
      )}
    </div>
  );
};

export default PassiveMap;
