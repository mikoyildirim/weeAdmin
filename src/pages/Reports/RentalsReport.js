import React, { useEffect, useState } from "react";
import { Space, Table, DatePicker, Button, Select, Input, message, Card, ConfigProvider, Col, Row } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/exportToExcel";
import formatTL from "../../utils/formatTL";

dayjs.locale("tr");

const { RangePicker } = DatePicker;

const RentalsReport = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]); // <-- search için
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]);
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [paginationSize, setPaginationSize] = useState();
  const [searchText, setSearchText] = useState(""); // <-- search state

  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Kiralama Raporu.xlsx`;
  const totalRentals = filteredData.reduce((acc, item) => acc + Number(item.total), 0);

  const user = useSelector((state) => state.user.user);
  const locations = user?.permissions?.locations || [];

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
    fetchCities();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedCities, dates]);

  const fetchCities = async () => {
    try {
      setCities(locations);
      const validCities = locations.filter(city => locations.includes(city));
      setSelectedCities(validCities);
    } catch (err) {
      message.error("Şehirler alınamadı!");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "rentals/find/dayDayByCityAndDate/withCityFilter",
        {
          startDate: dates[0].format("YYYY-MM-DD"),
          endDate: dates[1].format("YYYY-MM-DD"),
          cities: selectedCities,
        }
      );
      setData(response.data || []);
      setFilteredData(response.data || []); // <-- initial filtered data
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
      onHeaderCell: () => ({ style: { minWidth: "100px" } }),
      onCell: () => ({ style: { minWidth: "100px" } }),
    },
    {
      title: "Toplam",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total - b.total,
      sortDirections: ["ascend", "descend"],
      render: (value) => {
        const formatted = new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
          minimumFractionDigits: 2,
        }).format(value);
        return formatted.replace("₺", "").trim() + " ₺";
      },
      align: "center",
    },
    {
      title: "Sehir",
      dataIndex: "city",
      key: "city",
      sorter: (a, b) => a.city.localeCompare(b.city),
      sortDirections: ["ascend", "descend"],
      align: "center",
    },
  ];

  return (
    <Card title="Kiralama Raporları" variant="outlined">
      <Row gutter={[16, 16]}>
        {/* Filtreleme alanı */}
        <Col xs={24} sm={24} md={24} lg={16}>
          <Row gutter={[8, 8]}>
            {/* Tarih filtresi */}
            <Col xs={24} sm={24} md={24} lg={8}>
              <ConfigProvider locale={trTR}>
                <div style={{ display: "flex", flexDirection: "column" }}>
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

            {/* Şehir filtresi */}
            <Col xs={24} sm={24} md={24} lg={8}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <label style={{ marginBottom: 4 }}>Şehir Seçiniz</label>
                <Select
                  mode="multiple"
                  style={{ width: "100%" }}
                  placeholder="Şehir seçiniz"
                  value={selectedCities}
                  onChange={(val) => setSelectedCities(val)}
                  options={cities.map((c) => ({ label: c, value: c }))}
                />
              </div>
            </Col>

            {/* Filtreleme butonu */}
            <Col xs={24} sm={24} md={24} lg={8}>
              <Button type="primary" onClick={fetchData} style={{ width: "100%", marginTop: 24 }}>
                Filtrele
              </Button>
            </Col>
          </Row>
        </Col>

        {/* Toplam Kiralama Kartı */}
        <Col xs={24} sm={24} md={24} lg={8}>
          <Card>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
            >
              <p style={{ fontSize: 24, margin: 0 }}>{formatTL(totalRentals)}</p>
              <span style={{ fontSize: 20 }}>Toplam Kiralama</span>
            </div>
          </Card>
        </Col>
      </Row>


      <Row gutter={[16, 16]}>
        {/* Search Input */}
        <Col xs={24} sm={24} md={24} lg={8}>
          <Input
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ margin: "16px 0", width: "100%", ...(isMobile ? { marginBottom: "8px" } : { maxWidth: "300px" }), }}
          />
        </Col>

        <Col xs={24} sm={24} md={24} lg={8}>
          <Button
            type="primary"
            style={{
              margin: isMobile ? " 0px 0px 16px 0px " : "16px 8px",
              width: isMobile ? "100%" : "auto",   // mobilde tam genişlik, desktopta otomatik
              maxWidth: isMobile ? "none" : "200px", // desktopta max 200px
            }}
            onClick={() => exportToExcel(sortedData, excelFileName)}
          >
            Excel İndir
          </Button>
        </Col>
      </Row>


      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          position: ["bottomCenter"],
          pageSizeOptions: ["3", "10", "20", "50"],
          size: paginationSize,
        }}
        rowKey={(record) => `${record.date}-${record.city}`}
      />
    </Card >
  );
};

export default RentalsReport;