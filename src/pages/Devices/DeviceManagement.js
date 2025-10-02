import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message, Card, Input, Space } from "antd";
import axios from "../../api/axios"; // kendi axios instance yolunu kullan

const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/devices"); // API endpoint
      setDevices(res.data || []);
      setFilteredDevices(res.data || []);
    } catch (err) {
      message.error("Cihazlar yüklenirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Anlık filtreleme
  useEffect(() => {
    const filtered = devices.filter((d) => {
      const text = `${d.qrlabel} ${d.imei} ${d.serial_number} ${d.gsm} ${d.city} ${d.town}`.toLowerCase();
      return text.includes(searchText.toLowerCase());
    });
    setFilteredDevices(filtered);
  }, [searchText, devices]);

  const renderDangerStatus = (type) => {
    switch (type) {
      case "SAFE":
        return <Tag color="green">GÜVENDE</Tag>;
      case "UNKNOWN":
        return <Tag color="blue">BİLİNMİYOR</Tag>;
      case "ILLEGAL_MOVE":
        return <Tag color="black">YASADIŞI HAREKET</Tag>;
      case "FALLING_DOWN":
        return <Tag color="orange">DÜŞÜRÜLDÜ</Tag>;
      case "ILLEGAL_REMOVED":
        return <Tag color="red">PARÇA SÖKME</Tag>;
      case "LOW_POWER":
        return <Tag color="orange">DÜŞÜK PİL GÜCÜ</Tag>;
      case "LIFTED_UP":
        return <Tag color="purple">KALDIRILDI</Tag>;
      case "ILLEGAL_DEMOLITION":
        return <Tag color="red">PARÇA KIRMA</Tag>;
      default:
        return <Tag color="default">BİLİNMİYOR</Tag>;
    }
  };

  const columns = [
    {
      title: "QR Label",
      dataIndex: "qrlabel",
      key: "qrlabel",
      render: (_, record) => (
        <Button type="link" href={`/panel/devices/update/${record?._id}`}>
          {record?.qrlabel}
        </Button>
      ),
    },
    { title: "IMEI", dataIndex: "imei", key: "imei" },
    { title: "Seri No", dataIndex: "serial_number", key: "serial_number" },
    { title: "Key Secret", dataIndex: "key_secret", key: "key_secret" },
    { title: "GSM", dataIndex: "gsm", key: "gsm" },
    { title: "Batarya (%)", dataIndex: "battery", key: "battery" },
    {
      title: "Şehir/İlçe",
      key: "location",
      render: (_, record) => (
        <>
          {record.city}/{record.town}
          <br />
          <Tag color="blue">{record?.priceObject?.name || "Yok"}</Tag>
        </>
      ),
    },
    { title: "Durum", dataIndex: "status", key: "status" },
    {
      title: "Son Görülme",
      dataIndex: "last_seen",
      key: "last_seen",
      render: (val) => (val ? new Date(val).toLocaleString() : ""),
    },
    {
      title: "Tehlike Durumu",
      key: "danger",
      render: (_, record) => renderDangerStatus(record?.danger?.type),
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          target="_blank"
          href={`https://www.google.com/maps/dir/?api=1&destination=${
            record?.last_location?.location?.coordinates[1] || 0
          },${record?.last_location?.location?.coordinates[0] || 0}&travelmode=driving`}
        >
          Konuma Git
        </Button>
      ),
    },
  ];

  return (
    <Card title="Tüm Cihazlar">
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" href="create">
          Cihaz Oluştur
        </Button>
        <Input
          placeholder="Cihaz ara..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
      </Space>

      <Table
        columns={columns}
        dataSource={filteredDevices}
        loading={loading}
        rowKey={(record) => record._id}
        scroll={{ x: true }}
      />
    </Card>
  );
};

export default DevicesPage;
