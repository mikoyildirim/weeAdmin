import React, { useEffect, useState } from "react";
import { Spin, Button } from "antd";
import { MapContainer, TileLayer, Marker, Popup, Polygon } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "../../api/axios";
import dayjs from "dayjs";
import utc from 'dayjs/plugin/utc';
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

dayjs.extend(utc);



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



const LostMap = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [polygons, setPolygons] = useState([]);
  const userName = useSelector((state) => state.auth.user?.name) || {};

  console.log(devices)

  const fetchPolygons = async () => { // polygonları backend den çekiyoruz 
    try {
      const res = await axios.get("/geofences");
      setPolygons(res.data || []);
    } catch {
      console.log("Geofence alınamadı");
    }
  };

  const fetchLostDevices = async () => { // bağlı cihazları backend den çekiyoruz
    setLoading(true);
    try {
      const devRes = await axios.get("/devices/lostDevices");
      setDevices(Array.isArray(devRes.data) ? devRes.data : []);
    } catch (err) {
      console.error("devices/lostDevices alınırken hata:", err);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const lostUpdate = async (supportID) => {
    await axios.post(`supports/${supportID}`, {
      status: 'DONE',
      note: `${userName} tarafından cihaz bulundu.`
    })
      .then((res) => {
        console.log(res)
      })
      .catch(err => console.log(err))
  }

  useEffect(() => {
    fetchLostDevices();
    fetchPolygons();
  }, []);

  const devicesWithLocation = devices.filter(
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
                    <div><strong>TARİH:</strong> {dayjs.utc(device.created_date).format('DD.MM.YYYY HH:mm') || "-"}</div>
                    <div><strong>QRCODE:</strong> {device.qrlabel} </div>
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
                    <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                      <Button size="small" onClick={() => lostUpdate(device?.support_id)}>Cihaz Bulundu</Button>
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

export default LostMap;
