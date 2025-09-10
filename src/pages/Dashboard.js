import React from "react";
import { Card, Typography, } from "antd";
import { useSelector } from "react-redux";
import { Flex, Radio } from 'antd';

const { Title } = Typography;
const baseStyle = {
  width: '25%',
  height: 54,
};

const Dashboard = () => {
  const user = useSelector((state) => state.user.user); // Redux'tan al
  const userName = user?.name || user?.username || "Admin";
  const [value, setValue] = React.useState('horizontal');

  return (
     <Flex>
      <Card style={{ width: '100%' }}>
        <Title level={2}>Hoşgeldiniz, {userName}!</Title>        
      </Card>

      <Card style={{ width: '100%'}}>
        <Title level={5}>Kullanıcı Bilgileri</Title>
        <p>Kullanıcı Adı: <strong>{userName}</strong></p>
      </Card>
    </Flex>
  );
};

export default Dashboard;
