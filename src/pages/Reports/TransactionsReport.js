import React, { useEffect, useState } from "react";
import { Space, Table, DatePicker, Button, Select, message, Card, ConfigProvider, Col, Row } from "antd";
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768); // 768px altı mobil
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const user = useSelector((state) => state.user.user);
  //const userName = user?.name || user?.username || "Admin";
  const locations = user?.permissions?.locations || [];

  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Yükleme Raporu.xlsx`
  const pdfFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Yükleme Raporu.pdf`
  const totalAmount = data.reduce((acc, item) => acc + Number(item.amount), 0);
  console.log(formatTL(totalAmount));

  // Cities'i backend'den veya mock ile çek
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
        "transactions/successTransactions",
        {
          startDate: dates[0].format("YYYY-MM-DD"),
          endDate: dates[1].format("YYYY-MM-DD"),
          type: 1,
          payment_gateway: "iyzico"
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
      render: (value) => {
        return dayjs(value).format('YYYY-MM-DD')
      },
    },
    {
      title: "Ödeme Yöntemi",
      dataIndex: "payment_gateway",
      key: "payment_gateway",
      align: "center",
    },
    {
      title: "İşlem Numarası",
      dataIndex: "transaction_id",
      key: "transaction_id",
      sorter: (a, b) => a.transaction_id - b.transaction_id, // sayısal sıralama
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      align: "center",
    },
    {
      title: "Yükleme Tutarı",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount, // sayısal sıralama
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      render: (value) => {
        const formatted = new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
          minimumFractionDigits: 2,
        }).format(value);

        // ₺ işareti baştaysa, sona taşı
        return formatted.replace("₺", "").trim() + " ₺"; // direkt yukarı yazılırsa ₺ işareti başta oluyor okunuş zor oluyor bu metod ile ₺ işareti miktarın sonuna alındı
      },
      align: "center",
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => a.status.localeCompare(b.status), // alfabetik sıralama
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      align: "center",
    },
  ];

  return (
    <Card title="Yükleme Raporları" variant="outlined">
      <Row gutter={[16, 16]}>
        {/* Filtreleme alanı */}
        <Col xs={24} sm={24} md={24} lg={16}>
          <Row gutter={[12, 12]}>
            {/* Tarih filtresi */}
            <Col xs={24} sm={24} md={24} lg={8}>
              <ConfigProvider locale={trTR}>
                <div style={{ display: "flex", flexDirection: "column" }}>
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
              <p
                style={{
                  fontSize: 24,
                  margin: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {formatTL(totalAmount)}
              </p>
              <span style={{ fontSize: 20 }}>Toplam Yükleme</span>
            </div>
          </Card>
        </Col>
      </Row>


      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        <Button onClick={() => exportToPDF(columns, sortedData, pdfFileName)}>PDF İndir</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey={(record) => `${record.date}-${record.transaction_id}-${record.amount}-${record.status}`} // benzersiz key
      />
    </Card>
  );
};

export default PageName;