// src/pages/Maps/Polygons.js
import React, { useEffect, useState, useRef } from "react";
import { Table, Button, Modal, Form, Input, Select, message, Card } from "antd";
import axios from "../../../api/axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { ExclamationCircleOutlined } from "@ant-design/icons";

const { confirm } = Modal;

const { Option } = Select;

const Polygons = () => {
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);;


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
          <Button type="link" href={`updatepolygon/${record._id}`}>Düzenle</Button>
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
      <Button type="primary" style={{ marginBottom: 16 }}
        href={`/panel/maps/polygons/createpolygon`}>
        Yeni Poligon Ekle
      </Button>
      <Table columns={columns} dataSource={geofences} rowKey="_id" loading={loading} />
    </Card>
  );
};

export default Polygons;
