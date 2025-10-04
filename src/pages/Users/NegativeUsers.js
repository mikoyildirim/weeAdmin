import React, { useEffect, useState } from "react";
import { Table, Card, Row, Col, Statistic, Typography, message } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";

dayjs.locale("tr");
const { Title } = Typography;

const NegativeBalancePage = () => {
  const [negativeBalance, setNegativeBalance] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [overallTotal, setOverallTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // 📌 Eksi bakiye verilerini çek
  const fetchData = async () => {
    setLoading(true);
    console.log("%c[Eksi Bakiye] Veri çekme başladı", "color: orange; font-weight:bold;");

    try {
      const { data } = await axios.get("/wallets/balance/negativeBalance");
      console.log("[API Yanıtı]", data);

      setNegativeBalance(data);
      calculateTotals(data);
    } catch (error) {
      console.error("[Hata] Veri çekilirken sorun:", error);
      message.error("Veriler alınırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 📌 Toplamları hesapla
  const calculateTotals = (data) => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    const currentMonth = dayjs().format("YYYY-MM");

    let todaySum = 0;
    let monthSum = 0;
    let totalSum = 0;

    data.forEach((item) => {
      const balance = parseFloat(String(item.balance).replace(",", "."));
      const itemDate = dayjs(item.dangerDate);

      if (!itemDate.isValid()) {
        console.warn("[Uyarı] Geçersiz tarih:", item.dangerDate);
        return;
      }

      const itemDateStr = itemDate.format("YYYY-MM-DD");
      const itemMonthStr = itemDate.format("YYYY-MM");

      if (itemDateStr === todayStr) {
        todaySum += balance;
      }
      if (itemMonthStr === currentMonth) {
        monthSum += balance;
      }

      totalSum += balance;
    });

    console.log("[Toplamlar] Bugün:", todaySum, "| Bu Ay:", monthSum, "| Genel:", totalSum);

    setTodayTotal(todaySum);
    setMonthlyTotal(monthSum);
    setOverallTotal(totalSum);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: "Tarih",
      dataIndex: "dangerDate",
      align: "center",
      render: (val) => dayjs(val).isValid() ? dayjs(val).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      title: "İsim Soyisim",
      dataIndex: "name",
      align: "center",
    },
    {
      title: "Telefon",
      dataIndex: "gsm",
      align: "center",
      render: (gsm) =>
        gsm ? (
          <a
            href={`/searchmember?gsm=${gsm}`}
            onClick={(e) => {
              e.preventDefault();
              console.log("[GSM Tıklama]", gsm);
              window.location.href = `/searchmember?gsm=${gsm}`;
            }}
          >
            {gsm}
          </a>
        ) : (
          "-"
        ),
    },
    {
      title: "Eksi Bakiye",
      dataIndex: "balance",
      align: "center",
      render: (val) => `${val}₺`,
    },
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Eksi Bakiyedeki Kullanıcılar</Title>

      {/* Kartlar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ background: "linear-gradient(45deg,#1890ff,#40a9ff)", color: "#fff" }}
          >
            <Statistic
              title={<span style={{ color: "#fff" }}>Bugünkü - Bakiye</span>}
              value={todayTotal.toFixed(2)}
              suffix="₺"
              valueStyle={{ color: "#fff" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ background: "linear-gradient(45deg,#52c41a,#73d13d)", color: "#fff" }}
          >
            <Statistic
              title={<span style={{ color: "#fff" }}>Bu Ayki - Bakiye</span>}
              value={monthlyTotal.toFixed(2)}
              suffix="₺"
              valueStyle={{ color: "#fff" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card
            bordered={false}
            style={{ background: "linear-gradient(45deg,#faad14,#ffc53d)", color: "#fff" }}
          >
            <Statistic
              title={<span style={{ color: "#fff" }}>Toplam - Bakiye</span>}
              value={overallTotal.toFixed(2)}
              suffix="₺"
              valueStyle={{ color: "#fff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tablo */}
      <Card>
        <Table
          columns={columns}
          dataSource={negativeBalance}
          rowKey={(record) => record._id || record.gsm}
          loading={loading}
          pagination={{ pageSize: 10 }}
          bordered
          onChange={(pagination, filters, sorter) => {
            console.log("[Tablo Değişti]", { pagination, filters, sorter });
          }}
        />
      </Card>
    </div>
  );
};

export default NegativeBalancePage;
