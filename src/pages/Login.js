import React from "react";
import { Form, Input, Button, message, Card, Typography } from "antd";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../store/userSlice";

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

const onFinish = async (values) => {
  try {
    const response = await axios.post("/users/login", values);
    const user = response.data.user || response.data;
    const token = response.data.token;

    dispatch(loginSuccess({ user, token }));

    message.success(`Hoşgeldiniz ${user.name || "Kullanıcı"}`);
    navigate("/panel");  // ✅ Dashboard'a yönlendir
  } catch (err) {
    message.error("Email veya şifre hatalı");
    console.error(err);
  }
};

  return (
    <div style={{display:"flex",justifyContent:"center",alignItems:"center",height:"100vh",background:"#f0f2f5",padding:16}}>
      <Card style={{ width: 400, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}>
        <Title level={3} style={{ textAlign: "center", marginBottom: 24 }}>
          Wee Scooter Panel
        </Title>

        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: "Lütfen email girin" }]}
          >
            <Input placeholder="Email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Şifre"
            rules={[{ required: true, message: "Lütfen şifre girin" }]}
          >
            <Input.Password placeholder="Şifre" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
