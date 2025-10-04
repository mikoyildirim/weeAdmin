import React, { useEffect, useState } from "react";
import {
  Space,
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
import { BarChartOutlined, FileExcelOutlined, SearchOutlined } from "@ant-design/icons";
import axios from "../../api/axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/exportToExcel";
import formatTL from "../../utils/formatTL";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

dayjs.locale("tr");
const { RangePicker } = DatePicker;

const RentalsReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]);
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [paginationSize, setPaginationSize] = useState("medium");
  const [isMobile, setIsMobile] = useState(false);

  const user = useSelector((state) => state.user.user);
  const locations = user?.permissions?.locations || [];

  const totalRentals = filteredData.reduce((acc, item) => acc + Number(item.total), 0);
  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Kiralama Raporu.xlsx`;

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
    setCities(locations);
    setSelectedCities(locations);
  }, [locations]);

  useEffect(() => {
    if (selectedCities.length > 0) fetchData();
  }, [selectedCities, dates]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "rentals/find/dayDayByCityAndDate/withCityFilter",
        {
          startDate: dates[0].format("YYYY-MM-DD"),
          endDate: dates[1].format("YYYY-MM-DD"),
          cities: selectedCities.length ? selectedCities : locations,
        }
      );
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
    const filtered = data.filter(
      (item) =>
        item.city?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.date?.toLowerCase().includes(searchText.toLowerCase()) ||
        String(item.total).includes(searchText)
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  // Chart data
  const chartData = [];
  const datesSet = Array.from(new Set(filteredData.map((item) => item.date)));
  const citiesSet = Array.from(new Set(filteredData.map((item) => item.city)));
  datesSet.forEach((date) => {
    const entry = { date };
    citiesSet.forEach((city) => {
      const found = filteredData.find((item) => item.date === date && item.city === city);
      entry[city] = found ? Number(found.total) : 0;
    });
    chartData.push(entry);
  });

  const columns = [
    { title: "Tarih", dataIndex: "date", sorter: (a, b) => new Date(a.date) - new Date(b.date), align: "center" },
    { title: "Toplam", dataIndex: "total", sorter: (a, b) => a.total - b.total, align: "center", render: (val) => formatTL(val) },
    { title: "Şehir", dataIndex: "city", sorter: (a, b) => a.city.localeCompare(b.city), align: "center" },
  ];

  return (
    <div>
      {/* Toplam Kart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card style={{ background: "#597ef7", color: "#fff", textAlign: "center" }}>
            <BarChartOutlined style={{ fontSize: 36, marginBottom: 8 }} />
            <p style={{ fontSize: 28, margin: 0, fontWeight: "bold" }}>{formatTL(totalRentals)}</p>
            <span>Toplam Kiralama</span>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          {/* Filtre Card */}
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
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
              <Col xs={24} md={12}>
                <label>Şehir</label>
                <Select
                  mode="multiple"
                  allowClear
                  style={{ width: "100%" }}
                  placeholder="Şehir seçiniz"
                  value={selectedCities}
                  onChange={setSelectedCities}
                  options={cities.map((c) => ({ label: c, value: c }))}
                />
              </Col>
            </Row>
            <Row style={{ marginTop: 12 }}>
              <Col span={24} style={{ textAlign: "right" }}>
                <Button type="primary" onClick={fetchData}>Filtrele</Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Chart Card */}
      <Card title="Gün Bazlı Şehir Kiralama" style={{ marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => [formatTL(value), ""]} />
            <Legend />
            {citiesSet.map((city, index) => (
              <Bar key={city} dataKey={city} name={city} fill={`hsl(${(index * 70) % 360},70%,50%)`} barSize={20} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Arama & Excel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 12, marginTop: 16 }} align="middle" justify="space-between">
        <Col xs={24} md={12}>
          <Input prefix={<SearchOutlined />} placeholder="Ara..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </Col>
        <Col xs={24} md={12} style={{ textAlign: "right" }}>
          <Button type="primary" icon={<FileExcelOutlined />} onClick={() => exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        </Col>
      </Row>

      {/* Tablo */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ position: ["bottomCenter"], pageSizeOptions: ["10", "20", "50"], size: paginationSize }}
          rowKey={(record) => `${record.date}-${record.city}`}
        />
      </Card>
    </div>
  );
};

export default RentalsReport;
