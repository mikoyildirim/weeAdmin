// src/pages/Login.js
import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Spin } from "antd";
import axios from "../api/axios";
import { useDispatch } from "react-redux";
import { login } from "../redux/slices/authSlice";

const { Title } = Typography;

const Login = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);


  const handleLogin = async (values) => {
    setLoading(true)
    try {
      const res = await axios.post("/users/login", values);
      dispatch(login({ user: res.data, token: res.data.accessToken }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false)
    }
  };


  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <Card style={{ width: 400 }}>
        <Title level={3} style={{ textAlign: "center" }}>
          Giriş Yap
        </Title>
        <Form name="login" onFinish={handleLogin} layout="vertical">
          <Form.Item
            label="E-posta"
            name="email"
            rules={[{ required: true, message: "Lütfen e-posta giriniz!" }]}
          >
            <Input disabled={loading} />
          </Form.Item>

          <Form.Item
            label="Şifre"
            name="password"
            rules={[{ required: true, message: "Lütfen şifre giriniz!" }]}
          >
            <Input.Password disabled={loading} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
        {loading && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <Spin tip="Giriş yapılıyor..." />
          </div>
        )}
      </Card>
    </div>
  );
};

export default Login;
