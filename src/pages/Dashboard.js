import React from "react";
import { Card, Typography, Row, Col } from "antd";
import { useSelector } from "react-redux";

const { Title } = Typography;

const Dashboard = () => {
  const user = useSelector((state) => state.user.user); // Redux'tan al
  const userName = user?.name || user?.username || "Admin";

  // Örnek veri
  const data = [
    { title: "Toplam Kullanıcı", value: 1500 },
    { title: "Aktif Kiralama", value: 300 },
    { title: "Yeni Kayıt", value: 50 },
    { title: "Toplam Satış", value: "$12,000" },
    
  ];

  return (
    <div style={{ padding: 20 }}>
      <Card style={{ marginBottom: 20 }}>
        <Title level={2}>Hoşgeldiniz, {userName}!</Title>
      </Card>

      <Row gutter={[16, 16]}>
        {data.map((item, index) => (
          <Col xs={24} sm={12} md={12} lg={6} key={index}>
            <Card>
              <Title level={5}>{item.title}</Title>
              <p style={{ fontSize: 18, fontWeight: "bold" }}>{item.value}</p>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 20 }}>
        <Title level={5}>Kullanıcı Bilgileri</Title>
        <p>Kullanıcı Adı: <strong>{userName}</strong></p>
      </Card>
    </div>
  );
};

export default Dashboard;
