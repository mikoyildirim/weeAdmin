import { useState } from "react";
import { Form, Input, Button, Select, Card, App } from "antd";
import axios from "../../../../api/axios";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const StaffCreate = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await axios.post("/staffs/create", {
        tenant: values.tenant,
        staffName: values.staffName,
        staffPassword: values.staffPassword,
        staffGsm: values.staffGsm,
        email: values.email,
      });
      message.success("Personel oluşturma başarılı.");
      navigate("/panel/management/staff");
    } catch (error) {
      const backendMessage = error.response?.data?.error?.message || "Bilinmeyen hata!";
      message.error(<> Personel oluşturulurken hata oluştu! <br />{backendMessage} </>);
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          borderRadius: "12px",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "24px" }}>
          Yeni Personel Oluştur
        </h2>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Tenant"
            name="tenant"
            initialValue="62a1e7efe74a84ea61f0d588"
            rules={[{ required: true, message: "Tenant seçiniz!" }]}
          >
            <Select>
              <Option value="62a1e7efe74a84ea61f0d588">
                62a1e7efe74a84ea61f0d588
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="İsim"
            name="staffName"
            rules={[{ required: true, message: "İsim giriniz!" }]}
          >
            <Input placeholder="Personel adı" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Email giriniz!" },
              { type: "email", message: "Geçerli bir email giriniz!" },
            ]}
          >
            <Input placeholder="ornek@mail.com" />
          </Form.Item>

          <Form.Item
            label="Şifre"
            name="staffPassword"
            rules={[{ required: true, message: "Şifre giriniz!" }]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="Telefon"
            name="staffGsm"
            rules={[{ required: true, message: "Telefon numarası giriniz!" }]}
          >
            <Input placeholder="5XXXXXXXXX" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block 
            >
              Oluştur
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default StaffCreate;
