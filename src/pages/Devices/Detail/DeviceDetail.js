import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect, useRef } from "react";
import { Card, Tabs, Form, Input, Row, Col, Table, Typography, Spin, Button, Modal } from "antd";
import axios from "../../../api/axios";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useIsMobile } from '../../../utils/customHooks/useIsMobile';
import { GlobalOutlined, CameraFilled } from "@ant-design/icons"; // üst kısma ekle
import Title from "antd/es/typography/Title";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

dayjs.extend(utc);

const { TabPane } = Tabs;
const { Link } = Typography;

// Leaflet ikon düzeltmesi (Modal ve Webpack uyumu için)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Mini harita referanslarını saklamak için bileşen dışında bir nesne kullanılır.
const miniMapRefs = {};

const DeviceDetail = () => {
  const [lastTenUser, setLastTenUser] = useState([]);
  const [lastUser, setLastUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [tableData, setTableData] = useState([]);
  const isMobile = useIsMobile(991);

  // modal için seçili resim
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const [mapVisible, setMapVisible] = useState(false);
  const [mapData, setMapData] = useState([]);
  const [geofences, setGeofences] = useState([]);

  const navigate = useNavigate();
  const { id: qrlabel } = useParams();

  // Büyük harita Leaflet referansları
  const mapRef = useRef(null);
  const markersRef = useRef(L.layerGroup());
  const linesRef = useRef(L.layerGroup());

  // son 10 kullanıcıyı getir
  const fetchLastTenUser = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        "/devices/findLastTenUser",
        { "qrlabel": qrlabel },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer TOKEN_HERE",
            "language": "tr",
            "version": "panel"
          }
        }
      );

      const users = Array.isArray(res.data) ? res.data : [];


      // her kullanıcı için fotoğrafı getir
      const usersWithImages = await Promise.all(
        users.map(async (item) => {
          try {
            const imgRes = await axios.post(
              "/rentals/showImage",
              { url: item.imageObj.url, key: item.imageObj.key },
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: "Bearer TOKEN_HERE",
                  "language": "tr",
                  "version": "panel"
                }
              }
            );

            return { ...item, base64Img: imgRes.data.image };
          } catch (err) {
            //console.error("Görsel alınırken hata oluştu");
            return { ...item, base64Img: null };
          }
        })
      );
      setLastTenUser(usersWithImages);
    } catch (err) {
      //console.error("/devices/findLastTenUser alınırken hata oluştu");
      setLastTenUser([]);
    } finally {
      setLoading(false);
    }
  };

  // son kullanıcıyı getir
  const fetchLastUser = async () => {
    try {
      const res = await axios.post(
        "/devices/findLastUser",
        { "qrlabel": qrlabel },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer TOKEN_HERE",
            "language": "tr",
            "version": "panel"
          }
        }
      );
      setLastUser(res.data);
    } catch (err) {
      //console.error("/devices/findLastUser alınırken hata oluştu", err);
      setLastUser({});
    }
  };

  const openMapModal = (avldatas) => {
    setMapData(avldatas);
    setMapVisible(true);
  };
  const fetchGeofences = async () => {
    try {
      const res = await axios.get("/geofences");
      setGeofences(res.data || []);
    } catch {
      console.log("Geofence alınamadı");
    }
  };

  // Büyük Harita Modalının Yönetimi
  useEffect(() => {
    if (mapVisible && mapData.length > 0) {
      const initialPoint = mapData.at(-1);

      if (mapRef.current) {
        mapRef.current.setView([initialPoint.lat, initialPoint.lng], 17);
        markersRef.current.clearLayers();
        linesRef.current.clearLayers();
      } else {
        const map = L.map("map").setView([initialPoint.lat, initialPoint.lng], 17);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          minZoom: 12,
        }).addTo(map);
        markersRef.current.addTo(map);
        linesRef.current.addTo(map);
        mapRef.current = map;
      }

      const map = mapRef.current;
      const markers = markersRef.current;
      const lines = linesRef.current;

      const pointList = mapData.map((p) => [p.lat, p.lng]);
      L.marker([mapData[0].lat, mapData[0].lng]).addTo(markers);
      L.marker([mapData.at(-1).lat, mapData.at(-1).lng]).addTo(markers);
      L.polyline(pointList, { color: "red", weight: 3, opacity: 0.5 }).addTo(lines);

      // 1️⃣ Dünya sınırı
      const worldCoords = [
        [90, -180],
        [90, 180],
        [-90, 180],
        [-90, -180],
      ];

      // 2️⃣ ALLOW bölgelerini delik olarak topla
      const allowHoles = [];

      geofences.forEach((area) =>
        area.locations.forEach((loc) => {
          const coords = loc.polygon.coordinates[0].map((c) => [c[1], c[0]]);
          if (loc.type === "ALLOW") {
            allowHoles.push(coords);
          }
        })
      );

      // 3️⃣ Gri katmanı çiz (dış sınır + delikler)
      L.polygon([worldCoords, ...allowHoles], {
        color: "grey",
        fillColor: "grey",
        fillOpacity: 0.4,
        stroke: false,
      }).addTo(map);

      // 🔹 ALLOW bölgelerinin kenarlarını ayrı çiz
      allowHoles.forEach((holeCoords) => {
        L.polyline(holeCoords, {
          color: "#748181ff",     // kenar rengi (örnek: açık mavi)
          weight: 2,            // kalınlık
          opacity: 1,           // çizginin opaklığı
        }).addTo(map);
      });

      // 4️⃣ Diğer bölgeleri (DENY, SpeedLimitedZone) ayrı çiz
      geofences.forEach((area) =>
        area.locations.forEach((loc) => {
          const coords = loc.polygon.coordinates[0].map((c) => [c[1], c[0]]);
          if (loc.type === "DENY") {
            L.polygon(coords, {
              color: "red",
              fillColor: "red",
              fillOpacity: 0.4,
            }).addTo(map);
          } else if (loc.type === "SpeedLimitedZone") {
            L.polygon(coords, {
              color: "yellow",
              fillColor: "yellow",
              fillOpacity: 0.4,
            }).addTo(map);
          }
        })
      );

      setTimeout(() => map.invalidateSize(), 0);
    }

  }, [mapVisible, mapData, geofences]);

  // Mini Haritaların Yönetimi (Hata Engelleme ve Önizleme)
  useEffect(() => {
    lastTenUser.forEach((r) => {
      const miniMapId = `mini-map-${r._id}`;
      const element = document.getElementById(miniMapId);

      if (element && r.avldatas.length) {

        if (miniMapRefs[r._id]) {
          miniMapRefs[r._id].invalidateSize();
          return;
        }

        if (element.hasAttribute('_leaflet_id')) {
          try {
            L.map(miniMapId).remove();
          } catch (e) { /* ignore */ }
        }

        // Haritayı sıfırdan oluştur.
        const initialPoint = r.avldatas[0];
        const miniMap = L.map(miniMapId, {
          zoomControl: false,
          attributionControl: false,
          dragging: false,
          scrollWheelZoom: false,
          tap: false,
          touchZoom: false,
        }).setView([initialPoint.lat, initialPoint.lng], 15);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(miniMap);

        const latlngs = r.avldatas.map((p) => [p.lat, p.lng]);
        L.polyline(latlngs, { color: "blue", weight: 2 }).addTo(miniMap);

        // Harita nesnesini sakla
        miniMapRefs[r._id] = miniMap;
      }
    });

    // Temizleme Fonksiyonu: Listeden çıkan (sonlandırılan) haritaları temizler.
    return () => {
      Object.keys(miniMapRefs).forEach(id => {
        const rentalExists = lastTenUser.some(r => r._id === id);
        if (!rentalExists && miniMapRefs[id]) {
          miniMapRefs[id].remove();
          delete miniMapRefs[id];
        }
      });
    };
  }, [lastTenUser]);

  // search işlemi
  useEffect(() => {
    if (!searchText) {
      setFilteredUsers(tableData);
      return;
    }
    const filtered = tableData.filter((item) => {
      return (
        dayjs.utc(item.startDate).format("DD.MM.YYYY HH.mm.ss").includes(searchText) ||
        dayjs.utc(item.endDate).format("DD.MM.YYYY HH.mm.ss").includes(searchText) ||
        item.memberName?.toString().toLowerCase().includes(searchText) ||
        item.memberGsm?.toString().toLowerCase().includes(searchText) ||
        item.timeDrive?.toString().toLowerCase().includes(searchText)
      );
    });
    setFilteredUsers(filtered);
  }, [searchText, tableData]);



  // sayfa yüklenince dataları getir
  useEffect(() => {
    fetchLastUser();
    fetchLastTenUser();
    fetchGeofences()
  }, [qrlabel]);

  // lastTenUser güncellenince tabloya doldur
  useEffect(() => {
    const temp = lastTenUser.map((item, index) => {
      const start = dayjs.utc(item.start);
      const end = dayjs.utc(item.end);
      const diffMinutes = `${end.diff(start, "minute")} dk`;
      return {
        key: index + 1,
        startDate: item.start,
        endDate: item.end,
        memberName: `${item.member.first_name} ${item.member.last_name}`,
        memberGsm: item.member.gsm,
        timeDrive: diffMinutes,
        photo: item.base64Img,
        avldatas: item.avldatas
      };
    });
    setTableData(temp);
  }, [lastTenUser]);



  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}>
        <Spin size="large" />
      </div>
    );
  } else if (!lastTenUser.length) {
    return <h2>Veri bulunamadı</h2>;
  }

  const lastUserInfo = {
    name: lastUser.memberName,
    birthDate: dayjs(lastUser.memberBirthDate).format("DD.MM.YYYY"),
    phone: lastUser.memberGsm,
    battery: `${lastUser.deviceBattery}`,
    cihazQrKodu: qrlabel,
  };

  const columns = [
    {
      title: "Sürüş Başlangıç",
      dataIndex: "startDate",
      key: "startDate",
      align: "center",
      sorter: (a, b) => a.startDate.localeCompare(b.startDate),
      render: (value) => dayjs.utc(value).format("DD.MM.YYYY HH.mm.ss")
    },
    {
      title: "Sürüş Bitiş",
      dataIndex: "endDate",
      key: "endDate",
      align: "center",
      sorter: (a, b) => a.endDate.localeCompare(b.endDate),
      render: (value) => dayjs.utc(value).format("DD.MM.YYYY HH.mm.ss")
    },
    {
      title: "Ad Soyad",
      dataIndex: "memberName",
      key: "memberName",
      align: "center",
      sorter: (a, b) => a.memberName.localeCompare(b.memberName)
    },
    {
      title: "GSM",
      dataIndex: "memberGsm",
      key: "memberGsm",
      align: "center",
      sorter: (a, b) => a.memberGsm.localeCompare(b.memberGsm),
      render: (gsm) =>
        gsm ? (
          <Link onClick={() => navigate(`/panel/users?gsm=${encodeURIComponent(gsm)}`)}>
            {gsm}
          </Link>
        ) : (
          "-"
        ),
    },
    {
      title: "Sürüş Süresi",
      dataIndex: "timeDrive",
      key: "timeDrive",
      align: "center",
      sorter: (a, b) => a.timeDrive - b.timeDrive,
    },
    {
      title: "Harita",
      key: "map",
      align: "center",
      render: (r) => (
        <Button type="primary" onClick={() => {
          openMapModal(r.avldatas)
        }}
          icon={<GlobalOutlined />}
        />
      )
    },
    {
      title: "Sürüş Fotoğrafı",
      dataIndex: "photo",
      key: "photo",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          disabled={!record.photo}
          onClick={() => {
            setSelectedImg(record.photo);
            setIsModalOpen(true);
          }}
        >
          <CameraFilled />
        </Button>
      ),
    },
  ];

  return (
    <Card title={`Sürüş Bilgileri: ${qrlabel}`}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Bilgiler" key="1">
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="İsim">
                  <Input value={lastUserInfo.name} disabled style={{ color: "black" }} />
                </Form.Item>
                <Form.Item label="Müşteri Doğum Tarihi">
                  <Input value={lastUserInfo.birthDate} disabled style={{ color: "black" }} />
                </Form.Item>
                <Form.Item label="Batarya(%)">
                  <Input value={lastUserInfo.battery} disabled style={{ color: "black" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="GSM Numarası">
                  <Link onClick={() => navigate(`/panel/users?gsm=${encodeURIComponent(lastUserInfo.phone)}`)}>
                    {lastUserInfo.phone}
                  </Link>
                </Form.Item>
                <Form.Item label="Cihaz QR Kodu">
                  <Input value={lastUserInfo.cihazQrKodu} disabled style={{ color: "black" }} />
                </Form.Item>
                <Form.Item label="Sürüş Fotoğrafı">
                  {/* Buton */}
                  <Button
                    type="primary"
                    disabled={!tableData[0]?.photo}
                    onClick={() => {
                      setSelectedImg(tableData[0].photo);
                      setIsModalOpen(true);
                    }}
                  >
                    Fotoğrafı Görüntüle
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </TabPane>

        <TabPane tab="Geçmiş Sürüşler" key="2">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={24} md={24} lg={8}>
              <Input
                placeholder="Ara..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{
                  margin: "16px 0",
                  width: "100%",
                  ...(isMobile ? { marginBottom: "16px" } : { maxWidth: "300px", marginBottom: "16px" }),
                }}
              />
            </Col>
          </Row>
          <Table
            columns={isMobile ? columns.slice(0, 3) : columns}
            dataSource={filteredUsers}
            loading={loading}
            rowKey={(record) => record.startDate}
            scroll={{ x: true }}
            pagination={false}
            expandable={
              isMobile
                ? {
                  expandedRowRender: (record) => (
                    <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                      <p><b>GSM: </b>

                        <Link onClick={() => navigate(`/panel/users?gsm=${encodeURIComponent(record.memberGsm)}`)}>
                          {record.memberGsm}
                        </Link></p>
                      <p><b>Sürüş Süresi:</b> {record.timeDrive} </p>
                      <Button
                        type="primary"
                        disabled={!record.photo}
                        onClick={() => {
                          setSelectedImg(record.photo);
                          setIsModalOpen(true);
                        }}
                      >
                        Fotoğrafı Görüntüle
                      </Button>
                    </div>
                  ),
                  expandRowByClick: true,
                }
                : undefined
            }
          />
        </TabPane>
      </Tabs>

      {/* Modal tek yerde duruyor */}
      <Modal
        title="Sürüş Fotoğrafı"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        height="800px"
        width="fit-content"
      >
        {selectedImg ? (
          <img
            src={`data:image/png;base64,${selectedImg}`}
            alt="Base64 Görsel"
            style={{ height: "100%", width: "100%", borderRadius: "8px" }}
          />
        ) : (
          <p>Görsel bulunamadı</p>
        )}
      </Modal>

      {/*Büyük Harita Modalı*/}
      <Modal
        open={mapVisible}
        title={<Title level={4}>Harita Konumu</Title>}
        onCancel={() => setMapVisible(false)}
        width={800}
        bodyStyle={{ height: "70vh", padding: 0 }}
        footer={<Button onClick={() => setMapVisible(false)}>Kapat</Button>}
        afterClose={() => {
          if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
            markersRef.current = L.layerGroup();
            linesRef.current = L.layerGroup();
          }
        }}
      >
        <div id="map" style={{ height: "100%", width: "100%" }} />
      </Modal>

    </Card>
  );
};

export default DeviceDetail;
