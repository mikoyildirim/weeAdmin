import React, { useState } from "react";
import { Input, Button, Tabs, Card, Form, message } from "antd";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";
// Örnek dummy data (normalde API'den gelir)
const dummyUsers = [
  {
    phone: "5551234567",
    name: "Murat Şahin",
    email: "murat@example.com",
    nationality: "TR",
    city: "SIVAS",
    uploads: ["Dosya1.pdf", "Fotoğraf.png"],
    rentals: ["Scooter A", "Scooter B"],
  },
  {
    phone: "5339876543",
    name: "Ahmet Yılmaz",
    email: "ahmet@example.com",
    uploads: ["Video.mp4"],
    rentals: ["Scooter X"],
  },
];



const Users = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [user, setUser] = useState(null);

  const tokenString = localStorage.getItem('token');
  const userToken = JSON.parse(tokenString);
  console.log(userToken)
  console.log(tokenString)

  const handleSearch = async (values) => {

    try {
      const response = await axios.post("/users/listByUsers", {
        gsm: values.phone,
      },
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
            "Content-Type": "application/json",
            "language": "tr-TR", // veya "en-US" gibi
            "version":"panel"
          },
        }
      );

      const user = response.data.user || response.data;

      message.success(`Hoşgeldiniz ${user.name || "Kullanıcı"}`);
      navigate("/");
    } catch (err) {
      message.error("Bu GSM' e kayıtlı kullanıcı bulunamadı.");
      console.error(err);
    }


    // const phone = form.getFieldValue("phone");
    // const foundUser = dummyUsers.find((u) => u.phone === phone);

    // if (foundUser) {
    //   setUser(foundUser);
    // } else {
    //   setUser(null);
    //   message.error("Kullanıcı bulunamadı!");
    // }
  };

  return (
    <Card title="Kullanıcı Ara">
      <Form form={form} layout="inline">
        <Form.Item
          name="phone"
          rules={[
            { required: true, message: "Telefon numarası gerekli!" },
            {
              pattern: /^[1-9][0-9]{9}$/,
              message: "Geçerli bir telefon numarası giriniz (10 haneli, başı 0 olamaz)",
            },
          ]}
        >
          <Input maxLength={10} placeholder="Telefon Numarası (5XXXXXXXXX)" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" onClick={handleSearch}>
            Ara
          </Button>
        </Form.Item>
      </Form>

      {user && (
        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "Bilgiler",
              children: (
                <Form layout="vertical">
                  <Form.Item label="Kullanıcı Adı Soyadı">
                    <Input value={user.name} disabled style={{ width: "50%", color: 'black', border: 'solid black' }} />
                  </Form.Item>
                  <Form.Item label="Kullanıcı Doğum Tarihi">
                    <Input value={user.birthDate} disabled style={{ width: "50%", color: 'black', border: 'solid black' }} />
                  </Form.Item>
                  <div style={{ width: "50%", display: 'flex', justifyContent: "center", alignItems: "center" }}>
                    <Form.Item label="Uyruk Bilgisi">
                      <Input value={user.nationality} disabled style={{ width: "50%", color: 'black', border: 'solid black' }} />
                    </Form.Item>
                    <Form.Item label="Şehir Bilgisi">
                      <Input value={user.city} disabled style={{ width: "50%", color: 'black', border: 'solid black' }} />
                    </Form.Item>
                  </div>

                  <Form.Item label="Vergi Dairesi">
                    <Input value={user.taxOffice} disabled style={{ width: "50%", color: 'black', border: 'solid black' }} />
                  </Form.Item>
                </Form>
              ),
            },
            {
              key: "2",
              label: "Yüklemeler",
              children: <p>Kullanıcı yüklemeleri burada listelenecek</p>,
            },
            {
              key: "3",
              label: "Kiralamalar",
              children: <p>Kullanıcı kiralamaları burada listelenecek</p>,
            },
          ]}
        />
      )}
    </Card>
  );
};

export default Users;