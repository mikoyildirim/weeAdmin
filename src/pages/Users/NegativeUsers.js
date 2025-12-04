import React, { useEffect, useState } from "react";
import { Table, Card, Row, Col, Statistic, Typography, message, Input } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import { Link } from "react-router-dom";

dayjs.locale("tr");
const { Title } = Typography;
const { Search } = Input;

const NegativeBalancePage = () => {
  const [negativeBalance, setNegativeBalance] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [overallTotal, setOverallTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    console.log("%c[Eksi Bakiye] Veri çekme başladı", "color: orange; font-weight:bold;");

    try {
      const { data } = await axios.get("/wallets/balance/negativeBalance");
      //console.log("[API Yanıtı]", data);

      setNegativeBalance(data);
      setFilteredData(data);
      calculateTotals(data);
    } catch (error) {
      console.error("[Hata] Veri çekilirken sorun:", error);
      message.error("Veriler alınırken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = (data) => {
    const todayStr = dayjs().format("YYYY-MM-DD");
    const currentMonth = dayjs().format("YYYY-MM");

    let todaySum = 0;
    let monthSum = 0;
    let totalSum = 0;

    data.forEach((item) => {
      const balance = parseFloat(String(item.balance).replace(",", "."));
      const itemDate = dayjs(item.dangerDate);

      if (!itemDate.isValid()) return;

      const itemDateStr = itemDate.format("YYYY-MM-DD");
      const itemMonthStr = itemDate.format("YYYY-MM");

      if (itemDateStr === todayStr) todaySum += balance;
      if (itemMonthStr === currentMonth) monthSum += balance;

      totalSum += balance;
    });

    setTodayTotal(todaySum);
    setMonthlyTotal(monthSum);
    setOverallTotal(totalSum);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredData(negativeBalance);
      return;
    }

    const filtered = negativeBalance.filter((item) => {
      return (
        (item.name?.toLowerCase().includes(value.toLowerCase()) || false) ||
        (item.gsm?.toLowerCase().includes(value.toLowerCase()) || false)
      );
    });
    setFilteredData(filtered);
  };

  const columns = [
    {
      title: "Tarih",
      dataIndex: "dangerDate",
      align: "center",
      render: (val) => (dayjs(val).isValid() ? dayjs(val).format("YYYY-MM-DD HH:mm") : "-"),
      sorter: (a, b) => dayjs(a.dangerDate).unix() - dayjs(b.dangerDate).unix(),
    },
    {
      title: "İsim Soyisim",
      dataIndex: "name",
      align: "center",
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
    },
    {
      title: "Telefon",
      dataIndex: "gsm",
      align: "center",
      render: (gsm) =>
        gsm ? (
          <Link to={`/panel/users?gsm=${encodeURIComponent(gsm)}`}>{gsm}</Link>
        ) : (
          "-"
        ),
      sorter: (a, b) => (a.gsm || "").localeCompare(b.gsm || ""),
    },
    {
      title: "Eksi Bakiye",
      dataIndex: "balance",
      align: "center",
      render: (val) => `${val}₺`,
      sorter: (a, b) => Math.abs(Number(a.balance.replace(",",".")) || 0) - Math.abs(Number(b.balance.replace(",",".")) || 0),
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

      {/* Search */}
      <Row style={{ marginBottom: 10 }} justify="end">
        <Col xs={24} md={6}>
          <Search
            placeholder="Ara..."
            allowClear
            enterButton
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            onSearch={handleSearch}
          />
        </Col>
      </Row>

      {/* Tablo */}
      <Table
        columns={isMobile ? columns.filter((_, index) => index !== 2) : columns}
        dataSource={filteredData}
        rowKey={(record) => record._id || record.gsm}
        loading={loading}
        pagination={{ pageSize: 10 }}
        bordered
        expandable={isMobile ? {
          expandedRowRender: (record) => (
            <div style={{ fontSize: 13 }}>
              <p><b>Tel: </b> {record.gsm ? (
                <Link to={`/panel/users?gsm=${encodeURIComponent(record.gsm)}`}>{record.gsm}</Link>
              ) : (
                "-"
              )
              }
              </p>
            </div>
          ),
          expandRowByClick: true
        } : undefined}
      />
    </div>
  );
};

export default NegativeBalancePage;
