import React, { useEffect, useState } from "react";
import { Table, DatePicker, Button, Select, message, Card } from "antd";
import axios from "../../api/axios"; // senin axios instance
import dayjs from "dayjs";
import { useSelector } from "react-redux";

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

  // Cities'i backend'den veya mock ile çek
  useEffect(() => {
    fetchCities();
    fetchData() // sayfayı açar açmaz kullanıcının erişim izni olan şehirlere ait kiralama raporunu ekrana basması için eklendi
  }, []);
  
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


  // cities geldiğinde ilk veriyi çek
  useEffect(() => {
    if (cities.length > 0) {
      fetchData();
    }
  }, [cities]);

  const columns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Toplam",
      dataIndex: "total",
      key: "total",
    },
    {
      title: "Şehir",
      dataIndex: "city",
      key: "city",
    },
  ];

  return (
    <Card title="Kiralama Raporları" variant="outlined">
      <div style={{ marginBottom: 16, display: "flex", gap: "8px" }}>
        <RangePicker
          value={dates}
          onChange={(val) => setDates(val)}
          format="YYYY-MM-DD"
        />
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

      <Table
        columns={columns}
        dataSource={[...data].sort((a, b) => new Date(a.date) - new Date(b.date))} // tarihe göre sırali bir şekilde listeliyor.
        loading={loading}
        rowKey={(record) => `${record.date}-${record.city}`} // benzersiz key
      />
    </Card>
  );
};

export default RentalsReport;
