import React, { useEffect, useState } from "react";
import { Space, Table, DatePicker, Button, Select, message, Card, ConfigProvider } from "antd";
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

const RentalsReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]); // ilk açılışta bugünün tarihi
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);


  const user = useSelector((state) => state.user.user);
  //const userName = user?.name || user?.username || "Admin";
  const locations = user?.permissions?.locations || [];

  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Kiralama Raporu.xlsx`
  const pdfFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Kiralama Raporu.pdf`
  const totalRentals = data.reduce((acc, item) => acc + Number(item.total), 0);
  console.log(formatTL(totalRentals));

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
        "rentals/find/dayDayByCityAndDate/withCityFilter",
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
      title: "Toplam",
      dataIndex: "total",
      key: "total",
      sorter: (a, b) => a.total - b.total, // sayısal sıralama
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
      title: "Sehir",
      dataIndex: "city",
      key: "city",
      sorter: (a, b) => a.city.localeCompare(b.city), // alfabetik sıralama
      sortDirections: ["ascend", "descend"], // cancel sorting yok
      align: "center",
    },
  ];

  return (
    <Card title="Kiralama Raporları" variant="outlined">
      <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between", }}>
        <div style={{ flex: 1, marginBottom: 16, display: "flex", gap: "8px", height: "fit-content", }}>

          <ConfigProvider locale={trTR}>
            <RangePicker
              value={dates}
              onChange={(val) => setDates(val)}
              format="YYYY-MM-DD"
            />
          </ConfigProvider>

          <Select
            mode="multiple"
            style={{ minWidth: 200 }}
            placeholder="Şehir seçiniz"
            value={selectedCities}
            onChange={(val) => setSelectedCities(val)}
            options={cities.map((c) => ({ label: c, value: c }))}
          />
          <Button type="primary" onClick={fetchData}>
            Filtrele
          </Button>

        </div>
        <div style={{ flex: 1 }}>
          <Card style={{ justifyContent: "center", alignItems: "center" }}>
            <div style={{ margin: 16, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
              <p style={{ fontSize: "32px", justifyContent: "center", alignItems: "center" }}>Toplam Kiralama</p>
              <span style={{ fontSize: "24px", justifyContent: "center", alignItems: "center" }}>{formatTL(totalRentals)}</span>
            </div>

          </Card>
        </div>

      </div>


      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        <Button onClick={() => exportToPDF(columns, sortedData, pdfFileName)}>PDF İndir</Button>
      </Space>
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey={(record) => `${record.date}-${record.city}`} // benzersiz key
      />
    </Card>
  );
};

export default RentalsReport;
