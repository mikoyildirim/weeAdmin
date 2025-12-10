import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Input, Select, message, Spin } from "antd";
import { useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import axios from "../../../api/axios";
import { useIsMobile } from "../../../utils/customHooks/useIsMobile";

const { Option } = Select;

const PolygonUpdate = () => {
    const mapRef = useRef(null);
    const drawnItemsRef = useRef(null);
    const [polygonData, setPolygonData] = useState();
    const { id } = useParams();
    const { TextArea } = Input;


    const [polygon, setPolygon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [geofences, setGeofences] = useState([]);
    const [selectedCity, setSelectedCity] = useState()
    const isMobile = useIsMobile(991);



    const fetchPolygons = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/geofences");
            setGeofences(res.data[0]?.locations || []);
        } catch (err) {
            message.error("Poligonlar yüklenemedi!");
        }
        setLoading(false);
    };



    const [form] = Form.useForm();

    useEffect(() => {
        if (selectedCity) {
            form.setFieldsValue({
                name: selectedCity.name,
                ilceMernisKodu: selectedCity.ilceMernisKodu,
                type: selectedCity.type,
                status: selectedCity.status
            });
        }
    }, [selectedCity, form]);
    useEffect(() => {
        // Map oluştur
        const map = L.map(mapRef.current).setView([39.9042, 32.8594], 6);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; OpenStreetMap",
        }).addTo(map);

        const drawnItems = new L.FeatureGroup();
        drawnItemsRef.current = drawnItems;
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: true,
                polyline: false,
                rectangle: false,
                circle: false,
                marker: false,
                circlemarker: false,
            },
            edit: {
                featureGroup: drawnItems,
                edit: true,
                remove: true,
            },
        });
        map.addControl(drawControl);

        map.on("draw:created", (e) => {
            const layer = e.layer;
            drawnItems.addLayer(layer);
            const coords = layer
                .getLatLngs()[0]
                .map((latlng) => [latlng.lng, latlng.lat]);
            coords.push(coords[0]); // polygonu kapat
            setPolygonData({ type: "Polygon", coordinates: [coords] });
        });

        map.on("draw:edited", (e) => {
            const layers = e.layers;
            layers.eachLayer((layer) => {
                const coords = layer
                    .getLatLngs()[0]
                    .map((latlng) => [latlng.lng, latlng.lat]);
                coords.push(coords[0]);
                setPolygonData({ type: "Polygon", coordinates: [coords] });

            });

        });
        setPolygon(map);
    }, []);

    useEffect(() => {
        fetchPolygons();
    }, [id]);

    useEffect(() => {
        console.log(polygonData)
    }, [polygonData]);

    // Poligonları ekrana çiz
    useEffect(() => {
        if (!polygon || geofences.length === 0) return;

        const selected = geofences.find((item) => item._id === id);
        if (!selected) return;

        // GeoJSON [lng, lat] → Leaflet [lat, lng]
        const coords = selected.polygon.coordinates[0].map((c) => [c[1], c[0]]);

        // Önce eskiyi temizle
        //drawnItemsRef.current.clearLayers();

        const poly = L.polygon(coords, { color: "blue" }).addTo(drawnItemsRef.current);
        polygon.fitBounds(poly.getBounds());

        // state'e yaz
        setSelectedCity(selected)
        //setPolygonData(selected.polygon);
    }, [geofences, id, polygon]);



    const onFinish = async (values) => {
        console.log("Kaydedilecek veriler:", values, polygonData);
        setLoading(true);

        if (!polygonData) {
            setLoading(false);
            alert("Önce poligon çizmelisiniz!");
            return;
        }
        try {
            console.log(polygonData)
            await axios.patch(`/geofences/updatelocation/${id}`, {
                ...values,
                location_id: id,
                polygon: polygonData,
                brand: "WeeScooter",
                white_label: true,
                percentage: 50,
                start_price: 0,
                price: 1.99,
                start: new Date().toISOString(),
                end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
            })
                .then((res) => console.log(res.data))
            setLoading(false);
            alert("Poligon başarıyla oluşturuldu!");
        } catch (err) {
            console.error(err);
            setLoading(false);
            alert("Poligon oluşturulamadı!");
        }
    };

    // console.log(geofences)
    // console.log(selectedCity)


    // "longitude   latitude" formatında string hazırlıyoruz
    const formattedCoords = polygonData?.coordinates[0].map(([lat, lng]) => `Longitude: ${lng}-Latitude: ${lat}, `).join("\n") || selectedCity?.polygon.coordinates[0].map(([lat, lng]) => `Longitude: ${lng}-Latitude: ${lat}, `).join("\n")


    return (
        <Spin spinning={loading} tip="Poligonlar yükleniyor...">


            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: "20px" }}>
                <div style={{ flex: 2 }}>
                    <div ref={mapRef} style={{ height: "80vh", zIndex: 1 }}></div>
                </div>

                <div style={{ flex: 1 }}>
                    <Form form={form} layout="vertical" onFinish={onFinish}>
                        <Form.Item label="Poligon Adı" name="name" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label="İlçe Mernis Kodu"
                            name="ilceMernisKodu"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item label="Poligon Tipi" name="type" rules={[{ required: true }]}>
                            <Select>
                                <Option value="DENY">DENY</Option>
                                <Option value="ALLOW">ALLOW</Option>
                                <Option value="SCORE">SCORE</Option>
                                <Option value="STATION">STATION</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item label="Poligon Durumu" name="status" rules={[{ required: true }]}>
                            <Select>
                                <Option value="ACTIVE">Aktif</Option>
                                <Option value="PASSIVE">Pasif</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" style={{ width: isMobile && "100%" }}>
                                Kaydet
                            </Button>
                        </Form.Item>
                        <Form.Item>
                            <TextArea
                                value={formattedCoords}
                                readOnly
                                autoSize
                            />
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Spin>
    );
};

export default PolygonUpdate;
