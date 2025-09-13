// src/layouts/MainLayout.js
import React, { useState } from "react";
import { Layout, Menu, Dropdown, Avatar, Button } from "antd";
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

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);

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
        { key: "/panel/management/campaigns", label: "Kampanyalar" },
        { key: "/panel/management/financial", label: "Yönetim İşlemleri" },
        { key: "/panel/management/notifications", label: "Bildirimler" },
        { key: "/panel/management/staff", label: "Personel Yönetimi" },
        { key: "/panel/management/fraud", label: "Şüpheli İşlemler" },
      ],
    },
    { key: "/panel/rentals", icon: <FileTextOutlined />, label: "Aktif Kiralamalar" },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  const userMenu = {
    items: [
      { key: "profile", label: "Profil", icon: <UserOutlined /> },
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
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        breakpoint="lg"
        collapsedWidth="0"
        theme="dark"
        width={220}
        style={{ boxShadow: "2px 0 6px rgba(0,0,0,0.1)" }}
      >
        <div
          className="logo"
          style={{
            color: "#fff",
            padding: "16px",
            fontWeight: "bold",
            fontSize: 18,
            textAlign: "center",
            borderBottom: "1px solid rgba(255,255,255,0.2)",
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
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapsed}
              style={{ fontSize: 18, marginRight: 16 }}
            />
            <span style={{ fontWeight: "bold", fontSize: 16 }}>Yönetim Paneli</span>
          </div>
          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
              <Avatar style={{ backgroundColor: "#1890ff", marginRight: 8 }} icon={<UserOutlined />} />
              <span>{user?.name || "Admin"}</span>
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: "16px", background: "#f5f6fa", minHeight: "calc(100vh - 64px)" }}>
          <div
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: "8px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              minHeight: "100%",
            }}
          >
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
