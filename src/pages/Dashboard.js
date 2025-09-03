import React from "react";
import { Card, Typography } from "antd";

const { Title } = Typography;

const Dashboard = () => {
let user = {};
try {
  user = JSON.parse(localStorage.getItem("user")) || {};
} catch {
  user = {};
}

const userName = user.name || "Admin";

return (
  <Card title={`Hoşgeldiniz ${userName}`}>
    <p>Kullanıcı Adı: <strong>{userName}</strong></p>
  </Card>
);


  return (
    <Card>
      <Title level={4}>Hoşgeldiniz {userName}</Title>
      <p>Burası Wee Scooter admin panelinin ana sayfası.</p>
    </Card>
  );
};

export default Dashboard;
