// src/pages/Maps/Polygons.js
import React, { useEffect, useState } from "react";
import { Table, Button, Modal, message, Card, Col, Row, Input } from "antd";
import axios from "../../../api/axios";

import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { Link } from "react-router-dom";

const Polygons = () => {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);;
  const [filteredGeofences, setFilteredGeofences] = useState([]);
  const [searchText, setSearchText] = useState(""); // <-- search state
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
    {
      title: "İsim", dataIndex: "name", key: "name",
      onCell: () => ({
        style: {
          maxWidth: "200px",
          whiteSpace: "normal",      // satır kırılmasını sağlar
          wordBreak: "break-word",   // uzun kelimeleri aşağı kırar
        }
      }),
    },
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
          <Button type="link" >
            <Link to={`/panel/maps/polygons/updatepolygon/${record._id}`}>
              Düzenle
            </Link>
          </Button>
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
    <Card>
      <h1>Poligon Yönetimi</h1>
      <Row style={{ marginBottom: 16, width: '100%', display: "flex", justifyContent: "space-between", gap: "16px" }}>
        <Button type="primary" style={{ width: isMobile && "100%" }}>
          <Link to={`/panel/maps/polygons/createpolygon`}>
            Yeni Poligon Ekle
          </Link>
        </Button>
        <Input
          placeholder="Ara..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: isMobile ? "100%" : "200px" }} // istersen genişliği full yapabilirsin
        />
      </Row>

      <Table
        columns={isMobile ? [columns[0], columns[columns.length - 1]] : columns}
        dataSource={filteredGeofences}
        rowKey="_id"
        loading={loading}
        expandable={isMobile ? {
          expandedRowRender: (record) => (
            <div style={{ fontSize: 13 }}>
              <p><b>İlçe Mernis Kodu:</b> {record.ilceMernisKodu}</p>
              <p><b>Durum:</b> {record.status}</p>
              <p><b>Poligon Tipi:</b> {record.type}</p>
              <p><b>Yüzde:</b> {record.percentage}</p>
              <p><b>Başlangıç Fiyatı:</b> {record.start_price}</p>
              <p><b>Dakika Fiyatı:</b> {record.price}</p>
            </div>
          ), expandRowByClick: true
        } : undefined}
      />


    </Card>
  );
};

export default Polygons;
