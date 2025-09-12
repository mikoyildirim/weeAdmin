// src/pages/Login.js
import React, { useState } from "react";
import { Form, Input, Button, message, Card, Typography, Spin } from "antd";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "../store/userSlice";

const { Title } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    setLoading(true);

    try {
      const response = await axios.post("/users/login", values);
      console.log("Login response data:", response.data);

      if (response.status === 200 && response.data.accessToken) {
        // Yapay 2-3 saniye bekleme
        setTimeout(() => {
          dispatch(
            setUser({
              user: {
                name: response.data.name,
                email: response.data.email,
                gsm: response.data.gsm,
                user_type: response.data.user_type,
                permissions: response.data.permissions,
              },
              token: response.data.accessToken,
              refreshToken: response.data.refreshToken,
            })
          );

          message.success("Giriş başarılı!");
          navigate("/panel/dashboard");
          setLoading(false);
        }, 1500); // 1.5 saniye bekleme sağlıkı veri için
      } else {
        message.error("Giriş başarısız!");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      if (error.response?.status === 401) {
        message.error("Kullanıcı adı veya şifre hatalı!");
      } else {
        message.error("Sunucu hatası. Lütfen tekrar deneyin.");
      }
      setLoading(false);
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
        <Form name="login" onFinish={onFinish} layout="vertical">
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
