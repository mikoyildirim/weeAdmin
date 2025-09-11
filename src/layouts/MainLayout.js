// src/layouts/MainLayout.js
import React from "react";
import { Layout, Menu } from "antd";
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
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Sider, Content, Header } = Layout;

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  const menuItems = [
    { key: "/panel", icon: <DashboardOutlined />, label: "AnaSayfa" },

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

    { key: "/logout", icon: <LogoutOutlined />, label: "Çıkış Yap" },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark">
        <div className="logo" style={{ color: "#fff", padding: "16px", fontWeight: "bold" }}>
          WeeScooter
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[window.location.pathname]}
          onClick={({ key }) => {
            if (key === "/logout") {
              localStorage.removeItem("token");
              navigate("/login");
            } else {
              navigate(key);
            }
          }}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 16px" }}>Yönetim Paneli</Header>
        <Content style={{ margin: "16px", background: "#fff", padding: "16px" }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
