import React, { useEffect, useRef, useState } from "react";
import { Button, Form, Input, Select, message } from "antd";
import { useParams } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import axios from "../../../api/axios"; // doğru yolu kontrol et

const { Option } = Select;

const PolygonUpdate = () => {
    const mapRef = useRef(null);
    const drawnItemsRef = useRef(null);
    const [polygonData, setPolygonData] = useState(null);
    const { id } = useParams();

    const [polygon, setPolygon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [geofences, setGeofences] = useState([]);
    const [selectedCity,setSelectedCity] = useState()

    // API'den poligonları çek
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
        setPolygonData(selected.polygon);
    }, [geofences, id, polygon]);


    const onFinish = async (values) => {
        console.log("Kaydedilecek veriler:", values, polygonData);
        // burada PUT/POST atabilirsin
    };

    console.log(geofences)
    console.log(selectedCity?.name)

    return (
        <div style={{ display: "flex", gap: "20px" }}>
            <div style={{ flex: 2 }}>
                <div ref={mapRef} style={{ height: "80vh" }}></div>
            </div>

            <div style={{ flex: 1 }}>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item label="Poligon Adı" name="name" rules={[{ required: true }]}>
                        <Input value={selectedCity?.name}/>
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
                        <Button type="primary" htmlType="submit">
                            Kaydet
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        </div>
    );
};

export default PolygonUpdate;
