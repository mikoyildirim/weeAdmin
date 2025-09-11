import React, { useEffect, useState } from "react";
import { Table, DatePicker, Button, Select, message, Card } from "antd";
import axios from "../../api/axios"; // senin axios instance
import dayjs from "dayjs";

const { RangePicker } = DatePicker;

const RentalsReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [dates, setDates] = useState([dayjs(), dayjs()]); // ilk açılışta bugünün tarihi
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);

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
    } catch (error) {
      message.error("Veri alınırken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  // Sayfa ilk açıldığında veriyi çek
  useEffect(() => {
    fetchData();
  }, []);

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
    <Card title="Kiralama Raporları" bordered={false}>
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
        dataSource={data}
        loading={loading}
        rowKey={(record, index) => index}
      />
    </Card>
  );
};

export default RentalsReport;
