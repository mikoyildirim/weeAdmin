import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, message } from "antd";
import axios from "../api/axios";

const { Title } = Typography;

const CallList = () => {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(false);

  const formatDateDMYHi = (date) => {
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const Y = date.getFullYear();
    const H = String(date.getHours()).padStart(2, "0");
    const i = String(date.getMinutes()).padStart(2, "0");
    return `${d}${m}${Y}${H}${i}`;
  };

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      try {
       const today = new Date();
const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0);
const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 0, 0);

const startDate = formatDateDMYHi(startOfDay);
const stopDate = formatDateDMYHi(endOfDay);

const payload = new URLSearchParams();
payload.append("startdate", startDate);
payload.append("stopdate", stopDate);
payload.append("querytype", 2);
payload.append("output", "json");

const response = await axios.post("/calls/list", payload, {
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

        console.log("📥 Response:", response.data);

        const callData = response.data || [];
        const callArray = Array.isArray(callData)
          ? callData
          : Object.values(callData);

        // Her call için values[0] kullan
        const formattedCalls = callArray.map((call) => call.values?.[0] || {});

        setCalls(formattedCalls);
      } catch (error) {
        console.error("❌ Çağrılar alınamadı:", error.response || error);
        message.error("Çağrı listesi alınamadı!");
      } finally {
        setLoading(false);
      }
    };

    fetchCalls();
  }, []);

  const columns = [
    { title: "Arayan Numara", dataIndex: "source", key: "source" },
    { title: "Arama Tarihi", dataIndex: "date", key: "date" },
    { title: "Süre (sn)", dataIndex: "duration", key: "duration" },
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
