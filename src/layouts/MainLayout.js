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
import { logout } from "../store/userSlice";

const { Sider, Content, Header } = Layout;
const { useBreakpoint } = Grid;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

  const [collapsed, setCollapsed] = useState(false);
  const screens = useBreakpoint();

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
        { key: "/panel/users/negative", label: "Eksideki Kullanıcılar" },
      ],
    },
    { key: "/panel/calls", icon: <PhoneOutlined />, label: "Çağrı İşlemleri" },
    { key: "/panel/supports", icon: <InfoCircleOutlined />, label: "Destek Kayıtları" },
    {
      key: "management",
      icon: <SettingOutlined />,
      label: "Yönetim İşlemleri",
      children: [
        { key: "/panel/management/campaigns/campaigns", label: "Kampanyalar" },
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={220}
        breakpoint="lg"
        collapsedWidth={screens.lg ? 80 : 0}
        onBreakpoint={(broken) => {
          if (!broken) setCollapsed(false);
        }}
        style={{ background: "#001529" }}
      >
        <div
          style={{
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontWeight: "bold",
            fontSize: 18,
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
          style={{ borderRight: 0 }}
        />
      </Sider>

      {/* Main layout */}
      <Layout>
        {/* Header */}
        <Header
          style={{
            background: "#fff",
            padding: "0 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: 18, marginRight: 16 }}
            />
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                cursor: "pointer",
                gap: 8,
              }}
            >
              <Avatar style={{ backgroundColor: "#1890ff" }} icon={<UserOutlined />} />
              <span>{user?.name || "Admin"}</span>
            </div>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: screens.xs ? 0 : 16,
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
