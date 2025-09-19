import React, { useEffect, useState } from "react";
import { Space, Table, DatePicker, Button, Select, Input, message, Card, ConfigProvider, Col, Row } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/exportToExcel";
import exportToPDF from "../../utils/exportToPDF";
import formatTL from "../../utils/formatTL";

dayjs.locale("tr");

const { RangePicker } = DatePicker;

const WeePuanReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]);
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [paginationSize, setPaginationSize] = useState([]);
  const [searchText, setSearchText] = useState(""); // <-- search için

  const user = useSelector((state) => state.user.user);
  const locations = user?.permissions?.locations || [];

  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Wee Puan Raporu.xlsx`;
  const pdfFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Wee Puan Raporu.pdf`;

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  useEffect(() => {
    fetchCities();
    fetchData();
  }, []);


  useEffect(() => {
    fetchData();
  }, [selectedCities, dates]);

  const fetchCities = async () => {
    try {
      let cityList = locations;
      setCities(cityList);
      if (locations) {
        const defaultCities = Array.isArray(locations) ? locations : [locations];
        const validCities = defaultCities.filter(city => cityList.includes(city));
        setSelectedCities(validCities);
      }
    } catch (err) {
      message.error("Şehirler alınamadı!");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post("transactions/find/totalTransactions", {
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
        cities: selectedCities,
      });
      setData(response.data || []);
      setFilteredData(response.data || []); // <-- initial filteredData
    } catch (error) {
      message.error("Veri alınırken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  // Search işlemi
  useEffect(() => {
    if (!searchText) {
      setFilteredData(data);
      return;
    }
    const filtered = data.filter((item) => {
      return (
        item.city?.toLowerCase().includes(searchText.toLowerCase()) ||
        item.date?.toLowerCase().includes(searchText.toLowerCase()) ||
        String(item.total).includes(searchText)
      );
    });
    setFilteredData(filtered);
  }, [searchText, data]);

  const columns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      sortDirections: ["ascend", "descend"],
      defaultSortOrder: "ascend",
      align: "center",
      onHeaderCell: () => ({ style: { minWidth: "120px" } }),
      onCell: () => ({ style: { minWidth: "120px" } }),
    },
    {
      title: "Sehir",
      dataIndex: "city",
      key: "city",
      sorter: (a, b) => a.city.localeCompare(b.city),
      sortDirections: ["ascend", "descend"],
      align: "center",
    },
    {
      title: "Toplam WeePuan",
      dataIndex: "total",
      key: "totalTL",
      sorter: (a, b) => a.total - b.total,
      sortDirections: ["ascend", "descend"],
      align: "center",
      render: (value) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value) + " Wee Puan",
    },
    {
      title: "TL Karşılığı",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total - b.total,
      sortDirections: ["ascend", "descend"],
      align: "center",
      render: (value) => {
        const tlValue = value / 10;
        const formatted = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(tlValue);
        return formatted.replace("₺", "").trim() + " ₺";
      },
    },
  ];

  return (
    <Card title="Wee Puan Raporları" variant="outlined">
      <Row gutter={[16, 16]}>
        {/* Tarih Aralığı */}
        <Col xs={24} sm={24} md={24} lg={8}>
          <ConfigProvider locale={trTR}>
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
              <label style={{ marginBottom: 4 }}>Tarih Aralığı</label>
              {isMobile ? (
                <Space direction="vertical" size={12}>
                  <DatePicker value={dates[0]} onChange={(val) => setDates(prev => [val, ...prev.slice(0)])} style={{ width: "100%" }} />
                  <DatePicker value={dates[1]} onChange={(val) => setDates(prev => [...prev.slice(0, 1), val, ...prev.slice(2)])} style={{ width: "100%" }} />
                </Space>
              ) : (
                <RangePicker value={dates} onChange={(val) => setDates(val)} format="YYYY-MM-DD" style={{ width: "100%" }} />
              )}
            </div>
          </ConfigProvider>
        </Col>

        {/* Şehir Seçiniz */}
        <Col xs={24} sm={24} md={24} lg={8}>
          <div style={{ display: "flex", flexDirection: "column", marginBottom: 16 }}>
            <label style={{ marginBottom: 4 }}>Şehir Seçiniz</label>
            <Select
              mode="multiple"
              style={{ minWidth: 200 }}
              placeholder="Şehir seçiniz"
              value={selectedCities}
              onChange={(val) => setSelectedCities(val)}
              options={cities.map((c) => ({ label: c, value: c }))}
            />
          </div>
        </Col>

        {/* Filtrele Butonu */}
        <Col xs={24} sm={24} md={24} lg={8} style={{ display: "flex", alignItems: "flex-end", marginBottom: 16 }}>
          <Button type="primary" onClick={fetchData} style={{ width: "100%" }}>Filtrele</Button>
        </Col>
      </Row>

      {/* Search Input */}
      <Input
        placeholder="Ara..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16, maxWidth: 300 }}
      />

      <Space style={{ marginBottom: 16, margin: "0 8px" }}>
        <Button onClick={() => exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        <Button onClick={() => exportToPDF(columns, sortedData, pdfFileName)}>PDF İndir</Button>
      </Space>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          position: ["bottomCenter"],
          pageSizeOptions: ["5", "10", "20", "50"],
          size: paginationSize,
        }}
        rowKey={(record) => `${record.date}-${record.city}-${record.total}-${record.city}`}
      />
    </Card>
  );
};

export default WeePuanReport;
