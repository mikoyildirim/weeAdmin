import React, { useEffect, useState } from "react";
import {
  Table,
  DatePicker,
  Button,
  Select,
  Input,
  message,
  Card,
  ConfigProvider,
  Col,
  Row,
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/methods/exportToExcel";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "../../utils/styles/rangePickerMobile.css"

dayjs.locale("tr");
const { RangePicker } = DatePicker;

const StaffReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]);
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [paginationSize, setPaginationSize] = useState("medium");
  const [isMobile, setIsMobile] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const locations = user?.permissions?.locations || [];
  const sortedData = [...filteredData].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Batarya Raporu.xlsx`;

  const totalChanges = filteredData.length;
  const avgNewBattery = filteredData.length > 0 ? (filteredData.reduce((acc, item) => acc + item.newBattery, 0) / filteredData.length).toFixed(1) : 0;

  // Mobile check
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  useEffect(() => {
    if (locations.length > 0) {
      setCities(locations);
      setSelectedCities(locations);
    }
  }, [locations]);

  useEffect(() => {
    if (selectedCities.length > 0) fetchData();
  }, [selectedCities, dates]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post("staffrecords/findStaffRecordByCityAndDate", {
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
        cities: selectedCities,
      });
      setData(response.data || []);
      setFilteredData(response.data || []);
    } catch {
      message.error("Veri alınırken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  // Search
  useEffect(() => {
    if (!searchText) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter((item) =>
      item.device?.qrlabel?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
      item.city?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.oldBattery?.toString().includes(searchText) ||
      item.newBattery?.toString().includes(searchText) ||
      dayjs(item.created_date).format("YYYY-MM-DD").includes(searchText)
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  // Chart data
  const chartData = Object.values(
    filteredData.reduce((acc, item) => {
      const dateKey = dayjs(item.created_date).format("YYYY-MM-DD");
      if (!acc[dateKey]) acc[dateKey] = { date: dateKey, total: 0, count: 0 };
      acc[dateKey].total += item.newBattery;
      acc[dateKey].count += 1;
      return acc;
    }, {})
  ).map((entry) => ({ date: entry.date, avgBattery: (entry.total / entry.count).toFixed(1) }));

  const columns = [
    { title: "Değiştirilme Tarihi", dataIndex: "created_date", key: "created_date", sorter: (a, b) => new Date(a.created_date) - new Date(b.created_date), render: (val) => dayjs(val).format("YYYY-MM-DD"), align: "center" },
    { title: "Cihaz QR", dataIndex: ["device", "qrlabel"], key: "qrlabel", align: "center" },
    { title: "Eski Batarya", dataIndex: "oldBattery", key: "oldBattery", align: "center", render: (val) => `${val} %` },
    { title: "Yeni Batarya", dataIndex: "newBattery", key: "newBattery", align: "center", render: (val) => `${val} %` },
    { title: "Şehir", dataIndex: "city", key: "city", align: "center" },
  ];

  return (
    <div>
      <h1>Batarya Değişim Raporu</h1>
      {/* Üst Kartlar */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card style={{ textAlign: "center", background: "#fafafa" }}>
            <p style={{ fontSize: 28, margin: 0, fontWeight: "bold" }}>{totalChanges}</p>
            <span>Toplam Batarya Değişimi</span>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={{ textAlign: "center", background: "#fafafa" }}>
            <p style={{ fontSize: 28, margin: 0, fontWeight: "bold" }}>{avgNewBattery} %</p>
            <span>Ortalama Yeni Batarya</span>
          </Card>
        </Col>
      </Row>

      {/* Filtre Card */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <label>Tarih Aralığı</label>
            <ConfigProvider locale={trTR}>
              <RangePicker
                value={dates}
                onChange={(val) => setDates(val || [dayjs().subtract(1, "day"), dayjs()])}
                format="YYYY-MM-DD"
                style={{ width: "100%" }}
              />
            </ConfigProvider>
          </Col>
          <Col xs={24} md={8}>
            <label>Şehir Seçiniz</label>
            <Select mode="multiple" value={selectedCities.filter((city) => city !== "BURSA" && city !== "ANTALYA")} onChange={setSelectedCities} style={{ width: "100%" }} options={cities.map((c) => ({ label: c, value: c }))} />
          </Col>
          <Col xs={24} md={8} style={{ display: "flex", alignItems: "flex-end" }}>
            <Button type="primary" onClick={fetchData} style={{ width: "100%" }}>Filtrele</Button>
          </Col>
        </Row>
      </Card>

      {/* Grafik Card */}
      {chartData.length > 0 && (
        <Card title="Ortalama Yeni Batarya (%) Gün Bazlı" style={{ marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avgBattery" stroke="#1890ff" name="Ortalama Yeni Batarya (%)" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Arama ve Excel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={12}>
          <Input placeholder="Ara..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </Col>
        <Col xs={24} md={12} style={{ textAlign: "right" }}>
          <Button type="primary" onClick={() => exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        </Col>
      </Row>

      {/* Tablo */}
      <Card>
        <Table
          columns={isMobile ? columns.slice(0, 2) : columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ position: ["bottomCenter"], pageSizeOptions: ["5", "10", "20", "50"], size: paginationSize }}
          rowKey={(record) => `${record.created_date}-${record.device?.qrlabel}-${record.city}`}
          expandable={isMobile ? {
            expandedRowRender: (record) => (
              <div style={{ fontSize: 13 }}>
                <p><b>Cihaz QR:</b> {record.device?.qrlabel}</p>
                <p><b>Eski Batarya:</b> {record.oldBattery} %</p>
                <p><b>Yeni Batarya:</b> {record.newBattery} %</p>
                <p><b>Şehir:</b> {record.city}</p>
              </div>
            ), expandRowByClick: true
          } : undefined}
        />
      </Card>
    </div>
  );
};

export default StaffReport;
