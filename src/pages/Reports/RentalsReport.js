import React, { useEffect, useState } from "react";
import {
    Space,
    Table,
    DatePicker,
    Button,
    Select,
    message,
    Card,
    ConfigProvider,
    Col,
    Row,
    Typography,
} from "antd";
import { SearchOutlined, DownloadOutlined } from "@ant-design/icons";
import axios from "../../api/axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import trTR from "antd/es/locale/tr_TR";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/exportToExcel";
import exportToPDF from "../../utils/exportToPDF";
import formatTL from "../../utils/formatTL";

dayjs.locale("tr");

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const RentalsReport = () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState([]);
    const [dates, setDates] = useState([dayjs().subtract(1, "day"), dayjs()]);
    const [cities, setCities] = useState([]);
    const [selectedCities, setSelectedCities] = useState([]);
    const [isMobile, setIsMobile] = useState(false);

    const user = useSelector((state) => state.user.user);
    const locations = user?.permissions?.locations || [];

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

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
    }, [dates, selectedCities]);

    const fetchData = async () => {
        if (!dates[0] || !dates[1]) {
            message.warning("Lütfen bir tarih aralığı seçin.");
            return;
        }
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

    const sortedData = [...data].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
    );
    const excelFileName = `${dates[0]?.format(
        "YYYY-MM-DD"
    )}_${dates[1]?.format("YYYY-MM-DD")} Kiralama Raporu.xlsx`;
    const pdfFileName = `${dates[0]?.format(
        "YYYY-MM-DD"
    )}_${dates[1]?.format("YYYY-MM-DD")} Kiralama Raporu.pdf`;
    const totalRentals = data.reduce(
        (acc, item) => acc + Number(item.total),
        0
    );

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
            title: "Toplam",
            dataIndex: "total",
            key: "total",
            sorter: (a, b) => a.total - b.total,
            sortDirections: ["ascend", "descend"],
            render: (value) => <Text strong>{formatTL(value)}</Text>,
            align: "center",
        },
        {
            title: "Şehir",
            dataIndex: "city",
            key: "city",
            sorter: (a, b) =>
                a.city.localeCompare(b.city, "tr", { sensitivity: "base" }),
            sortDirections: ["ascend", "descend"],
            align: "center",
        },
    ];

    return (
        <ConfigProvider locale={trTR}>
            <Card
                style={{
                    minHeight: "100vh",
                    background: "#f5f7fa",
                    border: "none",
                    padding: 24,
                }}
            >
                {/* Filtreleme Alanı */}
                <Card
                    title={
                        <Title level={3} style={{ color: "#1890ff", margin: 0 }}>
                            📊 Kiralama Raporu Filtreleri
                        </Title>
                    }
                    style={{
                        marginBottom: 24,
                        borderRadius: 16,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    headStyle={{ backgroundColor: "#fafafa", borderRadius: "16px 16px 0 0" }}
                >
                    <Row gutter={[16, 16]} align="bottom">
                        <Col xs={24} md={8}>
                            <Text strong>Tarih Aralığı</Text>
                            {isMobile ? (
                                <Space
                                    direction="vertical"
                                    style={{ width: "100%", marginTop: 8 }}
                                >
                                    <DatePicker
                                        value={dates[0]}
                                        onChange={(val) =>
                                            setDates((prev) => [val, prev[1]])
                                        }
                                        style={{ width: "100%" }}
                                    />
                                    <DatePicker
                                        value={dates[1]}
                                        onChange={(val) =>
                                            setDates((prev) => [prev[0], val])
                                        }
                                        style={{ width: "100%" }}
                                    />
                                </Space>
                            ) : (
                                <RangePicker
                                    value={dates}
                                    onChange={setDates}
                                    format="YYYY-MM-DD"
                                    style={{ width: "100%", marginTop: 8 }}
                                />
                            )}
                        </Col>
                        <Col xs={24} md={8}>
                            <Text strong>Şehir Seçiniz</Text>
                            <Select
                                mode="multiple"
                                style={{ width: "100%", marginTop: 8 }}
                                placeholder="Tüm şehirler"
                                value={selectedCities}
                                onChange={setSelectedCities}
                                options={cities.map((c) => ({ label: c, value: c }))}
                            />
                        </Col>
                        <Col xs={24} md={8}>
                            <Button
                                type="primary"
                                onClick={fetchData}
                                loading={loading}
                                icon={<SearchOutlined />}
                                style={{ width: "100%" }}
                                size="large"
                            >
                                Raporu Getir
                            </Button>
                        </Col>
                    </Row>
                </Card>

                {/* Veri Alanı */}
                <Card
                    title={<Title level={3}>📈 Kiralama Verileri</Title>}
                    style={{
                        borderRadius: 16,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                    headStyle={{ backgroundColor: "#fafafa", borderRadius: "16px 16px 0 0" }}
                >
                    <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 24 }}>
                        <Col xs={24} lg={16}>
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                    background: "linear-gradient(135deg, #1890ff 0%, #722ed1 100%)",
                                    color: "#fff",
                                    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                                }}
                            >
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Title level={4} style={{ margin: 0, color: "#fff" }}>
                                            Toplam Kiralama
                                        </Title>
                                    </Col>
                                    <Col>
                                        <Title level={2} style={{ margin: 0, color: "#fff" }}>
                                            {formatTL(totalRentals)}
                                        </Title>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                        <Col xs={24} lg={8}>
                            <Card
                                bordered={false}
                                style={{
                                    borderRadius: 16,
                                    boxShadow: "0 6px 16px rgba(0,0,0,0.10)",
                                }}
                            >
                                <Row justify="space-between" align="middle">
                                    <Col>
                                        <Title level={4} style={{ margin: 0 }}>
                                            İndirme Seçenekleri
                                        </Title>
                                    </Col>
                                    <Col>
                                        <Space>
                                            <Button
                                                type="primary"
                                                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                                onClick={() => exportToExcel(sortedData, columns, excelFileName)}
                                                icon={<DownloadOutlined />}
                                            >
                                                Excel
                                            </Button>
                                            <Button
                                                type="primary"
                                                danger
                                                onClick={() => exportToPDF(columns, sortedData, pdfFileName)}
                                                icon={<DownloadOutlined />}
                                            >
                                                PDF
                                            </Button>
                                        </Space>
                                    </Col>
                                </Row>
                            </Card>
                        </Col>
                    </Row>

                    <Table
                        columns={columns}
                        dataSource={data}
                        loading={loading}
                        pagination={{
                            position: ["bottomCenter"],
                            pageSizeOptions: ["5", "10", "20", "50"],
                            size: isMobile ? "small" : "default",
                        }}
                        rowKey={(record) => `${record.date}-${record.city}`}
                        scroll={{ x: true }}
                        bordered
                    />
                </Card>
            </Card>
        </ConfigProvider>
    );
};

export default RentalsReport;
