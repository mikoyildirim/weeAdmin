import React, { useEffect, useState } from "react";
import { Tabs, Form, Input, Button, Radio, DatePicker, message, Card } from "antd";
import axios from "../../../../api/axios";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/tr";
const { TabPane } = Tabs;

dayjs.locale("tr");
const StaffUpdate = () => {
    const { id } = useParams(); // URL'den staff id al
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState(null);
    const [permissions, setPermissions] = useState({});

    const [formBilgiler] = Form.useForm();
    const [formYetkiler] = Form.useForm();



    console.log(staff)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`/staffs/${id}`);
                setStaff(res.data);
                setPermissions(res.data.user.permissions || {});
                formBilgiler.setFieldsValue({
                    staffName: res.data.staffName,
                    email: res.data.user.email,
                    staffGsm: res.data.staffGsm,
                    staffDate: res.data.staffDate ? dayjs(res.data.staffDate) : null,
                    status: res.data.user.active ? "true" : "false",
                });
                formYetkiler.setFieldsValue(res.data.user.permissions || {});
            } catch (error) {
                message.error("Personel bilgileri alınamadı!");
            }
        };
        fetchData();
    }, [id]);

    // 📌 Bilgiler Güncelleme
    const updateBilgiler = async (values) => {
        setLoading(true);
        try {
            const payload = {
                staffName: values.staffName,
                email: values.email,
                staffDate: values.staffDate,
            };

            if (values.staffPassword) {
                payload.staffPassword = values.staffPassword;
            }

            await axios.patch(`/staffs/update/password/${id}`, payload);
            message.success("Bilgiler başarıyla güncellendi!");
        } catch (error) {
            alert("Hata: " + (error.response?.data?.message || "Bilinmeyen hata!"));
            message.error("Bilgiler güncellenemedi!");
        }
        setLoading(false);
    };

    // 📌 Yetkiler Güncelleme
    const updatePermissions = async (values) => {
        setLoading(true);
        try {
            await axios.patch(`/users/update/permissions/${id}`, values);
            message.success("Yetkiler başarıyla güncellendi!");
        } catch (error) {
            alert("Hata: " + (error.response?.data?.message || "Bilinmeyen hata!"));
            message.error("Yetkiler güncellenemedi!");
        }
        setLoading(false);
    };

    if (!staff) return <p>Yükleniyor...</p>;

    return (
        <Card style={{ padding: "16px", borderRadius: "12px" }}>
            <h2 style={{ marginBottom: "20px" }}>Personel Güncelle</h2>

            <Tabs defaultActiveKey="1">
                {/* 1️⃣ Bilgiler */}
                <TabPane tab="Bilgiler" key="1">
                    <Form form={formBilgiler} layout="vertical" onFinish={updateBilgiler}>
                        <Form.Item label="Kullanıcı Durumu" name="status">
                            <Radio.Group>
                                <Radio value="true">Aktif</Radio>
                                <Radio value="false">Pasif</Radio>
                            </Radio.Group>
                        </Form.Item>

                        <Form.Item
                            label="İsim"
                            name="staffName"
                            rules={[{ required: true, message: "İsim giriniz!" }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[
                                { required: true, message: "Email giriniz!" },
                                { type: "email", message: "Geçerli bir email giriniz!" },
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item label="Şifre" name="staffPassword">
                            <Input.Password placeholder="Değiştirmek istemiyorsan boş bırak" />
                        </Form.Item>

                        <Form.Item label="Telefon" name="staffGsm">
                            <Input disabled style={{ color: "black" }} />
                        </Form.Item>

                        <Form.Item label="İşe Başlama Tarihi" name="staffDate">
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Güncelle
                            </Button>
                        </Form.Item>
                    </Form>
                </TabPane>

                {/* 2️⃣ Yetkiler */}
                <TabPane tab="Yetkiler" key="2">
                    <Form form={formYetkiler} layout="vertical" onFinish={updatePermissions}>
                        {Object.keys(permissions).map((perm) => (
                            <Form.Item label={perm} name={perm} key={perm}>
                                <Radio.Group>
                                    <Radio value={true}>Aktif</Radio>
                                    <Radio value={false}>Pasif</Radio>
                                </Radio.Group>
                            </Form.Item>
                        ))}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Güncelle
                            </Button>
                        </Form.Item>
                    </Form>
                </TabPane>

                {/* 3️⃣ Destek Kayıtları */}
                <TabPane tab="Destek Kayıtları" key="3">
                    <p>📌 Burada destek kayıtlarını listeleyeceğiz (Table ile).</p>
                </TabPane>

                {/* 4️⃣ Sonlandırma Kayıtları */}
                <TabPane tab="Sonlandırma Kayıtları" key="4">
                    <p>📌 Burada sonlandırma kayıtlarını listeleyeceğiz (Table ile).</p>
                </TabPane>
            </Tabs>
        </Card>
    );
};

export default StaffUpdate;
