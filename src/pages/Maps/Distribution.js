import React, { useEffect, useState } from "react";
import { Card, Row, Col, Spin, DatePicker, Button, Space, message } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import "leaflet.markercluster";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.locale("tr");

const Distribution = () => {
  const [loading, setLoading] = useState(false);
  const [activeDevicesCount, setActiveDevicesCount] = useState(0);
  const [points, setPoints] = useState([]);
  const [mapInstance, setMapInstance] = useState(null);
  const [dateRange, setDateRange] = useState([dayjs().startOf("day"), dayjs().endOf("day")]);

  // Leaflet map init
  useEffect(() => {
    const map = L.map("map").setView([39.750359, 37.015598], 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://weescooter.com.tr">Wes İleri Teknoloji A.Ş.</a>',
    }).addTo(map);

    setMapInstance(map);
  }, []);

  // Fetch data from API
  const fetchDistribution = async () => {
    setLoading(true);
    try {
      const startHour = dayjs(dateRange[0]).hour();
      const endHour = dayjs(dateRange[1]).hour();

      const { data } = await axios.post("/heatmaps", {
        start: startHour,
        end: endHour,
      });

      setActiveDevicesCount(data.activeDevicesCount);
      setPoints(data.distributionArray || []);
      drawPointsOnMap(data.distributionArray || []);
    } catch (err) {
      console.error(err);
      message.error("Veri çekilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  // Draw points on map
  const drawPointsOnMap = (data) => {
    if (!mapInstance) return;
    mapInstance.eachLayer((layer) => {
      if (layer instanceof L.MarkerClusterGroup || layer instanceof L.Circle || layer instanceof L.Marker) {
        mapInstance.removeLayer(layer);
      }
    });

    const markers = L.markerClusterGroup();
    data.forEach((point) => {
      if (point.recommendedDevices <= 0) return;

      let color = "#1E90FF";
      if (point.recommendedDevices > 5) color = "#FFA500";
      if (point.recommendedDevices > 10) color = "#FF4500";

      const circle = L.circle([point.lat, point.lng], {
        radius: point.recommendedDevices * 20,
        color,
        fillColor: color,
        fillOpacity: 0.3,
      }).bindPopup(
        `<b>📍 Bölge</b><br>
        🔄 Kiralama: ${point.count}<br>
        🛴 Önerilen cihaz: <b>${point.recommendedDevices}</b>`
      );

      const label = L.divIcon({
        className: "label-text",
        html: `🛴 ${point.recommendedDevices}`,
        iconSize: [50, 20],
        iconAnchor: [25, 10],
      });

      const labelMarker = L.marker([point.lat, point.lng], {
        icon: label,
        interactive: false,
      });

      markers.addLayer(circle);
      markers.addLayer(labelMarker);
    });

    mapInstance.addLayer(markers);

    if (data.length) {
      const bounds = data.map((p) => [p.lat, p.lng]);
      mapInstance.fitBounds(bounds);
    }
  };

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Scooter Dağılım Önerisi" bordered={false}>
            <Space style={{ marginBottom: 16 }}>
              <DatePicker.RangePicker
                format="HH:mm"
                picker="time"
                value={dateRange}
                onChange={(val) => setDateRange(val)}
              />
              <Button type="primary" onClick={fetchDistribution}>
                Verileri Getir
              </Button>
            </Space>
            <p>
              Toplam Aktif Scooter:{" "}
              <strong>{activeDevicesCount}</strong>
            </p>
          </Card>
        </Col>

        <Col span={24}>
          <Card>
            {loading ? (
              <Spin size="large" />
            ) : (
              <div id="map" style={{ height: "80vh", width: "100%" }}></div>
            )}
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .leaflet-div-icon {
          background: transparent;
          border: none;
        }
        .label-text {
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 13px;
          font-weight: bold;
          padding: 3px 6px;
          border-radius: 6px;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
};

export default Distribution;
