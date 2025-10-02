import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../../../api/axios";
import { Card, Form, Input, Select, Spin, Row, Col, Button} from "antd";
const { Option } = Select;

const DeviceUpdate = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [form] = Form.useForm();

    const getDeviceById = async (deviceId) => {
        try {
            const response = await axios.get(`/devices/${deviceId}`);
            return response.data;
        } catch (err) {
            console.error("Cihaz bilgisi alınamadı:", err);
            throw err;
        }
    };

    useEffect(() => {
        if (!id) return;

        setLoading(true);

        getDeviceById(id)
            .then((data) => {
                form.setFieldsValue({
                    controller: data.controller,
                    tenant: data.tenant,
                    imei: data.imei,
                    gsm: data.gsm,
                    city: data.city,
                    town: data.town,
                    lockType: data.lockType,
                    status: data.status,
                    qrlabel: data.qrlabel,
                    name: data.name,
                    key_secret: data.key_secret,
                    serial_number: data.serial_number,
                    battery: data.battery,
                    price: `Şehir: ${data?.priceObject?.name}, Başlangıç Ücreti: ${data.priceObject?.startPrice} ₺, Dakika Ücreti: ${data?.priceObject?.minutePrice} ₺`,
                });
            })
            .catch((err) => alert("Cihaz verileri alınırken bir hata oluştu"))
            .finally(() => setLoading(false));
    }, [id, form]);

    //console.log(device)

    const handleSave = async () => {
        setLoading(true)
        try {
            const values = await form.validateFields();
            setSaving(true);

            const { tenant, price, ...payload } = values;
            // burada price değişikliği yapılmaması için JSON içerisinden eklemiyoruz
            // burada tenant değişikliği yapılmaması için JSON içerisinden eklemiyoruz
            //console.log(payload)

            await axios.patch(`/devices/${id}`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    language: "tr",
                    version: "panel"
                }
            }); // PATCH ile güncelleme
            alert("Cihaz başarıyla güncellendi!")

        } catch (err) {
            console.error(err);
            alert("Güncelleme sırasında bir hata oluştu.")
        } finally {
            setSaving(false);
            setLoading(false)
        }
    };



    return (
        <Card title={`Cihaz Güncelle - ${id}`} style={{ maxWidth: 900, margin: "20px auto" }}>

            <Spin
                spinning={loading}
                tip="Yükleniyor..."
                size="large"
                style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10 }}
            />

            <Form layout="vertical" form={form}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="CONTROLLER *" name="controller">
                            <Select>
                                <Option value="TELTONICA">TELTONICA</Option>
                                <Option value="OMNI">OMNI</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="TENANT *" name="tenant">
                            <Input disabled style={{ color: "black" }} />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="IMEI *" name="imei">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="GSM *" name="gsm">
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="İL *" name="city">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="İLÇE *" name="town">
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="KİLİT TİPİ *" name="lockType">
                            <Select>
                                <Option value="BLUETOOTH">BLUETOOTH</Option>
                                <Option value="CABLE">KİLİT</Option>
                                <Option value="NONE">KİLİTSİZ</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="DURUMU *" name="status">
                            <Select>
                                <Option value="MAINTENANCE">HAZIR</Option>
                                <Option value="OFFLINE">BAĞLANMADI</Option>
                                <Option value="ONLINE">BAĞLANDI</Option>
                                <Option value="BUSY">KİRALAMADA</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="QR *" name="qrlabel">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="ADI *" name="name">
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="KİLİT KODU *" name="key_secret">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="SERİ NUMARASI *" name="serial_number">
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="BATARYA *" name="battery">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="FİYAT *" name="price">
                            <Input disabled style={{ color: "black" }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Button type="primary" onClick={handleSave} loading={saving}>
                    Kaydet
                </Button>
            </Form>
        </Card>
    );
};

export default DeviceUpdate;
