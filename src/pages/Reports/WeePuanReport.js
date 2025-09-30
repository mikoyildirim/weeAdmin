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
import axios from "../../api/axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/exportToExcel";

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
  const [searchText, setSearchText] = useState("");

  const [isMobile, setIsMobile] = useState(false);

  const user = useSelector((state) => state.user.user);
  const locations = user?.permissions?.locations || [];

  // toplamlar
  const totalWeePuan = filteredData.reduce(
    (acc, item) => acc + Number(item.total),
    0
  );
  const totalTL = totalWeePuan / 10;

  const sortedData = [...filteredData].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );
  const excelFileName = `${dates[0].format(
    "YYYY-MM-DD"
  )}_${dates[1].format("YYYY-MM-DD")} Wee Puan Raporu.xlsx`;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  // sayfa açılışında şehirleri getir ve hepsini seç
  useEffect(() => {
    if (locations.length > 0) {
      setCities(locations);
      setSelectedCities(locations); // ✅ artık hepsi seçili olacak
    }
  }, [locations]);

  useEffect(() => {
    if (selectedCities.length > 0) {
      fetchData();
    }
  }, [selectedCities, dates]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "transactions/find/totalTransactions",
        {
          startDate: dates[0].format("YYYY-MM-DD"),
          endDate: dates[1].format("YYYY-MM-DD"),
          cities: selectedCities.length > 0 ? selectedCities : locations,
        }
      );
      setData(response.data || []);
      setFilteredData(response.data || []);
    } catch (error) {
      message.error("Veri alınırken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  // 🔍 Search işlemi
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
    },
    {
      title: "Şehir",
      dataIndex: "city",
      key: "city",
      sorter: (a, b) => a.city.localeCompare(b.city),
      sortDirections: ["ascend", "descend"],
      align: "center",
    },
    {
      title: "Toplam WeePuan",
      dataIndex: "total",
      key: "totalWeePuan",
      sorter: (a, b) => a.total - b.total,
      sortDirections: ["ascend", "descend"],
      align: "center",
      render: (value) =>
        new Intl.NumberFormat("tr-TR", {
          maximumFractionDigits: 2,
        }).format(value) + " WEEPUAN",
    },
    {
      title: "TL Karşılığı",
      dataIndex: "total",
      key: "totalTL",
      sorter: (a, b) => a.total - b.total,
      sortDirections: ["ascend", "descend"],
      align: "center",
      render: (value) => {
        const tlValue = value / 10;
        return (
          new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
            minimumFractionDigits: 2,
          })
            .format(tlValue)
            .replace("₺", "")
            .trim() + " ₺"
        );
      },
    },
  ];

  return (
    <Card title="Wee Puan Raporları" variant="outlined">
      <Row gutter={[16, 16]}>
        {/* Tarih Aralığı */}
        <Col xs={24} md={8}>
          <ConfigProvider locale={trTR}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={{ marginBottom: 4 }}>Tarih Aralığı</label>
              {isMobile ? (
                <Space direction="vertical" size={12}>
                  <DatePicker
                    value={dates[0]}
                    onChange={(val) =>
                      setDates((prev) => [val || prev[0], prev[1]])
                    }
                    style={{ width: "100%" }}
                  />
                  <DatePicker
                    value={dates[1]}
                    onChange={(val) =>
                      setDates((prev) => [prev[0], val || prev[1]])
                    }
                    style={{ width: "100%" }}
                  />
                </Space>
              ) : (
                <RangePicker
                  value={dates}
                  onChange={(val) =>
                    setDates(val || [dayjs().subtract(1, "day"), dayjs()])
                  }
                  format="YYYY-MM-DD"
                  style={{ width: "100%" }}
                />
              )}
            </div>
          </ConfigProvider>
        </Col>

        {/* Şehir Seçiniz */}
        <Col xs={24} md={8}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label style={{ marginBottom: 4 }}>Şehir Seçiniz</label>
            <Select
              mode="multiple"
              allowClear
              style={{ width: "100%" }}
              placeholder="Şehir seçiniz"
              value={selectedCities}
              onChange={setSelectedCities}
              options={cities.map((c) => ({ label: c, value: c }))}
            />
          </div>
        </Col>

        {/* Filtrele Butonu */}
        <Col xs={24} md={8} style={{ display: "flex", alignItems: "flex-end" }}>
          <Button type="primary" onClick={fetchData} style={{ width: "100%" }}>
            Filtrele
          </Button>
        </Col>
      </Row>

      {/* Toplamlar */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card style={{ textAlign: "center" }}>
            <p style={{ fontSize: 24, margin: 0 }}>
              {new Intl.NumberFormat("tr-TR").format(totalWeePuan)} WEEPUAN
            </p>
            <span style={{ fontSize: 16 }}>Toplam WeePuan</span>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={{ textAlign: "center" }}>
            <p style={{ fontSize: 24, margin: 0 }}>
              {new Intl.NumberFormat("tr-TR", {
                style: "currency",
                currency: "TRY",
              })
                .format(totalTL)
                .replace("₺", "")
                .trim()}{" "}
              ₺
            </p>
            <span style={{ fontSize: 16 }}>TL Karşılığı</span>
          </Card>
        </Col>
      </Row>

      {/* Arama & Excel */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={16}>
          <Input
            placeholder="Ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: isMobile ? "100%" : "300px" }}
          />
        </Col>
        <Col xs={24} md={8} style={{ textAlign: "right" }}>
          <Button
            type="primary"
            onClick={() => exportToExcel(sortedData, excelFileName)}
          >
            Excel İndir
          </Button>
        </Col>
      </Row>

      {/* Tablo */}
      <Table
        style={{ marginTop: 16 }}
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={{
          position: ["bottomCenter"],
          pageSizeOptions: ["5", "10", "20", "50"],
          size: paginationSize,
        }}
        rowKey={(record) =>
          `${record.date}-${record.city}-${record.total}-${record.city}`
        }
      />
    </Card>
  );
};

export default WeePuanReport;
