// src/pages/Dashboard.js
import React, { useEffect, useState } from "react";
import { Card, Typography, Spin, Row, Col, Tabs } from "antd";
import { UserOutlined, TabletOutlined, TeamOutlined } from "@ant-design/icons";
import axios from "../api/axios";
import { useSelector } from "react-redux";

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const Dashboard = () => {
  const user = useSelector((state) => state.user.user); 
  const userName = user?.name || user?.username || "Admin";
  const locations = user?.permissions?.locations || [];

  // Kullanıcı verisi
  const [memberCount, setMemberCount] = useState(null);
  const [inactiveMemberCount, setInactiveMemberCount] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(true);

  // Cihaz verisi
  const [deviceCount, setDeviceCount] = useState(null);
  const [inactiveDeviceCount, setInactiveDeviceCount] = useState(null);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // Rentals toplamları
  const [dailyTotal, setDailyTotal] = useState(0);
  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [loadingRentals, setLoadingRentals] = useState(false);

  // Kullanıcıları çek
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await axios.post("/members/listByMembers", { 
          tenantId: "62a1e7efe74a84ea61f0d588" 
        });
        setMemberCount(response.data.count);
        setInactiveMemberCount(response.data.inactiveCount || 0);
      } catch (error) {
        console.error("Kullanıcı sayısı alınamadı:", error.response || error);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  // Cihazları çek
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get("/devices"); 
        const devices = response.data || [];
        setDeviceCount(devices.length);
        const inactiveDevices = devices.filter(d => d.status === 'passive');
        setInactiveDeviceCount(inactiveDevices.length);
      } catch (error) {
        console.error("Cihaz sayısı alınamadı:", error.response || error);
      } finally {
        setLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  // Rentals toplamını çek
  const fetchRentals = async (type) => {
    setLoadingRentals(true);

    const today = new Date();
    let startDate, endDate;

    if(type === "daily") {
      startDate = today.toISOString().split("T")[0];
      endDate = startDate;
    } else if(type === "weekly") {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      startDate = start.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    } else if(type === "monthly") {
      const start = new Date(today);
      start.setMonth(today.getMonth() - 1);
      startDate = start.toISOString().split("T")[0];
      endDate = today.toISOString().split("T")[0];
    }

    const payload = { startDate, endDate, cities: locations };

    try {
      const response = await axios.post(
        "rentals/find/dayDayByCityAndDate/withCityFilter",
        payload
      );
      const rentals = response.data || [];
      const total = rentals.reduce((sum, item) => sum + Number(item.total || 0), 0);

      if(type === "daily") setDailyTotal(total);
      else if(type === "weekly") setWeeklyTotal(total);
      else if(type === "monthly") setMonthlyTotal(total);

    } catch (error) {
      console.error(`[${type}] Rentals fetch error:`, error.response || error);
    } finally {
      setLoadingRentals(false);
    }
  };

  useEffect(() => {
    if(locations.length > 0){
      fetchRentals("daily");
      fetchRentals("weekly");
      fetchRentals("monthly");
    }
  }, [locations]);

  const cardStyle = { borderRadius: 12, boxShadow: "0 6px 16px rgba(0,0,0,0.1)", minHeight: 140 };
  const iconStyle = { fontSize: 48, color: '#1890ff' };

  return (
    <Row gutter={[24, 24]} style={{ padding: 24 }}>
      {/* Hoşgeldiniz Kartı */}
      <Col xs={24}>
        <Card style={{ ...cardStyle, backgroundColor: '#e6f7ff' }}>
          <Title level={3}>Hoşgeldiniz, {userName}!</Title>
          <Text type="secondary">Bugün güzel bir gün dileriz 🙂</Text>
        </Card>
      </Col>

      {/* Kullanıcı Kartı */}
      <Col xs={24} sm={12} md={12} lg={6}>
        <Card hoverable style={cardStyle} bodyStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>Kullanıcılar</Title>
            {loadingMembers ? <Spin /> : (
              <>
                <Text style={{ fontSize: 20, fontWeight: 500, color: '#1890ff' }}>Toplam: {memberCount}</Text>
                <br />
                <Text style={{ fontSize: 20, fontWeight: 500, color: '#ff4d4f' }}>Pasif: {inactiveMemberCount}</Text>
              </>
            )}
          </div>
          <UserOutlined style={iconStyle} />
        </Card>
      </Col>

      {/* Cihaz Kartı */}
      <Col xs={24} sm={12} md={12} lg={6}>
        <Card hoverable style={cardStyle} bodyStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>Cihazlar</Title>
            {loadingDevices ? <Spin /> : (
              <>
                <Text style={{ fontSize: 20, fontWeight: 500, color: '#1890ff' }}>Toplam: {deviceCount}</Text>
                <br />
                <Text style={{ fontSize: 20, fontWeight: 500, color: '#ff4d4f' }}>Pasif: {inactiveDeviceCount}</Text>
              </>
            )}
          </div>
          <TabletOutlined style={iconStyle} />
        </Card>
      </Col>

      {/* Rentals Kartı */}
      <Col xs={24} sm={12} md={12} lg={6}>
        <Card hoverable style={cardStyle}>
          <Tabs defaultActiveKey="daily" onChange={(key) => fetchRentals(key)}>
            <TabPane tab="Günlük" key="daily">
              {loadingRentals ? <Spin /> : <Title level={3}>{dailyTotal}</Title>}
            </TabPane>
            <TabPane tab="Haftalık" key="weekly">
              {loadingRentals ? <Spin /> : <Title level={3}>{weeklyTotal}</Title>}
            </TabPane>
            <TabPane tab="Aylık" key="monthly">
              {loadingRentals ? <Spin /> : <Title level={3}>{monthlyTotal}</Title>}
            </TabPane>
          </Tabs>
        </Card>
      </Col>

      {/* Ekip Kartı */}
      <Col xs={24} sm={12} md={12} lg={6}>
        <Card hoverable style={cardStyle} bodyStyle={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title level={4}>Toplam Ekip</Title>
            <Text type="secondary">Henüz veri yok</Text>
          </div>
          <TeamOutlined style={iconStyle} />
        </Card>
      </Col>
    </Row>
  );
};

export default Dashboard;
