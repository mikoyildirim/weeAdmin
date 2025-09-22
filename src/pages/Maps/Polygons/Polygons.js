// src/pages/Maps/Polygons.js
import React, { useEffect, useState, useRef } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Card } from "antd";
import axios from "../../../api/axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

const { Option } = Select;

const Polygons = () => {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPolygon, setEditingPolygon] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(new L.FeatureGroup());

  // API'den poligonları çek
  const fetchPolygons = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/geofences");
      setGeofences(res.data[0]?.locations || []);
    } catch (err) {
      message.error("Poligonlar yüklenemedi!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPolygons();
  }, []);

  // Poligon silme
  const deletePolygon = async (id) => {
    try {
      await axios.patch(`/geofences/deletelocation/62b2d0760ece1d36e58a20dd`, { location_id: id });
      message.success("Poligon silindi");
      fetchPolygons();
    } catch (err) {
      message.error("Silme işlemi başarısız");
    }
  };

  // Poligon ekleme / güncelleme
  const handleSubmit = async (values) => {
    try {
      const polygon = JSON.parse(values.polygon);
      if (editingPolygon) {
        await axios.patch(`/geofences/updatelocation/62b2d0760ece1d36e58a20dd`, {
          ...values,
          location_id: editingPolygon._id,
          polygon,
        });
        message.success("Poligon güncellendi");
      } else {
        await axios.post(`/geofences/createlocation/62b2d0760ece1d36e58a20dd`, {
          ...values,
          polygon,
        });
        message.success("Poligon eklendi");
      }
      fetchPolygons();
      setModalVisible(false);
      form.resetFields();
      setEditingPolygon(null);
      clearDrawnItems();
    } catch (err) {
      message.error("Kaydetme işlemi başarısız");
    }
  };

  // Modal açıldığında düzenleme için poligon verilerini yükle
  const openEditModal = (polygon) => {
    setEditingPolygon(polygon);
    form.setFieldsValue({ ...polygon, polygon: JSON.stringify(polygon.polygon) });
    setModalVisible(true);
    setTimeout(() => {
      if (polygon.polygon && polygon.polygon.coordinates[0].length > 0) {
        drawPolygonOnMap(polygon.polygon.coordinates[0]);
      }
    }, 100);
  };

  // Haritaya poligon çizimi
  const drawPolygonOnMap = (coords) => {
    if (!mapRef.current) return;
    const latlngs = coords.map(([lng, lat]) => [lat, lng]);
    clearDrawnItems();
    const layer = L.polygon(latlngs);
    layer.addTo(drawnItemsRef.current);
    mapRef.current.fitBounds(layer.getBounds());
  };

  const clearDrawnItems = () => {
    drawnItemsRef.current.clearLayers();
  };

  // Harita başlatma
  const initializeMap = () => {
    if (mapRef.current) return;

    const map = L.map("map", { minZoom: 6 }).setView([39.9042, 32.8594], 6);
    mapRef.current = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 20,
      attribution: '&copy; <a href="https://weescooter.com.tr">Wes İleri Teknoloji A.Ş.</a>'
    }).addTo(map);

    drawnItemsRef.current.addTo(map);

    const drawControl = new L.Control.Draw({
      draw: { polygon: true, polyline: false, rectangle: false, circle: false, marker: false },
      edit: { featureGroup: drawnItemsRef.current, edit: true, remove: true }
    });
    map.addControl(drawControl);

    map.on("draw:created", (e) => {
      const layer = e.layer;
      drawnItemsRef.current.clearLayers();
      drawnItemsRef.current.addLayer(layer);
      updatePolygonField(layer);
    });

    map.on("draw:edited", (e) => {
      e.layers.eachLayer((layer) => updatePolygonField(layer));
    });
  };

  const updatePolygonField = (layer) => {
    const coords = layer.getLatLngs()[0].map((c) => [c.lng, c.lat]);
    coords.push(coords[0]);
    form.setFieldsValue({ polygon: JSON.stringify({ coordinates: [coords], type: "Polygon" }) });
  };

  useEffect(() => {
    initializeMap();
  }, []);

  const columns = [
    { title: "İsim", dataIndex: "name", key: "name" },
    { title: "İlçe Mernis Kodu", dataIndex: "ilceMernisKodu", key: "ilceMernisKodu" },
    { title: "Durum", dataIndex: "status", key: "status" },
    { title: "Poligon Tipi", dataIndex: "type", key: "type" },
    { title: "Yüzde", dataIndex: "percentage", key: "percentage" },
    { title: "Başlangıç Fiyatı", dataIndex: "start_price", key: "start_price" },
    { title: "Dakika Fiyatı", dataIndex: "price", key: "price" },
    {
      title: "İşlem",
      key: "actions",
      render: (_, record) => (
        <>
          <Button type="link" onClick={() => openEditModal(record)}>Düzenle</Button>
          <Button type="link" danger onClick={() => deletePolygon(record._id)}>Sil</Button>
        </>
      ),
    },
  ];

  return (
    <Card title="Poligon Yönetimi">
      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => setModalVisible(true)}>
        Yeni Poligon Ekle
      </Button>
      <div id="map" style={{ height: 400, marginBottom: 16 }}></div>
      <Table columns={columns} dataSource={geofences} rowKey="_id" loading={loading} />

      <Modal
        title={editingPolygon ? "Poligon Düzenle" : "Yeni Poligon Ekle"}
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingPolygon(null);
          clearDrawnItems();
        }}
        onOk={() => form.submit()}
        okText="Kaydet"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Poligon Adı" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="ilceMernisKodu" label="İlçe Mernis Kodu" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Poligon Tipi" rules={[{ required: true }]}>
            <Select>
              <Option value="DENY">DENY</Option>
              <Option value="ALLOW">ALLOW</Option>
              <Option value="SCORE">SCORE</Option>
              <Option value="STATION">STATION</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="Poligon Durumu" rules={[{ required: true }]}>
            <Select>
              <Option value="ACTIVE">Aktif</Option>
              <Option value="PASSIVE">Pasif</Option>
            </Select>
          </Form.Item>
          <Form.Item name="polygon" label="Poligon Koordinatları (JSON)" rules={[{ required: true }]}>
            <Input.TextArea rows={4} placeholder='[[lng, lat],[lng, lat],...]' />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Polygons;
