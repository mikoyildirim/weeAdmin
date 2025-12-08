import React, { useEffect, useState } from "react";
import {
  Table,
  DatePicker,
  Button,
  Input,
  message,
  Card,
  ConfigProvider,
  Col,
  Row,
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/methods/exportToExcel";
import formatTL from "../../utils/methods/formatTL";
import "../../utils/styles/rangePickerMobile.css"
import { useIsMobile } from "../../utils/customHooks/useIsMobile";


dayjs.locale("tr");
const { RangePicker } = DatePicker;

const TransactionsReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]);
  const [searchText, setSearchText] = useState("");
  const [paginationSize, setPaginationSize] = useState("medium");
  const isMobile = useIsMobile(991);

  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Yükleme Raporu.xlsx`;
  const totalAmount = filteredData.reduce((acc, item) => acc + Number(item.amount), 0);

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await axios.post("transactions/successTransactions", {
        startDate: dates[0].format("YYYY-MM-DD"),
        endDate: dates[1].format("YYYY-MM-DD"),
        type: 1,
        payment_gateway: "iyzico",
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
      item.transaction_id.toString().includes(searchText) ||
      item.payment_gateway.toLowerCase().includes(searchText.toLowerCase()) ||
      dayjs(item.date).format("YYYY-MM-DD").includes(searchText) ||
      item.amount.toString().includes(searchText)
    );
    setFilteredData(filtered);
  }, [searchText, data]);

  const columns = [
    { title: "Tarih", dataIndex: "date", key: "date", sorter: (a, b) => new Date(a.date) - new Date(b.date), align: "center", render: val => dayjs(val).format("YYYY-MM-DD") },
    // { title: "Ödeme Yöntemi", dataIndex: "payment_gateway", key: "payment_gateway", align: "center" },
    { title: "İşlem Numarası", dataIndex: "transaction_id", key: "transaction_id", sorter: (a, b) => a.transaction_id - b.transaction_id, align: "center" },
    { title: "Yükleme Tutarı", dataIndex: "amount", key: "amount", sorter: (a, b) => a.amount - b.amount, align: "center", render: val => formatTL(val) },
  ];

  return (
    <div>
      <h1>Yükleme Raporu</h1>
      {/* Üst Kart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={24}>
          <Card style={{ textAlign: "center", background: "#fafafa" }}>
            <p style={{ fontSize: 28, margin: 0, fontWeight: "bold" }}>{formatTL(totalAmount)}</p>
            <span>Toplam Yükleme</span>
          </Card>
        </Col>
      </Row>

      {/* Filtre Card */}
      <Card style={{ marginBottom: 16 }}>
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
          <Col xs={24} md={12} style={{ display: "flex", alignItems: "flex-end" }}>
            <Button type="primary" onClick={fetchData} style={{ width: "100%" }}>Filtrele</Button>
          </Col>
        </Row>
      </Card>

      {/* Arama & Excel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 12 }}>
        <Col xs={24} md={12}>
          <Input placeholder="Ara..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </Col>
        <Col xs={24} md={12} style={{ textAlign: "right" }}>
          <Button type="primary" onClick={() => exportToExcel(sortedData, excelFileName)}>Excel İndir</Button>
        </Col>
      </Row>

      {/* Tablo */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ position: ["bottomCenter"], pageSizeOptions: ["5", "10", "20", "50"], size: paginationSize }}
          rowKey={(record) => `${record.date}-${record.transaction_id}-${record.amount}-${record.payment_gateway}`}
        />
      </Card>
    </div>
  )
};

export default TransactionsReport;
