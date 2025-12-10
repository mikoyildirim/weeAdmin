// src/pages/Maps/Polygons/PolygonCreate.js
import React, { useEffect, useRef, useState, } from "react";
import { Button, Form, Input, Select, Spin } from "antd";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import axios from "../../../api/axios"; // doğru yolu kontrol et
import { useIsMobile } from "../../../utils/customHooks/useIsMobile";
import { useNavigate } from "react-router-dom";

const { Option } = Select;

const PolygonCreate = () => {
  const mapRef = useRef(null);
  const drawnItemsRef = useRef(null);
  const [polygonData, setPolygonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = useIsMobile(991);
  const navigation = useNavigate()


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
      const coords = layer.getLatLngs()[0].map((latlng) => [latlng.lng, latlng.lat]);
      coords.push(coords[0]); // polygonu kapat
      setPolygonData({ type: "Polygon", coordinates: [coords] });
    });

    map.on("draw:edited", (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        const coords = layer.getLatLngs()[0].map((latlng) => [latlng.lng, latlng.lat]);
        coords.push(coords[0]);
        setPolygonData({ type: "Polygon", coordinates: [coords] });
      });
    });
  }, []);

  const onFinish = async (values) => {
    setLoading(true);

    if (!polygonData) {
      setLoading(false);
      alert("Önce poligon çizmelisiniz!");
      return;
    }
    try {
      console.log(polygonData)
      await axios.post("/geofences/createlocation/62b2d0760ece1d36e58a20dd", {
        ...values,
        polygon: polygonData,
        brand: "WeeScooter",
        white_label: true,
        percentage: 50,
        start_price: 0,
        price: 1.99,
        start: new Date().toISOString(),
        end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
      })
      // .then((res) => console.log(res.data))
      setLoading(false);
      alert("Poligon başarıyla oluşturuldu!");
      navigation("/panel/maps/polygons")
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Poligon oluşturulamadı!");
    }
  };


  return (
    <div style={{ display: "flex", gap: "20px", flexDirection: isMobile ? "column" : "row" }}>
      <div style={{ flex: 2 }}>
        <div ref={mapRef} style={{ height: "80vh", zIndex: 1 }}></div>
      </div>

      <div style={{ flex: 1 }}>
        <Spin spinning={loading}>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item label="Poligon Adı" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item label="İlçe Mernis Kodu" name="ilceMernisKodu" rules={[{ required: true }]}>
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
              <Button type="primary" htmlType="submit" loading={loading} style={{ width: isMobile && "100%" }}>
                Kaydet
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </div>
  );
};

export default PolygonCreate;
