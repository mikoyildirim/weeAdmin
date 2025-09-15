// src/pages/CallList.js
import React, { useEffect, useState } from "react";
import { Table, Typography, Spin } from "antd";
import axios from "../api/axios";

const { Title } = Typography;

const CallList = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tarihi dmYHi formatına çevirme fonksiyonu
  const formatDateDMYHi = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0"); // Ay 0'dan başlar
    const Y = date.getFullYear();
    const H = String(date.getHours()).padStart(2, "0");
    const i = String(date.getMinutes()).padStart(2, "0");
    return `${d}${m}${Y}${H}${i}`;
  };

  // API çağrısı
  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startDate = formatDateDMYHi(today);
        const endDate = formatDateDMYHi(today);

        const payload = {
          startdate: startDate,
          stopdate: endDate,
          querytype: 2,
          output: "json",
        };

        console.log("📤 Gönderilen payload:", payload);

        const response = await axios.post("/calls/list", payload);
        console.log("📥 Response:", response.data);

        const callData = response.data.values || [];
        setCalls(callData);
      } catch (error) {
        console.error("❌ Çağrılar alınamadı:", error.response || error);
        if (!error.response) {
          console.error("Network veya CORS hatası olabilir");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  // Tablo kolonları
  const columns = [
    {
      title: "Arayan Numara",
      dataIndex: "source",
      key: "source",
    },
    {
      title: "Arama Tarihi",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Süre (sn)",
      dataIndex: "duration",
      key: "duration",
    },
    {
      title: "Ses Kaydı",
      key: "recording",
      render: (_, record) =>
        record.recording ? <audio controls src={record.recording} /> : "Yok",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Kullanıcı Çağrıları</Title>

      {loading ? (
        <div style={{ textAlign: "center", padding: 50 }}>
          <Spin size="large" />
        </div>
      ) : (
        <Table
          dataSource={calls.map((c, i) => ({ ...c, key: i }))}
          columns={columns}
          bordered
          pagination={{ pageSize: 10 }}
        />
      )}
    </div>
  );
};

export default CallList;
