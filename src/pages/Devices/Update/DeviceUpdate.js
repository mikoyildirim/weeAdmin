import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../../../api/axios";
import { Card, Form, Input, Select, Spin, Alert, Row, Col, Button, message } from "antd";

const { Option } = Select;

const DeviceUpdate = () => {
    const { id } = useParams();
    const [device, setDevice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

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
        setError(null);

        getDeviceById(id)
            .then((data) => {
                setDevice(data);
                form.setFieldsValue({
                    controller: data.controller,
                    tenant: data.tenant,
                    imei: data.imei,
                    gsm: data.gsm,
                    city: data.city,
                    town: data.town,
                    lockType: data.lockType,
                    status: data.status,
                    qr: data.qrlabel,
                    name: data.name,
                    key_secret: data.key_secret,
                    serial_number: data.serial_number,
                    battery: data.battery,
                    price: data.priceObject?.startPrice,
                });
            })
            .catch((err) => setError(err.message || "Bir hata oluştu"))
            .finally(() => setLoading(false));
    }, [id, form]);

    const handleSave = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const payload = {
                ...values,
            };

            delete payload.qr
            delete payload.price
            delete payload.tenant
            console.log(payload)

            await axios.patch(`/devices/${id}`, payload, {
                headers: {
                    "Content-Type": "application/json",
                    language: "tr",
                    version: "panel"
                }
            }); // PATCH ile güncelleme
            message.success("Cihaz başarıyla güncellendi!");
        } catch (err) {
            console.error(err);
            message.error("Güncelleme sırasında hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    const handleConsole = async () => {
        try {
            const values = await form.validateFields();
            //setSaving(true);

            const payload = {
                ...values,
            };
            console.log(payload)
        } catch (err) {
            console.error(err);
            message.error("Güncelleme sırasında hata oluştu.");
        }
    }

    if (loading) return <Spin tip="Yükleniyor..." />;
    if (error) return <Alert type="error" message={`Hata: ${error}`} />;

    return (
        <Card title={`Cihaz Güncelle - ${id}`} style={{ maxWidth: 900, margin: "20px auto" }}>
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
                                <Option value="KİLİT">KİLİT</Option>
                                <Option value="KİLİTSİZ">KİLİTSİZ</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="DURUMU *" name="status">
                            <Select>
                                <Option value="HAZIR">HAZIR</Option>
                                <Option value="BAĞLANMADI">BAĞLANMADI</Option>
                                <Option value="BAĞLANDI">BAĞLANDI</Option>
                                <Option value="KİRALAMADA">KİRALAMADA</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={12}>
                        <Form.Item label="QR *" name="qr">
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
