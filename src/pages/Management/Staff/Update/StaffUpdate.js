import React, { useEffect, useState } from "react";
import { Tabs, Form, Input, Button, Radio, DatePicker, message, Card, Row, Col, Spin, Table } from "antd";
import axios from "../../../../api/axios";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/tr";
const { TabPane } = Tabs;

dayjs.locale("tr");
const StaffUpdate = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState(null);
    const [permissions, setPermissions] = useState({});

    const [formBilgiler] = Form.useForm();
    const [formYetkiler] = Form.useForm();


    const [formSonlandirma] = Form.useForm();
    const [staffDone, setStaffDone] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/staffs/${id}`);
                setStaff(res.data);
                setPermissions(res.data.user.permissions || {});
                formBilgiler.setFieldsValue({
                    staffName: res.data.staffName,
                    email: res.data.user.email,
                    staffGsm: res.data.staffGsm,
                    staffDate: res.data.staffDate ? dayjs(res.data.staffDate) : null,
                    status: res.data.user.passiveType,
                });
                formYetkiler.setFieldsValue(res.data.user.permissions || {});

                // ✅ Sonlandırma kayıtlarını al
                if (res.data?.user?._id) {
                    const staffDoneRes = await axios.get(`/rentals/staffDone/${res.data.user._id}`);
                    setStaffDone(staffDoneRes.data || []);

                    // formSonlandirma içine de setle
                    formSonlandirma.setFieldsValue({
                        sonlandirmaKayitlari: staffDoneRes.data || [],
                    });

                    console.log("Sonlandırma kayıtları:", staffDoneRes.data);
                }
            } catch (error) {
                message.error("Veri alınamadı!");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const res = await axios.get(`/staffs/${id}`);
                setStaff(res.data);
                setPermissions(res.data.user.permissions || {});
                formBilgiler.setFieldsValue({
                    staffName: res.data.staffName,
                    email: res.data.user.email,
                    staffGsm: res.data.staffGsm,
                    staffDate: res.data.staffDate ? dayjs(res.data.staffDate) : null,
                    status: res.data.user.passiveType
                });
                formYetkiler.setFieldsValue(res.data.user.permissions || {});
            } catch (error) {
                message.error("Personel bilgileri alınamadı!");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const updateBilgiler = async (values) => {
        setLoading(true);
        try {
            const payload = {
                staffName: values.staffName,
                email: values.email,
                staffDate: values.staffDate,
            };
            if (values.staffPassword) payload.staffPassword = values.staffPassword;

            handlePassiveType(values.status);
            await axios.patch(`/staffs/update/password/${id}`, payload);
            message.success("Bilgiler başarıyla güncellendi!");
        } catch (error) {
            message.error("Bilgiler güncellenemedi!");
        } finally {
            setLoading(false);
        }
    };

    const updatePermissions = async (values) => {
        setLoading(true);
        try {
            await axios.patch(`/users/update/permissions/${staff?.user?._id}`, values);
            message.success("Yetkiler başarıyla güncellendi!");
        } catch (error) {
            message.error("Yetkiler güncellenemedi!");
        } finally {
            setLoading(false);
        }
    };

    const handlePassiveType = (passiveType) => {
        setLoading(true);
        axios.post("/users/update/active/one/panel", {
            active: passiveType === "NONE",
            gsm: staff.staffGsm,
            passiveType: passiveType,
        })
            .then(() => message.success("Kullanıcı durumu başarıyla güncellendi!"))
            .catch(() => message.error("Durum güncellenemedi!"))
            .finally(() => setLoading(false));
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // 1️⃣ Staff bilgileri çek
                const res = await axios.get(`/staffs/${id}`);
                setStaff(res.data);
                setPermissions(res.data.user.permissions || {});
                formBilgiler.setFieldsValue({
                    staffName: res.data.staffName,
                    email: res.data.user.email,
                    staffGsm: res.data.staffGsm,
                    staffDate: res.data.staffDate ? dayjs(res.data.staffDate) : null,
                    status: res.data.user.passiveType
                });
                formYetkiler.setFieldsValue(res.data.user.permissions || {});

                // 2️⃣ Sonlandırma kayıtlarını çek (staffDone)
                if (res.data?.user?._id) {
                    const staffDoneRes = await axios.get(`/rentals/staffDone/${res.data.user._id}`);
                    console.log("✅ staffDone verisi:", staffDoneRes.data);
                }

            } catch (error) {
                console.error("❌ Hata:", error);
                message.error("Personel bilgileri alınamadı!");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);



    const columnsSonlandirma = [
        {
            title: "Kullanıcı Adı",
            dataIndex: "member",
            key: "name",
            render: (member) => `${member.first_name} ${member.last_name}`,
        },
        {
            title: "Kullanıcı GSM",
            dataIndex: ["member", "gsm"],
            key: "gsm",
        },
        {
            title: "Cihaz QR Kodu",
            dataIndex: ["device", "qrlabel"],
            key: "qrlabel",
        },
        {
            title: "Başlangıç Saati",
            dataIndex: "start",
            key: "start",
            render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
        },
        {
            title: "Duration (dk)",
            dataIndex: "duration",
            key: "duration",
        },
        {
            title: "Toplam (₺)",
            dataIndex: "total",
            key: "total",
            render: (val) => `${val} ₺`,
        },
        {
            title: "Bitiş Saati",
            dataIndex: "end",
            key: "end",
            render: (text) => dayjs(text).format("YYYY-MM-DD HH:mm"),
        },
    ];

    if (!staff) return <Spin spinning={true}><p>Yükleniyor...</p></Spin>;




    return (
        <Spin spinning={loading} tip="Yükleniyor...">
            <Card style={{ padding: "16px", borderRadius: "12px" }}>
                <h2 style={{ marginBottom: "20px" }}>Personel Güncelle: {staff.staffName}</h2>
                <Tabs defaultActiveKey="1">
                    {/* Bilgiler */}
                    <TabPane tab="Bilgiler" key="1">
                        <Form form={formBilgiler} layout="vertical" onFinish={updateBilgiler}>
                            <Form.Item label="Kullanıcı Durumu" name="status">
                                <Radio.Group>
                                    <Radio value="NONE">Aktif</Radio>
                                    <Radio value="DELETED">Pasif</Radio>
                                </Radio.Group>
                            </Form.Item>
                            <Button type="primary" htmlType="submit">Güncelle</Button>

                            <Form.Item label="İsim" name="staffName" rules={[{ required: true, message: "İsim giriniz!" }]}>
                                <Input />
                            </Form.Item>

                            <Form.Item label="Email" name="email" rules={[
                                { required: true, message: "Email giriniz!" },
                                { type: "email", message: "Geçerli bir email giriniz!" },
                            ]}>
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
                                <Button type="primary" htmlType="submit">Güncelle</Button>
                            </Form.Item>
                        </Form>
                    </TabPane>

                    {/* Yetkiler */}
                    <TabPane tab="Yetkiler" key="2">
                        <Form form={formYetkiler} layout="vertical" onFinish={updatePermissions}>
                            <Row gutter={[16, 16]}>
                                {Object.keys(permissions)
                                    .filter((perm) => typeof permissions[perm] === "boolean" && perm !== "createCampaign")
                                    .map((perm) => (
                                        <Col xs={24} sm={12} md={12} lg={6} key={perm}>
                                            <Form.Item label={perm} name={perm}>
                                                <Radio.Group>
                                                    <Radio value={true}>Aktif</Radio>
                                                    <Radio value={false}>Pasif</Radio>
                                                </Radio.Group>
                                            </Form.Item>
                                        </Col>
                                    ))}
                            </Row>
                            <Form.Item>
                                <Button type="primary" htmlType="submit">Güncelle</Button>
                            </Form.Item>
                        </Form>
                    </TabPane>
                    {/* 3️⃣ Destek Kayıtları */}
                    <TabPane tab="Destek Kayıtları" key="3">
                        <p>📌 Burada destek kayıtlarını listeleyeceğiz (Table ile).</p>
                    </TabPane>

                    {/* 4️⃣ Sonlandırma Kayıtları */}
                    <TabPane tab="Sonlandırma Kayıtları" key="4">
                        <Form form={formSonlandirma} layout="vertical">
                            <Form.Item name="sonlandirmaKayitlari">
                                <Table
                                    dataSource={staffDone}
                                    columns={columnsSonlandirma}
                                    rowKey="_id"
                                    pagination={{ pageSize: 5 }}
                                />
                            </Form.Item>
                        </Form>
                    </TabPane>
                </Tabs>
            </Card>
        </Spin>
    );
};

export default StaffUpdate;
