import React, { useEffect, useState } from "react";
import axios from "../../../api/axios";
import { Card, Form, Input, Select, Spin, Row, Col, Button } from "antd";
const { Option } = Select;

const DeviceUpdate = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form] = Form.useForm();

    const handleCreate = async () => {
        setLoading(true)
        try {
            const values = await form.validateFields();
            setSaving(true);

            const payload = { ...values };
            // burada price değişikliği yapılmaması için JSON içerisinden eklemiyoruz
            // burada tenant değişikliği yapılmaması için JSON içerisinden eklemiyoruz
            console.log(payload)

            await axios.post(`/devices`, payload)
                .then(res => {
                    console.log(res)
                    alert("Cihaz başarıyla oluşturuldu!")
                })
                .catch(err => {
                    console.log(err)
                    alert("Cihaz oluşturulamadı!")
                })


        } catch (err) {
            //console.error(err.response.data.error.message);
            //alert(`Cihaz oluşturma sırasında bir hata oluştu.\n${err.response.data.error.message}`)
        } finally {
            setSaving(false);
            setLoading(false)
        }
    };



    return (
        <Card title={`Cihaz Oluştur`} style={{ maxWidth: 900, margin: "20px auto" }}>

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
                                <Option value="TELTONIKA">TELTONIKA</Option>
                                <Option value="OMNI">OMNI</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="TENANT *" name="tenant">
                            <Select>
                                <Option value="62a1e7efe74a84ea61f0d588">62a1e7efe74a84ea61f0d588</Option>
                            </Select>
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
                            <Select>
                                <Option value="SIVAS">SIVAS</Option>
                                <Option value="ELAZIG">ELAZIG</Option>
                                <Option value="BURSA">BURSA</Option>
                                <Option value="ANTALYA">ANTALYA</Option>
                                <Option value="MANAVGAT">MANAVGAT</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="İLÇE *" name="town">
                            <Select>
                                <Option value="MERKEZ">MERKEZ</Option>
                                <Option value="INEGOL">INEGOL</Option>
                                <Option value="WES">WES</Option>
                                <Option value="ANTALYA">ANTALYA</Option>
                            </Select>
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
                </Row>

                <Button type="primary" onClick={handleCreate} loading={saving}>
                    Kaydet
                </Button>
            </Form>
        </Card>
    );
};

export default DeviceUpdate;
