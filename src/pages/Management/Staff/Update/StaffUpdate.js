import React, { useEffect, useState } from "react";
import { Tabs, Form, Input, Button, Radio, DatePicker, message, Card, Row, Col, Spin, Table, Tag } from "antd";
import axios from "../../../../api/axios";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import utc from 'dayjs/plugin/utc';
import { Link } from "react-router-dom";

const { TabPane } = Tabs;
const { TextArea } = Input;


dayjs.extend(utc);
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



    const permissionLabels = {
        showHeatMap: "Isı Haritası Görüntüleme",
        addDevice: "Cihaz Oluşturma",
        addGift: "Hediye Ekleme",
        showReport: "Rapor (Ciro) Görüntüleme",
        sendNotification: "Bildirim Gönderme",
        rentalUpdate: "Kiralama Güncelleme",
        audioRecording: "Ses Kaydı",
        showRental: "Kiralama Görüntüleme",
        updateDevice: "Cihaz Güncelleme",
        showSupport: "Destek Kaydı Görüntüleme",
        updatePassiveType: "Kullanıcı Tipi Güncelleme",
        addPrice: "Fiyat Ekleme",
        showCampaign: "Kampanya Görüntüleme",
        staffRecord: "Batarya Değişim Kayıtları",
        endRental: "Kiralama Sonlandırma",
        deleteDevice: "Cihaz Silme",
        updateSupport: "Destek Kaydı Durumu Güncelleme",
        showImage: "Sürüş Sonrası Görsel Görüntüleme",
        updatePrice: "Fiyat Güncelleme",
        management: "Yönetim",
        showFilter: "Filtreleme",
        showDevice: "Cihaz Görüntüleme",
        showMember: "Kullanıcı Görüntüleme",
        deleteSupport: "Destek Kaydı Silme",
        checkFraud: "Şüpheli İşlemler",
        staffCreate: "Staff Oluşturma",
        successTransactions: "Başarılı İşlemler",
        // buraya tüm izinlerini ekleyebilirsin
    };

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
                    staffDate: res.data.staffDate ? dayjs.utc(res.data.staffDate) : null,
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

    console.log(staff)


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
                    staffDate: res.data.staffDate ? dayjs.utc(res.data.staffDate) : null,
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


    const columnsSupports = [
        {
            title: "QR Kod",
            dataIndex: "qr",
            key: "qr",
            render: (qr) =>
                qr ? (
                    <Link to={`/panel/devices/detail/${qr}`}>{qr}</Link>
                ) : (
                    "-"
                ),
            sorter: (a, b) => a.qr.localeCompare(b.qr),
        },
        {
            title: "Kategori",
            dataIndex: "category",
            key: "category",
            sorter: (a, b) => a.category.localeCompare(b.category),
        },
        {
            title: "Tanım",
            dataIndex: "description",
            key: "description",
            render: (text) => <TextArea
                value={text}
                readOnly
                style={{ height: 80, resize: "none", overflow: "auto" }}
            />,
            sorter: (a, b) => a.description.localeCompare(b.description),
        },
        {
            title: "Not",
            dataIndex: "note",
            key: "note",
            render: (text) => <TextArea
                value={text}
                readOnly
                style={{ height: 80, resize: "none", overflow: "auto" }}
            />,
            sorter: (a, b) => (a.note || "").localeCompare(b.note || ""),
        },
        {
            title: "Durum",
            dataIndex: "status",
            key: "status",
            render: (status) => {
                let color = "default";
                let text = status;

                if (status === "DONE") {
                    color = "red";
                    text = "Pasif";
                } else if (status === "CONTROLLED") {
                    color = "orange";
                    text = "Beklemede";
                } else if (status === "ACTIVE") {
                    color = "Green";
                    text = "Aktif";
                }

                return <Tag color={color}>{text}</Tag>;
            },
            sorter: (a, b) => a.status.localeCompare(b.status),
        },
        {
            title: "Oluşturma Tarihi",
            dataIndex: "created_date",
            key: "created_date",
            render: (date) => dayjs.utc(date).format("DD.MM.YYYY HH.mm.ss"),
            sorter: (a, b) => new Date(a.created_date) - new Date(b.created_date),
        },
    ];

    const columnsRentalEnds = [
        {
            title: "Kullanıcı Adı",
            dataIndex: "member",
            key: "name",
            render: (member) => `${member.first_name} ${member.last_name}`,
            sorter: (a, b) => {
                const nameA = `${a.member.first_name} ${a.member.last_name}`.toLowerCase();
                const nameB = `${b.member.first_name} ${b.member.last_name}`.toLowerCase();
                return nameA.localeCompare(nameB);
            },
        },
        {
            title: "Kullanıcı GSM",
            dataIndex: ["member", "gsm"],
            key: "gsm",
            render: (gsm) =>
                gsm ? (
                    <Link to={`/panel/users?gsm=${encodeURIComponent(gsm)}`}>{gsm}</Link>
                ) : (
                    "-"
                ),
            sorter: (a, b) => (a.member.gsm || "").localeCompare(b.member.gsm || ""),
        },
        {
            title: "Cihaz QR Kodu",
            dataIndex: ["device", "qrlabel"],
            key: "qrlabel",
            render: (qr) =>
                qr ? (
                    <Link to={`/panel/devices/detail/${qr}`}>{qr}</Link>
                ) : (
                    "-"
                ),
            sorter: (a, b) => (a.device.qrlabel || "").localeCompare(b.device.qrlabel || ""),
        },
        {
            title: "Başlangıç Saati",
            dataIndex: "start",
            key: "start",
            render: (text) => dayjs.utc(text).format("YYYY-MM-DD HH:mm"),
            sorter: (a, b) => dayjs.utc(a.start).unix() - dayjs.utc(b.start).unix(),
        },
        {
            title: "Duration (dk)",
            dataIndex: "duration",
            key: "duration",
            sorter: (a, b) => a.duration - b.duration,
            render: (value) => `${Math.ceil(value / 60)} dk`
        },
        {
            title: "Toplam (₺)",
            dataIndex: "total",
            key: "total",
            render: (val) => `${val} ₺`,
            sorter: (a, b) => a.total - b.total,
        },
        {
            title: "Bitiş Saati",
            dataIndex: "end",
            key: "end",
            render: (text) => dayjs.utc(text).format("YYYY-MM-DD HH:mm"),
            sorter: (a, b) => dayjs.utc(a.end).unix() - dayjs.utc(b.end).unix(),
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
                                            <Form.Item label={permissionLabels[perm] || perm} name={perm}>
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
                        <Table
                            rowKey="_id"
                            columns={columnsSupports}
                            dataSource={staff?.staffWallet?.supports || []}
                            pagination={{ pageSize: 5 }}
                            scroll={{ x: true }}
                        />
                    </TabPane>

                    {/* 4️⃣ Sonlandırma Kayıtları */}
                    <TabPane tab="Sonlandırma Kayıtları" key="4">
                        <Form form={formSonlandirma} layout="vertical">
                            <Form.Item name="sonlandirmaKayitlari">
                                <Table
                                    dataSource={staffDone}
                                    columns={columnsRentalEnds}
                                    rowKey="_id"
                                    pagination={{ pageSize: 5 }}
                                    scroll={{ x: true }}
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
