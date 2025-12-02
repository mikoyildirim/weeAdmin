// src/layouts/MainLayout.js
import React, { useState } from "react";
import { Layout, Menu, Avatar, Dropdown, Button, Grid } from "antd";
import {
  DashboardOutlined,
  FileTextOutlined,
  FundOutlined,
  CarOutlined,
  TeamOutlined,
  PhoneOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice.js";

const { Sider, Content, Header } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = () => setCollapsed(!collapsed);

  const menuItems = [
    { key: "/panel/dashboard", icon: <DashboardOutlined />, label: "Ana Sayfa" },
    {
      key: "raporlar",
      icon: <FileTextOutlined />,
      label: "Raporlar",
      children: [
        { key: "/panel/reports/rentals", label: "Kiralamalar Raporu" },
        { key: "/panel/reports/weepuan", label: "Wee Puan Raporu" },
        { key: "/panel/reports/transactions", label: "Yükleme Raporu" },
        { key: "/panel/reports/staff", label: "Batarya Değişim Raporu" },
      ],
    },
    {
      key: "harita",
      icon: <FundOutlined />,
      label: "Harita İşlemleri",
      children: [
        { key: "/panel/maps/active", label: "Aktif Haritası" },
        { key: "/panel/maps/passive", label: "Pasif Haritası" },
        { key: "/panel/maps/lost", label: "Kayıp Haritası" },
        { key: "/panel/maps/polygons", label: "Haritalar" },
        { key: "/panel/maps/heatmap", label: "Kullanım Sıklığı Haritası" },
        { key: "/panel/maps/distribution", label: "Scooter Dağılım Önerisi" },
      ],
    },
    {
      key: "devices",
      icon: <CarOutlined />,
      label: "Cihaz İşlemleri",
      children: [
        { key: "/panel/devices/active", label: "Aktif Cihazlar" },
        { key: "/panel/devices/passive", label: "Pasif Cihazlar" },
        { key: "/panel/devices/unused", label: "Az Kullanılan Cihazlar" },
        { key: "/panel/devices/all", label: "Cihaz Yönetimi" },
      ],
    },
    {
      key: "users",
      icon: <TeamOutlined />,
      label: "Kullanıcı İşlemleri",
      children: [
        { key: "/panel/users", label: "Kullanıcılar" },
        { key: "/panel/users/negative", label: "Borçlu Kullanıcılar" },
      ],
    },
    { key: "/panel/calls", icon: <PhoneOutlined />, label: "Çağrı İşlemleri" },
    { key: "/panel/supports", icon: <InfoCircleOutlined />, label: "Destek Kayıtları" },
    {
      key: "management",
      icon: <SettingOutlined />,
      label: "Yönetim İşlemleri",
      children: [
        { key: "/panel/management/campaigns/listCampaigns", label: "Kampanyalar" },
        { key: "/panel/management/financial", label: "Yönetim İşlemleri" },
        { key: "/panel/management/notifications", label: "Bildirimler" },
        { key: "/panel/management/staff", label: "Personel Yönetimi" },
        { key: "/panel/management/fraud", label: "Şüpheli İşlemler" },
      ],
    },
    { key: "/panel/rentals", icon: <FileTextOutlined />, label: "Aktif Kiralamalar" },
  ];

  const handleMenuClick = ({ key }) => navigate(key);

  const userMenu = {
    items: [
      {
        key: "logout",
        label: "Çıkış Yap",
        icon: <LogoutOutlined />,
        onClick: () => {
          dispatch(logout());
          navigate("/login");
        },
      },
    ],
  };

  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md; // mobile için true

  const siderWidth = collapsed
    ? (isMobile ? 0 : 80)   // mobile: tamamen kaybolur, desktop: daralır
    : 220;

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* SABİT SİDEBAR */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        collapsedWidth={isMobile ? 0 : 80}
        style={{
          background: "#001529",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          overflow: "auto",
          transition: "all 0.2s ease",
        }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 22,
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          WeeScooter
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={handleMenuClick}
          items={menuItems}
        />
      </Sider>

      <Layout style={{ marginLeft: siderWidth, transition: "margin-left 0.2s" }}>
        {/* SABİT HEADER */}
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
            position: "fixed",
            top: 0,
            left: siderWidth,
            transition: "left 0.2s",
            right: 0,
            height: 64,
            zIndex: 10,
            transition: "left 0.2s",
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleCollapsed}
            style={{ fontSize: 18, marginRight: 16 }}
          />
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer", gap: 8 }}>
              <Avatar style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />} />
              <span>{user?.name || "Admin"}</span>
            </div>
          </Dropdown>
        </Header>

        {/* KAYAN İÇERİK */}
        <Content
          style={{
            marginTop: 64,
            padding: 16,
            minHeight: "calc(100vh - 64px)",
            overflow: "auto",
            background: "#f5f5f5",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
