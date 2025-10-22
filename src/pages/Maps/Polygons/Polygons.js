// src/pages/Maps/Polygons.js
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, message, Card, Col, Row, Input } from "antd";
import axios from "../../../api/axios";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";

const Polygons = () => {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);;
  const [filteredGeofences, setFilteredGeofences] = useState([]);
  const [searchText, setSearchText] = useState(""); // <-- search state

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


  useEffect(() => {
    if (!searchText) {
      setFilteredGeofences(geofences);
      return;
    }

    const lowerSearch = searchText.toLowerCase();
    const filtered = geofences.filter((item) =>
      item.name?.toLowerCase().includes(lowerSearch) ||
      item.ilceMernisKodu?.toString().includes(lowerSearch) ||
      item.status?.toLowerCase().includes(lowerSearch) ||
      item.type?.toLowerCase().includes(lowerSearch)
    );
    setFilteredGeofences(filtered);
  }, [searchText, geofences]);



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



  const showModal = (id) => {
    setSelectedId(id);
    setIsModalOpen(true);
  };

  const handleOk = () => {
    if (selectedId) {
      deletePolygon(selectedId);
    }
    setIsModalOpen(false);
    setSelectedId(null);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedId(null);
  };

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
          <Button type="link" href={`/panel/maps/polygons/updatepolygon/${record._id}`}>Düzenle</Button>
          <>
            <Button type="link" danger onClick={() => showModal(record._id)}>
              Sil
            </Button>

            <Modal
              title="Emin misiniz?"
              open={isModalOpen}
              onOk={handleOk}
              onCancel={handleCancel}
              okText="Evet"
              cancelText="Hayır"
              okButtonProps={{ danger: true }}
            >
              Bu işlemi geri alamazsınız.
            </Modal>
          </>

        </>
      ),
    },
  ];

  return (
    <Card title="Poligon Yönetimi">
      <Row style={{ marginBottom: 16, width: '100%', display: "flex", justifyContent: "space-between" }}>
        <Button type="primary" href={`/panel/maps/polygons/createpolygon`}>
          Yeni Poligon Ekle
        </Button>
        <Input
          placeholder="Ara..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: "200px" }} // istersen genişliği full yapabilirsin
        />
      </Row>

      <Table
        columns={columns}
        dataSource={filteredGeofences}
        rowKey="_id"
        loading={loading}
      />
    </Card>
  );
};

export default Polygons;
