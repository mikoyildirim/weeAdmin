// src/pages/Rentals.js
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Input, Typography, message, Card } from "antd";
import { useSelector } from "react-redux";
import axios from "../api/axios"; // senin axios instance
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const { Title } = Typography;

const Rentals = () => {
  const user = useSelector((state) => state.user.user);
  const userPermissions = user?.permissions || {};
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(false);

  const [endModalVisible, setEndModalVisible] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [duration, setDuration] = useState(0);
  const [total, setTotal] = useState(0);

  const [mapVisible, setMapVisible] = useState(false);
  const [mapData, setMapData] = useState([]);
  const [geofences, setGeofences] = useState([]);

  // Kiralama ve geofence verilerini çek
  useEffect(() => {
    fetchRentals();
    fetchGeofences();
  }, []);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/rentals/find/active/rentals");
      setRentals(res.data || []);
    } catch (err) {
      message.error("Kiralama verileri alınamadı!");
    } finally {
      setLoading(false);
    }
  };

  const fetchGeofences = async () => {
    try {
      const res = await axios.get("/geofences");
      setGeofences(res.data || []);
    } catch (err) {
      console.log("Geofence alınamadı");
    }
  };

  // Sürüş sonlandırma modalını aç
const openEndModal = (rental) => {
  setSelectedRental(rental);

  const startPrice = rental.device.priceObject.startPrice;
  const minutePrice = rental.device.priceObject.minutePrice;

  // Sunucudan gelen tarih (rental.date) -> güncel tarihten çıkar
  const rentalStart = new Date(rental.date); // UTC
  const now = new Date(); // client local
  const diffMinutes = Math.round((now - rentalStart) / (1000 * 60)); // fark dakika cinsinden

  let totalCalc = startPrice;
  if (diffMinutes > 1) {
    totalCalc += (diffMinutes - 1) * minutePrice;
  }

  setDuration(diffMinutes);
  setTotal(totalCalc.toFixed(2));
  setEndModalVisible(true);
};
  // Sürüşü sonlandır
  const handleEndRental = async () => {
    try {
      await axios.post("/rentals/endManual", {
        rentalID: selectedRental._id,
        durationtime: duration,
        total,
      });
      message.success("Sürüş başarıyla sonlandırıldı!");
      setEndModalVisible(false);
      fetchRentals(); // listeyi güncelle
    } catch (err) {
      message.error("Sürüş sonlandırılamadı!");
    }
  };

  // Harita modalını aç
  const openMapModal = (avldatas) => {
    setMapData(avldatas);
    setMapVisible(true);
  };

  // Harita oluştur
  useEffect(() => {
    if (mapVisible && mapData.length > 0) {
      const map = L.map("map").setView([mapData[mapData.length - 1].lat, mapData[mapData.length - 1].lng], 17);

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        minZoom: 12,
      }).addTo(map);

      const markers = L.layerGroup().addTo(map);
      const lines = L.layerGroup().addTo(map);
      const pointList = mapData.map((p) => [p.lat, p.lng]);

      L.marker([mapData[0].lat, mapData[0].lng]).addTo(markers);
      L.polyline(pointList, { color: "red", weight: 3, opacity: 0.5 }).addTo(lines);

      geofences.forEach(area => {
        area.locations.forEach(loc => {
          const coords = loc.polygon.coordinates[0].map(c => [c[1], c[0]]);
          let color = "grey";
          if (loc.type === "DENY") color = "red";
          if (loc.type === "SpeedLimitedZone") color = "yellow";
          L.polygon(coords, { color, fillColor: color, fillOpacity: 0.4 }).addTo(map);
        });
      });
    }
  }, [mapVisible, mapData, geofences]);

  const columns = [
    { title: "Tarih", dataIndex: "date", key: "date", render: d => new Date(d).toLocaleString(), align: "center" },
    { title: "QR", dataIndex: ["device", "qrlabel"], key: "qr", align: "center", render: (_, r) => <Button type="link" onClick={() => openMapModal(r.avldatas)}>{r.device.qrlabel}</Button> },
    { title: "Kiracı", dataIndex: ["member", "first_name"], key: "member", render: (_, r) => `${r.member.first_name} ${r.member.last_name}`, align: "center" },
    { title: "Telefon", dataIndex: ["member", "gsm"], key: "gsm", render: gsm => <a href={`/searchmember?gsm=${gsm}`}>{gsm}</a>, align: "center" },
    { title: "Batarya", dataIndex: ["device", "battery"], key: "battery", render: b => `%${b || 0}`, align: "center" },
    { title: "Şehir", dataIndex: ["device", "city"], key: "city", render: (_, r) => `${r.device.city}/${r.device.town}`, align: "center" },
    { title: "Nokta Sayısı", dataIndex: "avldatas", key: "points", render: avl => avl.length, align: "center" },
  ];

  if (userPermissions?.endRental) {
    columns.push({ title: "Sürüş Sonlandırma", key: "end", align: "center", render: (_, record) => <Button type="primary" onClick={() => openEndModal(record)}>Sonlandır</Button> });
  }

  columns.push({ title: "İşlem Versiyon", dataIndex: "version", key: "version", render: v => (v && v !== "old_version" ? v : "eski sürüm"), align: "center" });

  return (
    <Card>
      <Title level={2}>Aktif Kiralamalar</Title>
      <Table
        dataSource={rentals}
        columns={columns}
        rowKey={r => r._id}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal visible={endModalVisible} title="Sürüş Sonlandırma" onCancel={() => setEndModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEndModalVisible(false)}>Vazgeç</Button>,
          <Button key="submit" type="primary" onClick={handleEndRental}>Bitir</Button>
        ]}
      >
        <label>Sürüş Süresi(dk):
          <Input type="number" value={duration} onChange={e => {
            const val = parseInt(e.target.value, 10) || 0;
            setDuration(val);

            const startPrice = selectedRental.device.priceObject.startPrice;
            const minutePrice = selectedRental.device.priceObject.minutePrice;
            let totalCalc = startPrice;
            if (val > 1) totalCalc += (val - 1) * minutePrice;
            setTotal(totalCalc.toFixed(2));
          }} />
        </label>
        <label>Sürüş Tutarı(₺):
          <Input type="text" value={total} readOnly />
        </label>
      </Modal>

      <Modal visible={mapVisible} title="Harita Konumu" onCancel={() => setMapVisible(false)} width="80%"
        footer={[
          <Button key="close" onClick={() => setMapVisible(false)}>Kapat</Button>
        ]}
      >
        <div id="map" style={{ height: "70vh" }}></div>
      </Modal>
    </Card>
  );
};

export default Rentals;
