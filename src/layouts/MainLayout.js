import React, { useState } from "react";
import { Layout, Menu, Dropdown, Avatar } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  NotificationOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useNavigate, Outlet } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    user = {};
  }

  const userName = user.name || "Admin";

  const menuItems = [
    { key: "dashboard", label: "Dashboard", icon: <DashboardOutlined />, path: "/" },
    { key: "users", label: "Users", icon: <UserOutlined />, path: "/users" },
    { key: "notifications", label: "Notifications", icon: <NotificationOutlined />, path: "/notifications" },
  ];

  const userMenu = (
    <Menu>
      <Menu.Item
        key="logout"
        icon={<LogoutOutlined />}
        onClick={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }}
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
        <div style={{ color: "white", padding: "16px", fontSize: "18px" }}>Wee Scooter</div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[window.location.pathname]}
          onClick={({ key }) => {
            const item = menuItems.find((i) => i.key === key);
            if (item) navigate(item.path);
          }}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header style={{ background: "#fff", padding: "0 16px", display: "flex", justifyContent: "flex-end" }}>
          <Dropdown overlay={userMenu}>
            <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Avatar style={{ marginRight: 8 }} />
              {userName}
            </div>
          </Dropdown>
        </Header>
        <Content style={{ margin: "16px" }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
