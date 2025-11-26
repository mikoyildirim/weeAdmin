import React, { useEffect, useState, useRef, Children } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../../api/axios";
import { Card, Form, Input, Select, Spin, Row, Col, Button, Modal } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const { Option } = Select;

const DeviceUpdate = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [locationModalOpen, setLocationModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState({ lat: null, lng: null });

    const [deviceLocation, setDeviceLocation] = useState(null);

    const mapRef = useRef(null);
    const markerRef = useRef(null);

    const [form] = Form.useForm();
    const navigate = useNavigate();

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    });



    // Cihaz Bilgisi Çekme
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

                // cihaz konumu varsa haritada başlangıç olarak kullanacağız
                if (data.last_location?.location?.coordinates) {
                    setDeviceLocation({
                        lat: data.last_location?.location?.coordinates[1],
                        lng: data.last_location?.location?.coordinates[0],
                    });
                }
            })
            .catch(() => alert("Cihaz verileri alınırken bir hata oluştu"))
            .finally(() => setLoading(false));
    }, [id, form]);


    // Konum Kaydetme İşlemi
    const handleLocationSave = async () => {
        try {
            const response = await axios.post(`/devices/${id}/updatelocation`, {
                last_location: {
                    location: {
                        type: "Point",
                        coordinates: [selectedLocation.lng, selectedLocation.lat]
                    }
                }
            });
            console.log("cihaz konumu güncellendi.")
            return response.data;
        } catch (error) {
            console.error("Konum güncelleme hatası:", error);
            throw error;
        }
    };


    // Harita Oluşturma
    useEffect(() => {
        if (!locationModalOpen) return;

        // Modal açılınca map oluştur
        setTimeout(() => {
            if (mapRef.current) return;

            mapRef.current = L.map("map-container", {
                center: deviceLocation
                    ? [deviceLocation.lat, deviceLocation.lng]
                    : [39.75, 37.01], // Sivas merkez default
                zoom: 14,
            });

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(mapRef.current);

            // Marker ekle (başlangıç konumu cihaz konumu)
            const startPos = deviceLocation
                ? [deviceLocation.lat, deviceLocation.lng]
                : [39.75, 37.01];

            markerRef.current = L.marker(startPos, { draggable: false }).addTo(mapRef.current);

            // Haritada tıklayınca marker taşı
            mapRef.current.on("click", (e) => {
                const { lat, lng } = e.latlng;
                markerRef.current.setLatLng([lat, lng]);
                setSelectedLocation({ lat, lng });
            });
        }, 300); // modal render zamanlaması için
    }, [locationModalOpen]);


    // Modal kapanınca map destroy
    useEffect(() => {
        if (!locationModalOpen && mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    }, [locationModalOpen]);



    const handleSave = async () => {
        setLoading(true);
        try {
            const values = await form.validateFields();
            setSaving(true);

            const { tenant, price, ...payload } = values;
            // burada price değişikliği yapılmaması için JSON içerisinden eklemiyoruz
            // burada tenant değişikliği yapılmaması için JSON içerisinden eklemiyoruz

            await axios.patch(`/devices/${id}`, payload, {}); // PATCH ile güncelleme

            navigate(`/panel/devices/all`);
        } catch (err) {
            alert(`Güncelleme sırasında bir hata oluştu.\n${err.response.data.error.message}`);
        } finally {
            setSaving(false);
            setLoading(false);
        }
    };


    return (
        <Card title={`Cihaz Güncelle - ${id}`} style={{ maxWidth: 900, margin: "20px auto" }}>

            <Spin spinning={loading} tip="Yükleniyor..." size="large" >
                <Button style={{marginBottom:16}} type="primary" onClick={() => setLocationModalOpen(true)}>Cihaz Konumunu Güncelle</Button>
                {/* KONUM GÜNCELLEME MODALI */}
                <Modal
                    open={locationModalOpen}
                    title="Harita Üzerinden Konum Seç"
                    onCancel={() => setLocationModalOpen(false)}
                    width={800}
                    footer={[
                        <Button key="cancel" onClick={() => setLocationModalOpen(false)}>Kapat</Button>,
                        <Button key="save" type="primary" onClick={handleLocationSave}>Kaydet</Button>
                    ]}
                >
                    <div id="map-container" style={{ height: "70vh", width: "100%" }}></div>
                </Modal>

                {/* FORM */}
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
                                <Select>
                                    <Option value="SIVAS">SIVAS</Option>
                                    <Option value="WES">WES</Option>
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
                                    <Option value="MAINTENANCE">BAKIMDA</Option>
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
            </Spin>


        </Card>
    );
};

export default DeviceUpdate;
