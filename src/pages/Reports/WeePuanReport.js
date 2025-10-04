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
  const [paginationSize, setPaginationSize] = useState("medium");
  const [searchText, setSearchText] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const user = useSelector((state) => state.user.user);
  const locations = user?.permissions?.locations || [];

  // Toplamlar
  const totalWeePuan = filteredData.reduce((acc, item) => acc + Number(item.total), 0);
  const totalTL = totalWeePuan / 10;

  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Wee Puan Raporu.xlsx`;

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

  // Sayfa açılışında şehirleri getir ve hepsini seç
  useEffect(() => {
    if (locations.length > 0) {
      setCities(locations);
      setSelectedCities(locations);
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
      const response = await axios.post("transactions/find/totalTransactions", {
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
        cities: selectedCities.length > 0 ? selectedCities : locations,
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
      item.city?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.date?.toLowerCase().includes(searchText.toLowerCase()) ||
      String(item.total).includes(searchText)
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  const columns = [
    { title: "Tarih", dataIndex: "date", key: "date", sorter: (a,b)=>new Date(a.date)-new Date(b.date), align:"center" },
    { title: "Şehir", dataIndex: "city", key: "city", sorter: (a,b)=>a.city.localeCompare(b.city), align:"center" },
    { title: "Toplam WeePuan", dataIndex: "total", key: "totalWeePuan", sorter: (a,b)=>a.total-b.total, align:"center",
      render: (value) => new Intl.NumberFormat("tr-TR", {maximumFractionDigits:2}).format(value) + " WEEPUAN"
    },
    { title: "TL Karşılığı", dataIndex: "total", key: "totalTL", sorter: (a,b)=>a.total-b.total, align:"center",
      render: (value) => (new Intl.NumberFormat("tr-TR", {style:"currency",currency:"TRY", minimumFractionDigits:2}).format(value/10).replace("₺","").trim() + " ₺")
    },
  ];

  return (
    <div>
      {/* Toplam Kartlar */}
      <Row gutter={[16,16]} style={{ marginBottom:16 }}>
        <Col xs={24} md={12}>
          <Card style={{ textAlign:"center", background:"#fafafa" }}>
            <p style={{ fontSize:24, margin:0 }}>{new Intl.NumberFormat("tr-TR").format(totalWeePuan)} WEEPUAN</p>
            <span>Toplam WeePuan</span>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card style={{ textAlign:"center", background:"#fafafa" }}>
            <p style={{ fontSize:24, margin:0 }}>{new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(totalTL).replace("₺","").trim()} ₺</p>
            <span>TL Karşılığı</span>
          </Card>
        </Col>
      </Row>

      {/* Filtre Card */}
      <Card style={{ marginBottom:16 }}>
        <Row gutter={[16,16]}>
          <Col xs={24} md={8}>
            <label>Tarih Aralığı</label>
            <ConfigProvider locale={trTR}>
              {isMobile ? (
                <Space direction="vertical" size={12}>
                  <DatePicker value={dates[0]} onChange={(val)=>setDates([val||dates[0], dates[1]])} style={{width:"100%"}} />
                  <DatePicker value={dates[1]} onChange={(val)=>setDates([dates[0], val||dates[1]])} style={{width:"100%"}} />
                </Space>
              ) : (
                <RangePicker value={dates} onChange={(val)=>setDates(val||dates)} format="YYYY-MM-DD" style={{width:"100%"}} />
              )}
            </ConfigProvider>
          </Col>
          <Col xs={24} md={8}>
            <label>Şehir Seçiniz</label>
            <Select
              mode="multiple"
              allowClear
              style={{width:"100%"}}
              placeholder="Şehir seçiniz"
              value={selectedCities}
              onChange={setSelectedCities}
              options={cities.map(c=>({label:c,value:c}))}
            />
          </Col>
          <Col xs={24} md={8} style={{ display:"flex", alignItems:"flex-end" }}>
            <Button type="primary" onClick={fetchData} style={{width:"100%"}}>Filtrele</Button>
          </Col>
        </Row>
      </Card>

      {/* Arama & Excel */}
      <Row gutter={[16,16]} style={{ marginBottom:12 }}>
        <Col xs={24} md={16}>
          <Input placeholder="Ara..." value={searchText} onChange={(e)=>setSearchText(e.target.value)} />
        </Col>
        <Col xs={24} md={8} style={{ textAlign:"right" }}>
          <Button type="primary" onClick={()=>exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        </Col>
      </Row>

      {/* Tablo */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ position:["bottomCenter"], pageSizeOptions:["5","10","20","50"], size:paginationSize }}
          rowKey={(record)=>`${record.date}-${record.city}-${record.total}`}
        />
      </Card>
    </div>
  )
};

export default WeePuanReport;
