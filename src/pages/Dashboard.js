import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Typography,
  Spin,
  Row,
  Col,
  Tabs,
  DatePicker,
  Select,
  message,
  Button,
} from "antd";
import { UserOutlined, TabletOutlined } from "@ant-design/icons";
import axios from "../api/axios";
import { useSelector } from "react-redux";
import {
  BarChart, // ComposedChart yerine BarChart'a geri dönüldü
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import dayjs from "dayjs";
import "dayjs/locale/tr";
dayjs.locale("tr");

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { Option } = Select;

const Dashboard = () => {
  const user = useSelector((state) => state.user.user);
  const userName = user?.name || user?.username || "Admin";
  const allowedLocations = user?.permissions?.locations || [];

  // 1. GLOBAL FİLTRELER
  const [selectedCities, setSelectedCities] = useState(allowedLocations);
  const [selectedDates, setSelectedDates] = useState([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);

  // 2. DURUM YÖNETİMİ
  const [memberCount, setMemberCount] = useState(null);
  const [inactiveMemberCount, setInactiveMemberCount] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [deviceCount, setDeviceCount] = useState(null);
  const [inactiveDeviceCount, setInactiveDeviceCount] = useState(null);
  const [loadingDevices, setLoadingDevices] = useState(true);

  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loadingRentals, setLoadingRentals] = useState(false);

  const [totalTransactionAmount, setTotalTransactionAmount] = useState(0);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Grafik Verileri
  // dailyChartData kaldırıldı, artık combinedDailyChartData kullanılıyor
  const [cityChartData, setCityChartData] = useState([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  
  // Birleştirilmiş Grafik Verisi (Rental + Transaction)
  const [combinedDailyChartData, setCombinedDailyChartData] = useState([]);

  // --- Yardımcı Fonksiyonlar (API Çağrıları) ---

  // Kiralama ve Grafik Verilerini Çekme
  const fetchRentalData = useCallback(
    async (startDate, endDate, cities) => {
      const payload = { startDate, endDate, cities, };
      try {
        const response = await axios.post("rentals/find/dayDayByCityAndDate/withCityFilter", payload);
        return response.data || [];
      } catch (error) {
        console.error("Kiralama verisi çekme hatası:", error);
        message.error("Kiralama verileri alınamadı.");
        return [];
      }
    },
    []
  );

  // Başarılı İşlem Verilerini Çekme (Yalnızca Tarih Filtreli)
  const fetchTransactionData = useCallback(
    async (startDate, endDate) => {
      setLoadingTransactions(true);
      try {
        const response = await axios.post("transactions/successTransactions", {
          startDate: startDate,
          endDate: endDate,
          type: 1, 
          payment_gateway: "iyzico", 
        });

        const dailyTransactions = {};
        let calculatedTotal = 0;

        (response.data || []).forEach((item) => {
          const date = dayjs(item.payment_date).format("YYYY-MM-DD");
          const amount = Number(item.amount || 0);

          dailyTransactions[date] = (dailyTransactions[date] || 0) + amount;
          calculatedTotal += amount;
        });

        setTotalTransactionAmount(calculatedTotal);
        setLoadingTransactions(false);
        return dailyTransactions; 
      } catch (error) {
        console.error("İşlem verisi çekme hatası:", error);
        message.error("İşlem (Yükleme) verileri alınamadı.");
        setLoadingTransactions(false);
        return {};
      }
    },
    []
  );

  // Üye Verilerini Çekme (Şehir Filtreli)
  const fetchMembers = useCallback(async (cities) => {
    if (cities.length === 0) {
      setMemberCount(0);
      setInactiveMemberCount(0);
      setLoadingMembers(false);
      return;
    }
    setLoadingMembers(true);
    try {
      const response = await axios.post("/members/listByMembers", {
        tenantId: "62a1e7efe74a84ea61f0d588",
        cities: cities,
      });

      setMemberCount(response.data.count);
      setInactiveMemberCount(response.data.inactiveCount || 0);
    } catch (error) {
      console.error("Kullanıcı sayısı alınamadı:", error);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  // Cihaz Verilerini Çekme (Şehir Filtreli)
  const fetchDevices = useCallback(async (cities) => {
    if (cities.length === 0) {
      setDeviceCount(0);
      setInactiveDeviceCount(0);
      setLoadingDevices(false);
      return;
    }
    setLoadingDevices(true);
    try {
      const response = await axios.get("/devices");
      const allDevices = response.data || [];

      const filteredDevices = allDevices.filter((d) =>
        cities.includes(d.city)
      );

      setDeviceCount(filteredDevices.length);
      const inactiveDevices = filteredDevices.filter(
        (d) => d.status === "passive"
      );
      setInactiveDeviceCount(inactiveDevices.length);
    } catch (error) {
      console.error("Cihaz sayısı alınamadı:", error);
    } finally {
      setLoadingDevices(false);
    }
  }, []);

  // 4. TÜM VERİ ÇEKME MANTIĞI
  const fetchAllData = useCallback(async () => {
    if (selectedCities.length === 0 || selectedDates.length !== 2) {
      message.warning("Lütfen en az bir şehir ve bir tarih aralığı seçin.");
      return;
    }

    const [startDayjs, endDayjs] = selectedDates;
    const startDate = startDayjs.format("YYYY-MM-DD");
    const endDate = endDayjs.format("YYYY-MM-DD");

    // --- Kiralama ve İşlem Verileri Eş Zamanlı Çekilir ---
    setLoadingRentals(true);
    setLoadingCharts(true);
    const rentalDataPromise = fetchRentalData(
      startDate,
      endDate,
      selectedCities
    );
    const transactionDataPromise = fetchTransactionData(startDate, endDate);

    const [rentalData, dailyTransactions] = await Promise.all([
      rentalDataPromise,
      transactionDataPromise,
    ]);

    // 1. Kiralama Verilerini İşle
    const calculatedTotalRevenue = rentalData.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0
    );
    setTotalRevenue(calculatedTotalRevenue);

    // Günlük Kiralama Verileri
    const dailyRentalTotals = {};
    rentalData.forEach((item) => {
      const date = dayjs(item.date).format("YYYY-MM-DD");
      dailyRentalTotals[date] =
        (dailyRentalTotals[date] || 0) + Number(item.total || 0);
    });

    // 2. Grafik Verilerini Birleştirme (Kiralama + İşlem)
    const combinedTotals = {};

    // Kiralama verilerini ekle
    Object.keys(dailyRentalTotals).forEach((date) => {
      combinedTotals[date] = {
        date,
        rental: dailyRentalTotals[date],
        transaction: dailyTransactions[date] || 0,
      };
    });

    // Sadece işlem olan günleri ekle (Kiralaması olmayan)
    Object.keys(dailyTransactions).forEach((date) => {
      if (!combinedTotals[date]) {
        combinedTotals[date] = {
          date,
          rental: 0,
          transaction: dailyTransactions[date],
        };
      }
    });

    // Sıralanmış birleşik grafik verisi oluştur
    const combinedChart = Object.values(combinedTotals)
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
      
    setCombinedDailyChartData(combinedChart);
    
    // Şehir Bazlı Kiralama Grafiği (Aynı kaldı)
    const cityTotals = {};
    rentalData.forEach((item) => {
      const city = item.city || "Bilinmeyen";
      cityTotals[city] = (cityTotals[city] || 0) + Number(item.total || 0);
    });
    const cityChart = Object.keys(cityTotals).map((city) => ({
      name: city,
      value: cityTotals[city],
    }));
    setCityChartData(cityChart);

    setLoadingRentals(false);
    setLoadingCharts(false);
  }, [selectedCities, selectedDates, fetchRentalData, fetchTransactionData]);

  // --- useEffectler ---

  // Şehir Filtresi Değiştiğinde Kullanıcı ve Cihaz verilerini çek
  useEffect(() => {
    if (selectedCities.length > 0) {
      fetchMembers(selectedCities);
      fetchDevices(selectedCities);
    } else {
      setMemberCount(0);
      setInactiveMemberCount(0);
      setDeviceCount(0);
      setInactiveDeviceCount(0);
      setLoadingMembers(false);
      setLoadingDevices(false);
    }
  }, [selectedCities, fetchMembers, fetchDevices]);

  // İlk yüklemede ve allowedLocations güncellendiğinde (izinler geldiğinde)
  useEffect(() => {
    if (
      allowedLocations.length > 0 &&
      selectedCities.length > 0 &&
      selectedDates.length === 2
    ) {
      if (
        selectedCities.length !== allowedLocations.length ||
        !selectedCities.every((c) => allowedLocations.includes(c))
      ) {
        setSelectedCities(allowedLocations);
      }
      fetchAllData();
    }
  }, [allowedLocations.length]);

  // --- Görsel Bileşenler ---
  const COLORS = [
    "#1890ff",
    "#52c41a",
    "#faad14",
    "#eb2f96",
    "#13c2c2",
    "#722ed1",
    "#fa541c",
  ];
  const cardStyle = {
    borderRadius: 12,
    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
    minHeight: 140,
  };
  const iconStyle = { fontSize: 48, color: "#1890ff" };

  // Tarih aralığını kısıtlama
  const disabledDate = (current) => {
    return (
      current &&
      (current > dayjs().endOf("day") ||
        current < dayjs().subtract(90, "day"))
    );
  };

  const handleCityChange = (val) => {
    const validCities = val.filter((city) => allowedLocations.includes(city));
    setSelectedCities(validCities);
  };
  
  // Para birimi formatlayıcı
  const currencyFormatter = (v) =>
    v.toLocaleString("tr-TR", {
      style: "currency",
      currency: "TRY",
      minimumFractionDigits: 2,
    });
  
  // Grafik Tooltip formatlayıcı
  const tooltipFormatter = (v, name) => [
    currencyFormatter(v),
    name === 'rental' ? 'Kiralama Geliri' : 'Başarılı Yükleme',
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* 🧭 Üst Kartlar ve Global Filtre */}
      <Row gutter={[24, 24]}>
        <Col xs={24}>
          <Card style={{ ...cardStyle, backgroundColor: "#e6f7ff" }}>
            <Title level={3}>Hoşgeldiniz, {userName}!</Title>
            <Text type="secondary">Bugün güzel bir gün dileriz 🙂</Text>
          </Card>
        </Col>

        {/* ⚙️ GLOBAL FİLTRE BÖLÜMÜ (Multi-Select Şehir) */}
        <Col xs={24}>
          <Card title="Global Veri Filtresi" style={cardStyle}>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              <Select
                placeholder="Şehirleri seçin"
                mode="multiple"
                value={selectedCities}
                onChange={handleCityChange}
                style={{ width: 300 }}
                disabled={allowedLocations.length === 0}
              >
                {allowedLocations.map((loc) => (
                  <Option key={loc} value={loc}>
                    {loc}
                  </Option>
                ))}
              </Select>
              <RangePicker
                value={selectedDates}
                onChange={(val) => setSelectedDates(val || [])}
                style={{ width: 250 }}
                disabledDate={disabledDate}
                allowEmpty={[false, false]}
              />
              <Button
                type="primary"
                onClick={fetchAllData}
                loading={
                  loadingRentals || loadingCharts || loadingTransactions
                }
                disabled={
                  selectedCities.length === 0 || selectedDates.length !== 2
                }
              >
                Verileri Getir
              </Button>
            </div>
            <Text type="secondary" style={{ marginTop: 8, display: "block" }}>
              Seçilen Şehirler ve Tarih Aralığı aşağıdaki tüm kiralama ve grafik verilerini etkiler. Kullanıcı ve Cihaz sayıları yalnızca Şehir filtresinden etkilenir.
            </Text>
          </Card>
        </Col>

        {/* Kullanıcı Kartı (Şehir Filtreli) */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Title level={4}>Kullanıcılar ({selectedCities.join(", ") || "Filtresiz"})</Title>
                {loadingMembers ? (
                  <Spin />
                ) : (
                  <>
                    <Text style={{ fontSize: 20, color: "#1890ff" }}>
                      Toplam: {memberCount !== null ? memberCount : 0}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 20, color: "#ff4d4f" }}>
                      Pasif: {inactiveMemberCount !== null ? inactiveMemberCount : 0}
                    </Text>
                  </>
                )}
              </div>
              <UserOutlined style={iconStyle} />
            </div>
          </Card>
        </Col>

        {/* Cihaz Kartı (Şehir Filtreli) */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <Title level={4}>Cihazlar ({selectedCities.join(", ") || "Filtresiz"})</Title>
                {loadingDevices ? (
                  <Spin />
                ) : (
                  <>
                    <Text style={{ fontSize: 20, color: "#1890ff" }}>
                      Toplam: {deviceCount !== null ? deviceCount : 0}
                    </Text>
                    <br />
                    <Text style={{ fontSize: 20, color: "#ff4d4f" }}>
                      Pasif: {inactiveDeviceCount !== null ? inactiveDeviceCount : 0}
                    </Text>
                  </>
                )}
              </div>
              <TabletOutlined style={iconStyle} />
            </div>
          </Card>
        </Col>

        {/* Kiralama Gelir Kartı (Filtreli) */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={cardStyle}>
            <Tabs defaultActiveKey="total">
              <TabPane tab="Toplam Kiralama Geliri" key="total">
                {loadingRentals ? (
                  <Spin />
                ) : (
                  <Title level={3}>{currencyFormatter(totalRevenue)}</Title>
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        {/* Yükleme (Transaction) Kartı (Filtreli) */}
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable style={cardStyle}>
            <Tabs defaultActiveKey="transaction">
              <TabPane tab="Toplam Yükleme (İşlem)" key="transaction">
                {loadingTransactions ? (
                  <Spin />
                ) : (
                  <Title level={3}>
                    {currencyFormatter(totalTransactionAmount)}
                  </Title>
                )}
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      {/* 📊 Grafikler (Filtreli) */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* Günlük Kiralama ve Yükleme Grafiği (Yan Yana Bar) */}
        <Col xs={24} lg={12}>
          <Card title="Günlük Kiralama ve Yükleme Gelirleri (Kıyaslama)">
            {loadingCharts || loadingTransactions ? (
              <Spin style={{ height: 300 }} />
            ) : combinedDailyChartData.length === 0 ? (
              <Text
                type="secondary"
                style={{
                  display: "block",
                  padding: "100px 0",
                  textAlign: "center",
                }}
              >
                Gösterilecek veri bulunamadı.
              </Text>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                {/* BarChart ile yan yana iki çubuk (Bar) oluşturulur */}
                <BarChart data={combinedDailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) => dayjs(date).format("DD MMM")}
                  />
                  {/* Para birimi formatı için YAxis'i sadeleştirildi */}
                  <YAxis tickFormatter={(v) => currencyFormatter(v).replace('₺', '').trim()} />
                  <Tooltip
                    formatter={tooltipFormatter}
                    labelFormatter={(date) => dayjs(date).format("DD MMMM YYYY")}
                  />
                  <Legend />
                  {/* Kiralama Geliri (Mavi Çubuk) */}
                  <Bar 
                    dataKey="rental" 
                    name="Kiralama Geliri" 
                    fill="#1890ff" 
                    radius={[4, 4, 0, 0]} 
                  />
                  {/* Başarılı Yükleme (Turuncu Çubuk) */}
                  <Bar
                    dataKey="transaction"
                    name="Başarılı Yükleme"
                    fill="#faad14"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        {/* Şehir Bazlı Kiralama Dağılımı (Aynı kaldı) */}
        <Col xs={24} lg={12}>
          <Card title="Şehir Bazlı Kiralama Gelir Dağılımı">
            {loadingCharts ? (
              <Spin style={{ height: 300 }} />
            ) : cityChartData.length === 0 ? (
              <Text
                type="secondary"
                style={{
                  display: "block",
                  padding: "100px 0",
                  textAlign: "center",
                }}
              >
                Gösterilecek veri bulunamadı.
              </Text>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={cityChartData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={110}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    fill="#8884d8"
                  >
                    {cityChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => currencyFormatter(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;