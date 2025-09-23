import React, { useEffect, useState } from "react";
import { Space, Table, DatePicker, Button, message, Card, ConfigProvider, Col, Row, Input } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/exportToExcel";
import exportToPDF from "../../utils/exportToPDF";
import formatTL from "../../utils/formatTL";

dayjs.locale("tr");
const { RangePicker } = DatePicker;

const TransactionsReport = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]);
  const [isMobile, setIsMobile] = useState(false);
  const [paginationSize, setPaginationSize] = useState([]);

  const sortedData = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const excelFileName = `${dates[0].format("YYYY-MM-DD")}_${dates[1].format("YYYY-MM-DD")} Yükleme Raporu.xlsx`;
  const totalAmount = filteredData.reduce((acc, item) => acc + Number(item.amount), 0);

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
      setFilteredData(response.data || []); // başta filtrelenmiş data da eşitle
    } catch (error) {
      message.error("Veri alınırken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  // Search işlemi
  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = data.filter((item) => {
      return (
        item.transaction_id.toString().includes(value) ||
        item.payment_gateway.toLowerCase().includes(value.toLowerCase()) ||
        dayjs(item.date).format("YYYY-MM-DD").includes(value) ||
        item.amount.toString().includes(value)
      );
    });
    setFilteredData(filtered);
  };

  const excelData = filteredData.map(d => ({
    "Tarih": dayjs(d.date).format('YYYY-MM-DD'),
    "Ödeme Yöntemi": d.payment_gateway,
    "İşlem Numarası": d.transaction_id,
    "Yükleme Tutarı": d.amount
  }));

  const columns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      sortDirections: ["ascend", "descend"],
      defaultSortOrder: "ascend",
      align: "center",
      render: (value) => dayjs(value).format("YYYY-MM-DD"),
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
      sorter: (a, b) => a.transaction_id - b.transaction_id,
      sortDirections: ["ascend", "descend"],
      align: "center",
    },
    {
      title: "Yükleme Tutarı",
      dataIndex: "amount",
      key: "amount",
      sorter: (a, b) => a.amount - b.amount,
      sortDirections: ["ascend", "descend"],
      align: "center",
      render: (value) => {
        return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 })
          .format(value).replace("₺", "").trim() + " ₺";
      },
      align: "center",
    },
  ];

  return (
    <Card title="Yükleme Raporları" variant="outlined">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={16}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={24} md={24} lg={8}>
              <ConfigProvider locale={trTR}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <label style={{ marginBottom: 4 }}>Tarih Aralığı</label>
                  {isMobile ? (
                    <Space direction="vertical" size={12}>
                      <DatePicker value={dates[0]} onChange={(val) => setDates(prev => [val, prev[1]])} style={{ width: "100%", margin: "8px 0" }} renderExtraFooter={() => 'Başlangıç tarihi'} />
                      <DatePicker value={dates[1]} onChange={(val) => setDates(prev => [prev[0], val])} style={{ width: "100%", margin: "8px 0" }} renderExtraFooter={() => 'Bitiş tarihi'} />
                    </Space>
                  ) : (
                    <RangePicker value={dates} onChange={(val) => setDates(val)} format="YYYY-MM-DD" style={{ width: "100%" }} />
                  )}
                </div>
              </ConfigProvider>
            </Col>
            <Col xs={24} sm={24} md={24} lg={8}>
              <Button type="primary" onClick={fetchData} style={{ width: "100%", marginTop: 24 }}>
                Filtrele
              </Button>
            </Col>
          </Row>
        </Col>

        <Col xs={24} sm={24} md={24} lg={8}>
          <Card>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "100%" }}>
              <p style={{ fontSize: 24, margin: 0 }}>{formatTL(totalAmount)}</p>
              <span style={{ fontSize: 20 }}>Toplam Yükleme</span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={16}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: isMobile ? "wrap" : "nowrap",
              alignItems: "center",
            }}
          >
            <Input
              placeholder="Ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                margin: isMobile ? "0 0 8px 0" : "16px 0",
                width: isMobile ? "100%" : "300px",
              }}
            />
            <Button
              type="primary"
              style={{
                width: isMobile ? "100%" : "auto",
              }}
              onClick={() => exportToExcel(sortedData, excelFileName)}
            >
              Excel İndir
            </Button>
          </div>
        </Col>
      </Row>

      <Table
        columns={isMobile ? columns.slice(0, 2) : columns}
        dataSource={sortedData}
        loading={loading}
        pagination={{
          position: ["bottomCenter"],
          pageSizeOptions: ["5", "10", "20", "50"],
          size: paginationSize,
        }}
        rowKey={(record) => `${record.date}-${record.transaction_id}-${record.amount}-${record.status}`}
        expandable={isMobile ? {
          expandedRowRender: (record) => (
            <div style={{ fontSize: 14 }}>
              <p><b>İşlem No:</b> {record.transaction_id}</p>
              <p><b>Yükleme Tutarı:</b> {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2 }).format(record.amount).replace("₺", "").trim()} ₺</p>
            </div>
          ),
          expandRowByClick: true
        } : undefined}
      />
    </Card>
  );
};

export default TransactionsReport;
