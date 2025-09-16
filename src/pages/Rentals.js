// src/pages/rentals.js
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Input, Typography, message, Card, Tooltip, Progress, Space } from "antd";
import { useSelector } from "react-redux";
import axios from "../api/axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const { Title, Text } = Typography;

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

  // Fetch kiralamalar ve geofence verileri
  const fetchRentals = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/rentals/find/active/rentals");
      setRentals(res.data || []);
    } catch {
      message.error("Kiralama verileri alınamadı!");
    } finally {
      setLoading(false);
    }
  };

  const fetchGeofences = async () => {
    try {
      const res = await axios.get("/geofences");
      setGeofences(res.data || []);
    } catch {
      console.log("Geofence alınamadı");
    }
  };

  // Otomatik veri yenileme
  useEffect(() => {
    fetchRentals();
    fetchGeofences();
    const interval = setInterval(() => {
      fetchRentals();
      fetchGeofences();
    }, 30000); // 30 saniyede bir
    return () => clearInterval(interval);
  }, []);

  const openEndModal = (rental) => {
    setSelectedRental(rental);
    const startPrice = rental.device.priceObject.startPrice;
    const minutePrice = rental.device.priceObject.minutePrice;
    const diffMinutes = Math.round((new Date() - new Date(rental.date)) / 60000);
    let totalCalc = startPrice;
    if (diffMinutes > 1) totalCalc += (diffMinutes - 1) * minutePrice;
    setDuration(diffMinutes);
    setTotal(totalCalc.toFixed(2));
    setEndModalVisible(true);
  };

  const handleEndRental = async () => {
    try {
      await axios.post("/rentals/endManual", {
        rentalID: selectedRental._id,
        durationtime: duration,
        total,
      });
      message.success("Sürüş başarıyla sonlandırıldı!");
      setEndModalVisible(false);
      fetchRentals();
    } catch {
      message.error("Sürüş sonlandırılamadı!");
    }
  };

  const openMapModal = (avldatas) => {
    setMapData(avldatas);
    setMapVisible(true);
  };

  // Büyük harita modalı
  useEffect(() => {
    if (mapVisible && mapData.length > 0) {
      const map = L.map("map").setView([mapData.at(-1).lat, mapData.at(-1).lng], 17);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, minZoom: 12 }).addTo(map);
      const markers = L.layerGroup().addTo(map);
      const lines = L.layerGroup().addTo(map);
      const pointList = mapData.map((p) => [p.lat, p.lng]);
      L.marker([mapData[0].lat, mapData[0].lng]).addTo(markers);
      L.polyline(pointList, { color: "red", weight: 3, opacity: 0.5 }).addTo(lines);
      geofences.forEach((area) =>
        area.locations.forEach((loc) => {
          const coords = loc.polygon.coordinates[0].map((c) => [c[1], c[0]]);
          let color = "grey";
          if (loc.type === "DENY") color = "red";
          if (loc.type === "SpeedLimitedZone") color = "yellow";
          L.polygon(coords, { color, fillColor: color, fillOpacity: 0.3 }).addTo(map);
        })
      );
    }
  }, [mapVisible, mapData, geofences]);

  // Mini haritalar (thumbnail)
  useEffect(() => {
    rentals.forEach((r) => {
      const miniMapId = `mini-map-${r._id}`;
      if (document.getElementById(miniMapId) && r.avldatas.length) {
        const miniMap = L.map(miniMapId, { zoomControl: false, attributionControl: false }).setView([r.avldatas[0].lat, r.avldatas[0].lng], 15);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(miniMap);
        const latlngs = r.avldatas.map((p) => [p.lat, p.lng]);
        L.polyline(latlngs, { color: "blue", weight: 2 }).addTo(miniMap);
      }
    });
  }, [rentals]);

  // Table kolonları
  const columns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      render: (d) => new Date(d).toLocaleString(),
      align: "center",
    },
    {
      title: "QR",
      dataIndex: ["device", "qrlabel"],
      key: "qr",
      align: "center",
      render: (_, r) => <Button type="primary" onClick={() => openMapModal(r.avldatas)}>{r.device.qrlabel}</Button>,
    },
    {
      title: "Kiracı",
      dataIndex: ["member", "first_name"],
      key: "member",
      render: (_, r) => `${r.member.first_name} ${r.member.last_name}`,
      align: "center",
    },
    {
      title: "Telefon",
      dataIndex: ["member", "gsm"],
      key: "gsm",
      render: (gsm) => <Button type="link" href={`/searchmember?gsm=${gsm}`}>{gsm}</Button>,
      align: "center",
    },
    {
      title: "Batarya",
      dataIndex: ["device", "battery"],
      key: "battery",
      align: "center",
      render: (b) => {
        let color = "green";
        if (b <= 20) color = "red";
        else if (b <= 50) color = "orange";
        return (
          <Tooltip title={`${b || 0}% Batarya`}>
            <Progress percent={b || 0} size="small" strokeColor={color} showInfo={false} />
          </Tooltip>
        );
      },
    },
    {
      title: "Şehir",
      dataIndex: ["device", "city"],
      key: "city",
      render: (_, r) => `${r.device.city}/${r.device.town}`,
      align: "center",
    },
    {
      title: "Nokta Sayısı",
      dataIndex: "avldatas",
      key: "points",
      align: "center",
      render: (avl, r) => (
        <Space direction="vertical" align="center">
          <Text>{avl.length}</Text>
          <Card size="small" style={{ width: 80, height: 80, padding: 0 }} bodyStyle={{ padding: 0 }}>
            <div id={`mini-map-${r._id}`} style={{ width: "100%", height: "100%" }} />
          </Card>
        </Space>
      ),
    },
  ];

  if (userPermissions?.endRental) {
    columns.push({
      title: "Sürüş Sonlandırma",
      key: "end",
      align: "center",
      render: (_, record) => <Button type="primary" onClick={() => openEndModal(record)}>Sonlandır</Button>,
    });
  }

  columns.push({
    title: "İşlem Versiyon",
    dataIndex: "version",
    key: "version",
    render: (v) => (v && v !== "old_version" ? v : "eski sürüm"),
    align: "center",
  });

  return (
    <Card style={{ borderRadius: 16, boxShadow: "0 8px 20px rgba(0,0,0,0.1)", padding: 24, margin: "20px 0" }}>
      <Title level={2}>Aktif Kiralamalar</Title>

      <Table
        dataSource={rentals}
        columns={columns}
        rowKey={(r) => r._id}
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName={(record, index) => (index % 2 === 0 ? "table-row-light" : "table-row-dark")}
        scroll={{ x: "max-content" }}
      />

      {/* Sürüş Sonlandırma Modal */}
      <Modal
        open={endModalVisible}
        title={<Title level={4} style={{ margin: 0 }}>Sürüş Sonlandırma</Title>}
        onCancel={() => setEndModalVisible(false)}
        width={400}
        bodyStyle={{ padding: "16px 24px" }}
        footer={<Space><Button onClick={() => setEndModalVisible(false)}>Vazgeç</Button><Button type="primary" onClick={handleEndRental}>Bitir</Button></Space>}
      >
        <Space direction="vertical" style={{ width: "100%" }}>
          <Text>Sürüş Süresi (dk):</Text>
          <Input
            type="number"
            value={duration}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 0;
              setDuration(val);
              const startPrice = selectedRental.device.priceObject.startPrice;
              const minutePrice = selectedRental.device.priceObject.minutePrice;
              let totalCalc = startPrice;
              if (val > 1) totalCalc += (val - 1) * minutePrice;
              setTotal(totalCalc.toFixed(2));
            }}
          />
          <Text>Sürüş Tutarı (₺):</Text>
          <Input type="text" value={total} readOnly />
        </Space>
      </Modal>

      {/* Büyük Harita Modal */}
      <Modal
        open={mapVisible}
        title={<Title level={4}>Harita Konumu</Title>}
        onCancel={() => setMapVisible(false)}
        width={800}
        bodyStyle={{ height: "60vh", padding: 0, borderRadius: 12 }}
        footer={<Button onClick={() => setMapVisible(false)}>Kapat</Button>}
      >
        <Card.Grid style={{ width: "100%", height: "100%", borderRadius: 12, padding: 0 }}>
          <div id="map" style={{ height: "100%" }} />
        </Card.Grid>
      </Modal>

      <style jsx>{`
        .table-row-light { background: #fafafa; }
        .table-row-dark { background: #fff; }
      `}</style>
    </Card>
  );
};

export default Rentals;
