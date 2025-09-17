import React, { useEffect, useState } from "react";
import { Space, Table, DatePicker, Button, Select, message, Card, ConfigProvider, Col, Row, Pagination } from "antd";
import axios from "../../api/axios"; // senin axios instance
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import trTR from "antd/es/locale/tr_TR"; // Türkçe locale
import "dayjs/locale/tr"; // dayjs için Türkçe locale
import exportToExcel from "../../utils/exportToExcel"
import exportToPDF from "../../utils/exportToPDF"
import formatTL from "../../utils/formatTL"

dayjs.locale("tr"); // dayjs'i Türkçe yap

const { RangePicker } = DatePicker;


const PageName = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]); // ilk açılışta bugünün tarihi
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [paginationSize, setPaginationSize] = useState([]);



  const user = useSelector((state) => state.user.user);
  //const userName = user?.name || user?.username || "Admin";
  const locations = user?.permissions?.locations || [];
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Wee Puan Raporu.xlsx`
  const pdfFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Wee Puan Raporu.pdf`


  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // 768px altı mobil
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);


  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium")
    console.log(isMobile,)
  }, [isMobile])



  useEffect(() => {
    fetchCities();
    fetchData() // sayfayı açar açmaz kullanıcının erişim izni olan şehirlere ait kiralama raporunu ekrana basması için eklendi
  }, []);

  // cities geldiğinde ilk veriyi çek
  useEffect(() => {
    if (cities.length > 0) {
      fetchData();
    }
  }, [cities]);

  const fetchCities = async () => {
    try {
      let cityList = locations;
      setCities(cityList);
      if (locations) {
        const defaultCities = Array.isArray(locations) ? locations : [locations];
        // sadece backend veya mock'tan gelen şehirler içinde olanları seç
        const validCities = defaultCities.filter(city => cityList.includes(city));
        console.log(validCities)
        setSelectedCities(validCities);
      }

      setSelectedCities(selectedCities => [...selectedCities])

    } catch (err) {
      message.error("Şehirler alınamadı!");
    }
  };

  const fetchData = async () => {
    setLoading(true);

    try {
      const response = await axios.post(
        "transactions/find/totalTransactions",
        {
          startDate: dates[0].format("YYYY-MM-DD"),
          endDate: dates[1].format("YYYY-MM-DD"),
          cities: selectedCities,
        }
      );
      setData(response.data || []);
      console.log(selectedCities)
      // console.log(`startDate: ${dates[0].format("YYYY-MM-DD")} \n endDate: ${dates[1].format("YYYY-MM-DD")} \n cities: ${typeof(selectedCities)}`)
      console.log(response)
    } catch (error) {
      message.error("Veri alınırken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };



  const columns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      defaultSortOrder: "ascend",
      align: "center",
    },
    {
      title: "Sehir",
      dataIndex: "city",
      key: "city",
      sorter: (a, b) => a.city.localeCompare(b.city), // alfabetik sıralama
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      align: "center",
    },
    {
      title: "Toplam WeePuan",
      dataIndex: "total",
      key: "totalTL",
      sorter: (a, b) => a.total - b.total, // sayısal sıralama
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      align: "center",
      render: (value) => {
        const formatted = new Intl.NumberFormat("tr-TR", {
          maximumFractionDigits: 2,
        }).format(value);
        return formatted+" Wee Puan"; // Örn: "132,50" veya "1.234,50"
      }

    },
    {
      title: "TL Karşılığı",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total - b.total, // sayısal sıralama
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      align: "center",
      render: (value) => {
        const tlValue = value / 10
        const formatted = new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
          minimumFractionDigits: 2,
        }).format(tlValue);
        // ₺ işareti baştaysa, sona taşı
        return formatted.replace("₺", "").trim() + " ₺"; // direkt yukarı yazılırsa ₺ işareti başta oluyor okunuş zor oluyor bu metod ile ₺ işareti miktarın sonuna alındı
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
                // HTML5 mobil tarih inputları
                <Space direction="vertical" size={12} xs={24} sm={24} md={24}>
                  <DatePicker value={dates[0]} onChange={(val) => setDates(prev => [val, ...prev.slice(0)])} xs={24} sm={24} md={24} style={{ width: "100%", margin: "8px 0" }} renderExtraFooter={() => 'Başlangıç tarihi'} />
                  <DatePicker value={dates[1]} onChange={(val) => setDates(prev => [...prev.slice(0, 1), val, ...prev.slice(2)])} xs={24} sm={24} md={24} style={{ width: "100%", margin: "8px 0" }} renderExtraFooter={() => 'Bitiş tarihi'} />
                </Space>

              ) : (
                // Normal AntD RangePicker
                <RangePicker
                  value={dates}
                  onChange={(val) => setDates(val)}
                  format="YYYY-MM-DD"
                  style={{ width: "100%" }}
                />
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
          <Button type="primary" onClick={fetchData} style={{ width: "100%" }}>
            Filtrele
          </Button>
        </Col>
      </Row>


      <Space style={{ marginBottom: 16, marginTop: 16 }} xs={24} sm={24} md={24} lg={8}>
        <Button style={{ width: "100%" }} onClick={() => exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        <Button style={{ width: "100%" }} onClick={() => exportToPDF(columns, sortedData, pdfFileName)}>PDF İndir</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          position: ["bottomCenter"],
          pageSizeOptions: ["5", "10", "20", "50"],
          size: { paginationSize },
        }}
        rowKey={(record) => `${record.date}-${record.city}-${record.total}-${record.city}`} // benzersiz key
      />
      {/* <Pagination size="small" total={50} /> */}
    </Card>
  );
};

export default PageName;