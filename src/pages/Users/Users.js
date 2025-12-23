import React, { useState, useEffect, useRef } from "react";
import { Card, Tabs, Form, Input, Row, Col, Select, Button, Spin, Table, Modal, Descriptions } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import exportToExcel from "../../utils/methods/exportToExcel";
import utc from 'dayjs/plugin/utc';
import { GlobalOutlined, CameraFilled } from "@ant-design/icons";
import { useSelector } from "react-redux";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useNavigate, useLocation, Link } from "react-router-dom";
import Title from "antd/es/typography/Title";
import { useIsMobile } from "../../utils/customHooks/useIsMobile";
import { App } from "antd";
dayjs.extend(utc);
dayjs.locale("tr");

const { TabPane } = Tabs;

// Leaflet ikon düzeltmesi (Modal ve Webpack uyumu için)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Mini harita referanslarını saklamak için bileşen dışında bir nesne kullanılır.
const miniMapRefs = {};

const Users = () => {
const { message } = App.useApp();
  const location = useLocation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [userData, setUserData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [userPassiveType, setUserPassiveType] = useState("");
  const [cardIsActive, setCardIsActive] = useState("");
  const [paginationSize, setPaginationSize] = useState("medium");
  const isMobile = useIsMobile(991);
  const user = useSelector((state) => state.auth.user);


  const [transactionType, setTransactionType] = useState('5');
  const [amount, setAmount] = useState('');
  const [fineType, setFineType] = useState('park');
  const [qrCode, setQrCode] = useState('');
  const [iyzicoID, setTransactionNo] = useState('');


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const [mapVisible, setMapVisible] = useState(false);
  const [mapData, setMapData] = useState([]);
  const [geofences, setGeofences] = useState([]);


  const [filteredUploads, setFilteredUploads] = useState([]);
  const [filteredRentals, setFilteredRentals] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);

  // Büyük harita Leaflet referansları
  const mapRef = useRef(null);
  const markersRef = useRef(L.layerGroup());
  const linesRef = useRef(L.layerGroup());


  const excelFileNameUploads = `${dayjs().format("DD.MM.YYYY_HH.mm")}_${phone} Yükleme Raporu.xlsx`;
  const excelFileNameRentals = `${dayjs().format("DD.MM.YYYY_HH.mm")}_${phone} Kiralama Raporu.xlsx`;
  const excelFileNameCampaigns = `${dayjs().format("DD.MM.YYYY_HH.mm")}_${phone} Kampanya Raporu.xlsx`;


  // transactions filtresi + sıralama
  const uploads = (userData?.wallet?.transactions?.filter(t => t.type === 1 || (t.type === -1 && !t.rental)) || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date)).reverse();

  let rentals = (userData?.wallet?.transactions?.filter(t => t.rental) || []) // transaction içerisinde rental değeri dolu ise rentals tablosuna ekle
    .sort((a, b) => new Date(a.rental?.start) - new Date(b.rental?.start))
    .reverse();

  const campaigns = (userData?.wallet?.transactions?.filter(t => t.type === 3) || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date)).reverse();


  const fetchGeofences = async () => {
    try {
      const res = await axios.get("/geofences");
      setGeofences(res.data || []);
    } catch {
      console.log("Geofence alınamadı");
    }
  };

  useEffect(() => { // sayfa yüklendiğinde kullanıcı verisi dolduğunda tablardaki tabloların verilerini doldurma işlemi
    setFilteredUploads(uploads);
    setFilteredRentals(rentals);
    setFilteredCampaigns(campaigns);
  }, [userData]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gsm = params.get("gsm");
    setUserData(null)
    setPhone(gsm);
    if (gsm) {
      searchUser();
      //console.log("İlk yüklemede GSM:", gsm);
      form.setFieldsValue({ phone })
    }
    fetchGeofences();
  }, [phone, location.search]); // phone değişince çalışır

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  // Formatlar
  const formatDateTime = (date) => {
    return date ? dayjs.utc(date).format("YYYY-MM-DD HH.mm.ss") : "-";
  };

  const formatDateOnly = (date) => {
    return date ? dayjs.utc(date).format("YYYY-MM-DD") : "-";
  };

  const searchUserButton = (values) => {
    //console.log("Form verileri:", values);
    const { phone } = values;
    setPhone(phone)
    //console.log(phone)
    navigate(`/panel/users?gsm=${encodeURIComponent(phone)}`);
  };


  const searchUser = async () => {

    if (!phone) {
      message.warning("Lütfen telefon numarası giriniz");
      return;
    }

    setLoading(true);
    setUserData(null);
    setSearched(false);

    try {
      const res = await axios.get(`/members/listByTenantGsm/${phone}`)
      // .then(res => console.log(res.data))
      // .catch(err => console.log(err))
      //console.log(res.data)
      setUserData(res.data || null);
      if (res.data) {
        // console.log(res.data)
        setUserPassiveType(res.data?.user?.passiveType || "");
        setCardIsActive(res.data?.wallet?.cards[0] ? res.data?.wallet?.cards[0]?.isActive : "");
      }
    } catch (err) {
      console.error(err);
      setUserData(null);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };
  const showImage = async (imageObj) => {
    setSelectedImg("")
    try {
      const { key, url } = { ...imageObj }
      await axios.post('/rentals/showImage', { key, url })
        .then(res => {
          //console.log(res.data)
          setSelectedImg(res.data.image);
        })
        .catch()
    } catch (error) {
      //console.error('showImage hatası:', error.message);
    }
  };


  const handleIsActiveChange = async (value, cardOrUser) => {
    setLoading(true)
    if (cardOrUser === "card") {
      setCardIsActive(value);
      const walletId = userData.wallet._id; // wallet ID
      const payload = { isActive: cardIsActive }
      //console.log(userData.wallet.cards[0]._id)
      await axios.post(`wallets/card/isActive/${walletId}`, payload,)
        .then(res => {
          setLoading(false)
          //console.log(res.data)
        })
        .catch(err => {
          setLoading(false)
          //console.log(err)
        })
    } else {
      setUserPassiveType(value)
      const status = userPassiveType === "NONE"
      await axios.post(`/users/update/active/one/panel`, {
        active: status,
        gsm: phone,
        passiveType: userPassiveType,
      })
        .then(res => {
          setLoading(false)
          // console.log(res.data)
        })
        .catch(err => {
          setLoading(false)
          // console.log(err)
        })
    }
  };


  const handleMakeMoney = async () => {
    try {
      //setLoading(true)
      const payloadBase = {
        gsm: userData.gsm,
        amount,
      };

      // TYPE != 3 → NORMAL İŞLEM
      if (transactionType !== "3") {
        const payload = {
          ...payloadBase,
          type: transactionType,
          date: dayjs().format("YYYY-MM-DD"),
          dateHourSecond: dayjs()
            .format("HH:mm:ss"),
        };

        if (iyzicoID) {
          payload.iyzicoID = iyzicoID;
        }

        //console.log("para işlemi yapılıyor...", `\ntransactionType: ${transactionType} \npayload: ${JSON.stringify(payload)} \nendpoint: /transactions/addTransactionPanel`)
        const res = await axios.post('/transactions/addTransactionPanel', payload);
        //console.log(res)
        //setLoading(false)
      }

      // TYPE == 3 → CEZA İŞLEMİ
      else {
        const payload = {
          ...payloadBase,
          qrlabel: qrCode,
          fineType,
        };

        // console.log(
        //   "ceza işlemi yapılıyor...",
        //   `\nendpoint: /transactions/addFine`,
        //   payload
        // );

        const res = await axios.post('/transactions/addFine', payload);
        //console.log(res)
        //setLoading(false)
      }

      message.success("İşlem başarıyla kaydedildi!");

      // Form reset
      setAmount("");
      setFineType("");
      setQrCode("");
      setTransactionNo("");
      setTransactionType("5");

      searchUser();
    } catch (error) {

      console.error("İşlem sırasında bir hata oluştu!");
      console.error(error);
      if (error.response.data.error.message === "Ödeme(ler) bulunamadı.") {
        setAmount("");
        setFineType("");
        setQrCode("");
        setTransactionNo("");
        setTransactionType("5");
        searchUser();
      }

    }
  };



  const openMapModal = (avldatas) => {
    setMapData(avldatas);
    setMapVisible(true);
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
    rentals.forEach((r) => {
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

    return () => {
      Object.keys(miniMapRefs).forEach(id => {
        const rentalExists = rentals.some(r => r._id === id);
        if (!rentalExists && miniMapRefs[id]) {
          miniMapRefs[id].remove();
          delete miniMapRefs[id];
        }
      });
    };
  }, [rentals]);


  const values = ["iyzico", "hediye", "ceza/fine", "iyzico/iade", "iade/return"];

  const counts = values.reduce((acc, val) => {
    if (val === "hediye") {
      // sadece "hediye" için substring kontrolü
      acc[val] = uploads.filter(item =>
        item.payment_gateway && item.payment_gateway.includes("hediye")
      ).length;
    } else {
      // diğerleri için tam eşleşme
      acc[val] = uploads.filter(item => item.payment_gateway === val).length;
    }
    return acc;
  }, {});

  //console.log("cardIsActive",cardIsActive,"data",userData.wallet.cards[0].isActive)

  // Excel datası 
  const excelDataUploads = uploads.map((d) => ({
    Tarih: formatDateTime(d.date),
    "Yükleme Noktası": d.payment_gateway,
    "Yükleme ID": d.transaction_id,
    "Ceza Türü": d.fineType || "-",
    "QR": d.qrlabel || "-",
    "Tutar": d.amount != null ? `${d.amount} ₺` : "-",
    "İşlem Versiyon": d.version,
    "Durum": d.status,
  }));

  const excelDataRentals = rentals.map((d) => {
    let duration = "-";
    if (d.rental?.start && d.rental?.end) {
      const start = new Date(d.rental.start);
      const end = new Date(d.rental.end);
      const diff = Math.floor((end - start) / 1000);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      duration = `${hours}h ${minutes}m ${seconds}s`;
    }
    return {
      QR: d.rental?.device?.qrlabel,
      Başlangıç: formatDateTime(d.rental?.start),
      Bitiş: formatDateTime(d.rental?.end),
      Sonlandıran: d.rental?.finishedUser?.name || "Kullanıcı",
      Süre: duration,
      Tutar:
        d?.amount != null
          ? d.type === -3
            ? `${Number(d.amount).toFixed(2)} WeePuan`
            : `${Number(d.amount).toFixed(2)} ₺`
          : "-",
      "İşlem Versiyon": d.rental?.version || d.version || "-", // öncelikle rental içerisindeki version alınıyor
    };
  });

  const excelDataCampaigns = campaigns.map(d => ({ // excel ve pdf indirirken filtrelenmiş halini indirir. yani ekranda ne görünüyorsa o
    "Date": dayjs.utc(d.date).format("DD.MM.YYYY HH.mm"),
    "Yükleme ID": `${d.transaction_id} Wee Puan`,
    "Tutar": d.amount,
    "İşlem Versiyon": d.version,
  }));

  // console.log(userData)
  //console.log(userData?.wallet?.transactions?.filter(t => t.transaction_id === "ceza/fine"))

  // Columns
  const uploadColumns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      align: "center",
    },
    {
      title: "Yükleme Noktası",
      dataIndex: "payment_gateway",
      key: "payment_gateway",
      render: (_, record) => (record.payment_gateway || "-"),
      sorter: (a, b) =>
        (a.payment_gateway || "").localeCompare(b.payment_gateway || ""),
      align: "center",
    },
    {
      title: "Yükleme ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      render: (_, record) => (record.transaction_id || "-"),
      sorter: (a, b) =>
        (a.transaction_id || "").toString().localeCompare((b.transaction_id || "").toString()),
      align: "center",
    },
    {
      title: "Ceza Türü",
      dataIndex: "fineType",
      key: "fineType",
      render: (_, record) => (record.fineType || "-"),
      sorter: (a, b) => (a.fineType || "").localeCompare(b.fineType || ""),
      align: "center",
    },
    {
      title: "QR",
      dataIndex: "qrlabel",
      key: "qrlabel",
      render: (_, record) => (record.qrlabel || "-"),
      sorter: (a, b) => (a.qrlabel || "").localeCompare(b.qrlabel || ""),
      align: "center",
    },
    {
      title: "Tutar",
      dataIndex: "amount",
      key: "amount",
      render: (val) => (val != null ? `${val} ₺` : "-"),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      align: "center",
    },
    {
      title: "İşlem Versiyon",
      dataIndex: "version",
      key: "version",
      sorter: (a, b) => (a.version || "").localeCompare(b.version || ""),
      render: (_, record) =>
        record.version || record.ip || "-",
      align: "center",
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      align: "center",
    },
  ];


  let rentalColumns = [
    {
      title: "QR",
      dataIndex: ["rental", "device", "qrlabel"],
      key: "qr",
      align: "center",

      render: (_, record) => (
        <Button type="link">
          <Link to={`/panel/devices/detail/${record?.rental?.device?.qrlabel}`}>
            <span style={{ userSelect: "text" }}>{record?.rental?.device?.qrlabel || "-"}</span>
          </Link>
        </Button>
      ),
      sorter: (a, b) =>
        (a.rental?.device?.qrlabel || "").localeCompare(b.rental?.device?.qrlabel || ""),
    },
    {
      title: "Başlangıç",
      dataIndex: ["rental", "start"],
      key: "start",
      align: "center",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.rental?.start) - new Date(b.rental?.start),
    },
    {
      title: "Bitiş",
      dataIndex: ["rental", "end"],
      key: "end",
      align: "center",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.rental?.end) - new Date(b.rental?.end),
    },
    {
      title: "Sonlandıran",
      key: "finishedUser",
      align: "center",
      render: (_, record) =>
        record.rental?.finishedUser?.name ? record.rental.finishedUser.name : "Kullanıcı",
      sorter: (a, b) =>
        (a.rental?.finishedUser?.name || "").localeCompare(
          b.rental?.finishedUser?.name || ""
        ),
    },
    {
      title: "Süre",
      key: "duration",
      align: "center",
      render: (_, record) => {
        if (record.rental?.start && record.rental?.end) {
          const start = new Date(record.rental.start);
          const end = new Date(record.rental.end);
          const diff = Math.floor((end - start) / 1000);
          const hours = Math.floor(diff / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          const seconds = diff % 60;
          return `${hours}h ${minutes}m ${seconds}s`;
        }
        return "-";
      },
      sorter: (a, b) => {
        const getDuration = (rec) => {
          if (rec.rental?.start && rec.rental?.end) {
            return new Date(rec.rental.end) - new Date(rec.rental.start);
          }
          return 0;
        };
        return getDuration(a) - getDuration(b);
      },
    },
    {
      title: "Tutar",
      key: "total",
      align: "center",
      render: (_, record) => {
        if (record?.amount != null) {
          let formatted = Number(record.amount).toFixed(2);
          if (record.type === -3) {
            return `${formatted} WeePuan`;
          } else if (record.type === -1) {
            return `${formatted} ₺`;
          }
        }
        return "-";
      },
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: "İşlem Versiyon",
      key: "version",
      align: "center",
      render: (_, record) => record.rental?.version || record.version || record.ip || "-",
    },
    {
      title: "Harita",
      key: "map",
      align: "center",
      render: (_, r) => (
        <Button type="primary" onClick={() => {
          // console.log(r.rental.avldatas)
          openMapModal(r.rental.avldatas)
        }}
          icon={<GlobalOutlined />}
        />
      )
    },

    ,
  ];

  if (user?.permissions?.showImage) {
    rentalColumns.push(
      {
        title: "Görsel",
        key: "image",
        align: "center",
        render: (_, record) => (
          <Button
            type="primary"
            disabled={!record?.rental?.imageObj}
            onClick={() => {
              // console.log("Clicked:", record);
              showImage(record?.rental?.imageObj);
              setIsModalOpen(true);
            }}
            icon={<CameraFilled />}
          />
        ),
      },
    )
  }

  if (user?.permissions?.rentalUpdate) {
    rentalColumns.push(
      {
        title: "Sürüşü Düzenle",
        dataIndex: "editDriving",
        key: "editDriving",
        align: "center",
        render: (_, record) => (
          <Button type="primary">
            <Link to={`/panel/users/showRental/${record.rental._id}`}>
              Sürüş Düzenle
            </Link>
          </Button>
        )
      }
    )
  }
  const campaignColumns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      render: (date) => formatDateTime(date),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      align: "center",
    },
    {
      title: "Yükleme ID",
      dataIndex: "transaction_id",
      key: "transaction_id",
      render: (_, record) => (record.transaction_id || "-"),
      sorter: (a, b) =>
        a.transaction_id?.toString().localeCompare(b.transaction_id?.toString()),
      align: "center",
    },
    {
      title: "Tutar",
      dataIndex: "amount",
      key: "amount",
      render: (val) => (val != null ? `${val} Wee Puan` : "-"),
      sorter: (a, b) => (a.amount || 0) - (b.amount || 0),
      align: "center",
    },
    {
      title: "İşlem Versiyon",
      dataIndex: "version",
      key: "version",
      render: (_, record) =>
        record.version || record.ip || "-",
      sorter: (a, b) =>
        a.version?.toString().localeCompare(b.version?.toString()),
      align: "center",
    },
  ];

  return (
    <>

      <h1>Kullanıcı Bilgileri</h1>

      <Card title="Kullanıcı Arama">
        <Form form={form} layout="inline" onFinish={searchUserButton}>
          <Form.Item name="phone" rules={[{ required: true, message: "Telefon numarası girin!" }]}
            style={{
              ...(isMobile ? { width: '100%' } : {}),
            }}>
            <Input placeholder="Telefon numarası ile ara..." style={{ width: '100%', maxWidth: 400, marginRight: 8 }} maxLength={15} />
          </Form.Item>
          <Form.Item
            style={{
              ...(isMobile ? { width: '100%', marginTop: 20 } : {}),
            }}>
            <Button type="primary" htmlType="submit"
              style={{
                ...(isMobile ? { width: '100%' } : {}),
              }}>
              Kullanıcı Ara
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {searched && (
        <div style={{ position: "relative" }}>
          {/* Blur efekti için card'ı saran div */}
          <div style={{ filter: loading ? "blur(3px)" : "none", pointerEvents: loading ? "none" : "auto" }}>
            {!loading && !userData && (
              <Card style={{ marginTop: 20, display: "flex", justifyContent: "center", alignItems: "center", width: '100%' }}>
                <p style={{ color: "red", fontWeight: "bold" }}>Kullanıcı bulunamadı.</p>
              </Card>
            )}

            {userData && (
              isMobile ? (
                <Card style={{ marginTop: 20, width: '100%' }}>
                  <Tabs
                    defaultActiveKey="1"
                    tabBarGutter={16}
                    tabBarStyle={{
                      display: "flex",
                      flexWrap: window.innerWidth < 768 ? "wrap" : "nowrap",
                    }}
                  >
                    {/* Bilgiler Tab */}
                    <TabPane tab="Bilgiler" key="1">
                      <Form layout="vertical">
                        <Row gutter={[16, 16]}>

                          <Col span={12}>
                            <Form.Item label="Kullanıcı Adı Soyadı">
                              <Input value={userData.user?.name} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="TC Kimlik Numarası">
                              <Input value={userData.tckno} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Row span={12}>
                              <Col span={24}>
                                <Form.Item label="Toplam Hareket Adeti">
                                  <Input value={`${userData.wallet?.transactions.length || 0} adet`} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>
                          <Col span={24}>
                            <Row gutter={[16, 16]}>
                              <Col span={12}>
                                <Form.Item label="Kullanıcı D.T.">
                                  <Input value={formatDateOnly(userData.birth_date)} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="Email Adresi">
                                  <Input value={userData.user?.email} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>



                          {/* Uyruk - Şehir - Cinsiyet yan yana */}
                          <Col span={24}>
                            <Row gutter={[16, 16]}>
                              <Col span={8}>
                                <Form.Item label="Uyruk">
                                  <Input value={userData.nation || "-"} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item label="Şehir">
                                  <Input value={userData.city || "-"} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item label="Cinsiyet">
                                  <Input value={userData.gender || "-"} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>
                          <Col span={24}>
                            <Row gutter={[16, 16]}>
                              <Col span={12}>
                                <Form.Item label="Cüzdan Miktarı">
                                  <Input value={`${Number(userData.wallet?.balance).toFixed(2)}  ₺`} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>

                              <Col span={12}>
                                <Form.Item label="WeePuan Miktarı">
                                  <Input value={`${Number(userData?.wallet?.score || 0).toFixed(2)} Wee Puan`} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>

                          <Col span={24}>
                            <Form.Item label="Kullanıcı Telefon Adı">
                              <Input value={userData.OSBuildNumber || "-"} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Kullanıcı Referans Kodu">
                              <Input value={userData.referenceCode} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item label="Takip Et Kazan Kampanyası">
                              <Input value={userData.followSocial} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>

                          <Col span={24}>
                            <Col>

                            </Col>
                            <Form.Item label="Kullanıcı Durumu">
                              <Select
                                value={userPassiveType}
                                onChange={(value) => setUserPassiveType(value)}
                                style={{ minWidth: "150px" }}
                                options={[
                                  { value: 'NONE', label: 'NORMAL' },
                                  { value: 'DELETED', label: 'SİLİNDİ' },
                                  { value: 'BLOCKED', label: 'KARA LİSTE' },
                                  { value: 'SUSPENDED', label: 'ASKIYA AL' },
                                ]}
                              >
                              </Select>
                            </Form.Item>

                            <Button type="primary" onClick={() => handleIsActiveChange(userPassiveType, "user")} style={{ width: '100%' }}>
                              Kaydet
                            </Button>
                          </Col>
                          {
                            userData?.wallet?.cards[0] ?
                              <Col span={24}>
                                <Form.Item label="Kart Durumu" >
                                  <Select
                                    //defaultValue={value}
                                    value={cardIsActive}
                                    onChange={(value) => setCardIsActive(value)}
                                    style={{ minWidth: "150px" }}
                                    options={[
                                      { value: true, label: 'Güvenli' },
                                      { value: false, label: 'Şüpheli' },
                                    ]}
                                  />
                                </Form.Item>
                                <Button type="primary" onClick={() => handleIsActiveChange(cardIsActive, "card")} style={{ width: '100%' }}>
                                  Kaydet
                                </Button>
                              </Col>
                              :
                              <>
                              </>
                          }
                        </Row>
                      </Form>
                    </TabPane>

                    {/* Yüklemeler Tab */}
                    <TabPane tab={`Yüklemeler (${uploads.length})`} key="2">
                      <Row gutter={[24]} justify="space-between" align="middle">
                        <Col span={24}>
                          <Button
                            type="primary"
                            style={{ marginBottom: 10, width: isMobile ? "100%" : "auto" }}
                            onClick={() => exportToExcel(excelDataUploads, excelFileNameUploads)}
                          >
                            Excel İndir
                          </Button>
                        </Col>
                        <Col span={24} style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                          <Input
                            style={{ width: "100%" }}
                            placeholder="ara"
                            onChange={(e) => {
                              const val = e.target.value;
                              const filtered = uploads.filter(u =>
                              (u.transaction_id?.toString().includes(val) ||
                                u.payment_gateway?.toLowerCase().includes(val.toLowerCase()) ||
                                u.fineType?.toLowerCase().includes(val.toLowerCase()) ||
                                u.qrlabel?.toString().includes(val)
                              )
                              );

                              setFilteredUploads(filtered);
                            }}
                          />
                        </Col>

                        <Col span={24}>
                          <Form layout="vertical" justify="end" >
                            <Row gutter={[24]} justify="end">
                              <Col span={12}>
                                <Form.Item label="Yükleme">
                                  <Input value={counts["iyzico"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="Hediye">
                                  <Input value={counts["hediye"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="Ceza">
                                  <Input value={counts["ceza/fine"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="İyzico İade">
                                  <Input value={counts["iyzico/iade"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={12}>
                                <Form.Item label="İade">
                                  <Input value={counts["iade/return"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Form>
                        </Col>
                      </Row>

                      <Table
                        columns={[
                          uploadColumns[0],
                          uploadColumns[1],
                        ]}
                        size="small"
                        dataSource={filteredUploads}
                        rowKey={(record, index) => record.id || `row-${index}`}
                        scroll={{ x: true }}
                        pagination={{
                          position: ["bottomCenter"],
                          pageSizeOptions: ["5", "10", "20", "50"],
                          size: paginationSize,
                        }}
                        expandable={{
                          expandedRowRender: (record) => (
                            <div style={{ padding: 16, background: "#fafafa" }}>
                              <p><strong>Yükleme ID:</strong> {record.transaction_id || "-"}</p>
                              <p><strong>Ceza Türü:</strong> {record.fineType || "-"}</p>
                              <p><strong>QR:</strong> {record.qrlabel || "-"}</p>
                              <p><strong>Tutar:</strong> {record.amount || "-"}</p>
                              <p><strong>İşlem Versiyon:</strong> {record.version || "-"}</p>
                              <p><strong>Durum:</strong> {record.status || "-"}</p>
                            </div>
                          ),

                          rowExpandable: (record) => true,
                          expandRowByClick: true,

                        }}
                      />
                    </TabPane>

                    {/* Kiralamalar Tab */}

                    <TabPane tab={`Kiralamalar (${rentals.length})`} key="3">
                      <Button
                        type="primary"
                        style={{ marginBottom: 10, width: isMobile ? "100%" : "auto" }}
                        onClick={() => exportToExcel(excelDataRentals, excelFileNameRentals)}
                      >
                        Excel İndir
                      </Button>
                      <Col span={24} style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <Input
                          style={{ width: "100%" }}
                          placeholder="Ara"
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase();

                            const filtered = rentals.filter((r) => {
                              const qr = r.rental?.device?.qrlabel?.toLowerCase() || "";
                              const start = formatDateTime(r.rental?.start).toLowerCase();
                              const end = formatDateTime(r.rental?.end).toLowerCase();
                              const finishedUser = r.rental?.finishedUser?.name?.toLowerCase() || "";
                              const amount = r.amount?.toString().toLowerCase() || "";
                              const version = (r.version || r.rental?.version || r.ip || "")
                                .toString()
                                .toLowerCase();

                              return (
                                qr.includes(val) ||
                                start.includes(val) ||
                                end.includes(val) ||
                                finishedUser.includes(val) ||
                                amount.includes(val) ||
                                version.includes(val)
                              );
                            });

                            setFilteredRentals(filtered);
                          }}
                        />
                      </Col>
                      <Table
                        columns={[rentalColumns[0], rentalColumns[1]]}
                        dataSource={filteredRentals}
                        size="small"
                        expandable={{
                          expandedRowRender: (record) => (
                            <Descriptions
                              bordered
                              size="small"
                              column={1}
                              style={{ margin: 10 }}
                            >
                              <Descriptions.Item label="Bitiş">
                                {formatDateTime(record.rental?.end)}
                              </Descriptions.Item>

                              <Descriptions.Item label="Sonlandıran">
                                {record.rental?.finishedUser?.name || "Kullanıcı"}
                              </Descriptions.Item>

                              <Descriptions.Item label="Süre">
                                {(() => {
                                  if (record.rental?.start && record.rental?.end) {
                                    const s = new Date(record.rental.start);
                                    const e = new Date(record.rental.end);
                                    const diff = Math.floor((e - s) / 1000);
                                    const h = Math.floor(diff / 3600);
                                    const m = Math.floor((diff % 3600) / 60);
                                    const sec = diff % 60;
                                    return `${h}h ${m}m ${sec}s`;
                                  }
                                  return "-";
                                })()}
                              </Descriptions.Item>

                              <Descriptions.Item label="Tutar">
                                {record.amount != null
                                  ? record.type === -3
                                    ? `${Number(record.amount).toFixed(2)} WeePuan`
                                    : record.type === -1
                                      ? `${Number(record.amount).toFixed(2)} ₺`
                                      : "-"
                                  : "-"}
                              </Descriptions.Item>

                              <Descriptions.Item label="İşlem Versiyon">
                                {record.version || record.rental?.version || record.ip || "-"}
                              </Descriptions.Item>

                              <Descriptions.Item label="Harita">
                                <Button
                                  type="primary"
                                  icon={<GlobalOutlined />}
                                  onClick={() => openMapModal(record.rental.avldatas)}
                                />
                              </Descriptions.Item>

                              {user?.permissions?.showImage && (
                                <Descriptions.Item label="Görsel">
                                  <Button
                                    type="primary"
                                    disabled={!record?.rental?.imageObj}
                                    icon={<CameraFilled />}
                                    onClick={() => {
                                      showImage(record?.rental?.imageObj);
                                      setIsModalOpen(true);
                                    }}
                                  />
                                </Descriptions.Item>
                              )}
                              {user?.permissions?.rentalUpdate && (
                                <Descriptions.Item label="Sürüşü Düzenle">
                                  <Button type="primary">
                                    <Link to={`/panel/users/showRental/${record.rental._id}`}>
                                      Sürüş Düzenle
                                    </Link>
                                  </Button>
                                </Descriptions.Item>
                              )}

                            </Descriptions>
                          ),

                          rowExpandable: (record) => true,
                          expandRowByClick: true,
                        }}
                        rowKey={(record, index) => record.id || `row-${index}`}
                        scroll={{ x: true }}
                        pagination={{
                          position: ["bottomCenter"],
                          pageSizeOptions: ["5", "10", "20", "50"],
                          size: paginationSize,
                        }}
                      />
                    </TabPane>

                    {/* Kampanyalar Tab */}
                    <TabPane tab={`Kampanyalar (${campaigns.length})`} key="4">
                      <Button
                        type="primary"
                        style={{
                          width: isMobile ? "100%" : "auto",
                          marginBottom: 16,
                        }}
                        onClick={() =>
                          exportToExcel(excelDataCampaigns, excelFileNameCampaigns)
                        }
                      >
                        Excel İndir
                      </Button>
                      <Col span={24} style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
                        <Input
                          style={{ width: "100%" }}
                          placeholder="Ara"
                          onChange={(e) => {
                            const val = e.target.value.toLowerCase();

                            const filtered = campaigns.filter((r) => {
                              const date = formatDateTime(r.date).toLowerCase();
                              const transactionId = r.transaction_id?.toString().toLowerCase() || "";
                              const amount = r.amount?.toString().toLowerCase() || "";
                              const version = (r.version || r.ip || "").toString().toLowerCase();

                              return (
                                date.includes(val) ||
                                transactionId.includes(val) ||
                                amount.includes(val) ||
                                version.includes(val)
                              );
                            });

                            setFilteredCampaigns(filtered);
                          }}
                        />
                      </Col>
                      <Table
                        columns={[
                          // sadece ilk 2 sütun görünsün
                          campaignColumns[0],
                          campaignColumns[1],
                        ]}
                        dataSource={filteredCampaigns}
                        size="small"

                        rowKey={(record, index) => record.id || `row-${index}`}
                        scroll={{ x: true }}
                        pagination={{
                          position: ["bottomCenter"],
                          pageSizeOptions: ["5", "10", "20", "50"],
                          size: paginationSize,
                        }}
                        expandable={{
                          // + butonuna tıklanınca gösterilecek detay alanı
                          expandedRowRender: (record) => (
                            <div style={{ marginLeft: 20 }}>
                              {campaignColumns.slice(2).map((col) => (
                                <p key={col.key || col.dataIndex}>
                                  <b>{col.title}:</b> {record[col.dataIndex]}
                                </p>
                              ))}
                            </div>
                          ),
                          expandRowByClick: true, // satıra tıklayarak da açma
                        }}
                      />
                    </TabPane>
                    {user?.permissions?.addGift && (
                      <TabPane tab={`Para İşlemleri`} key="5">
                        <Form layout="vertical" labelAlign="left">

                          <Col span={24}>
                            <Form.Item label="Kullanıcı Adı Soyadı">
                              <Input disabled style={{ color: "black" }} value={userData.user?.name} />
                            </Form.Item>
                          </Col>
                          <Col span={24}>
                            <Form.Item label="Kullanıcı GSM">
                              <Input disabled style={{ color: "black" }} value={userData.gsm} />
                            </Form.Item>
                          </Col>


                          <Col span={24}>
                            <Form.Item label="İşlem Türü">
                              <Select
                                value={transactionType}
                                onChange={setTransactionType}
                                style={{ minWidth: "150px" }}
                                options={[{ value: '1', label: 'Hediye Ekle' },
                                { value: '2', label: 'Para İade' },
                                { value: '3', label: 'Ceza Ekle' },
                                { value: '4', label: 'İyzico Para İade' },
                                { value: '5', label: 'Wee Puan Ekle' }]}
                              />
                            </Form.Item>
                          </Col>

                          {['1', '2', '5'].includes(transactionType) && (
                            <Col span={24}>
                              <Form.Item label="Tutar">
                                <Input style={{ color: "black" }} value={amount} onChange={e => setAmount(e.target.value)} />
                              </Form.Item>
                            </Col>
                          )}

                          {transactionType === '3' && (
                            <>
                              <Col span={24}>
                                <Form.Item label="Ceza Türü">
                                  <Select
                                    value={fineType}
                                    onChange={setFineType}
                                    style={{ minWidth: "150px" }}
                                    options={[
                                      { value: 'park', label: 'Park' },
                                      { value: 'lock', label: 'Kilit' },
                                      { value: 'photo', label: 'Fotoğraf' },
                                      { value: 'damage', label: 'Cihaz Hasar' },
                                      { value: 'stolenCard', label: 'Çalıntı Kart' },
                                      { value: 'stolenDevice', label: 'Çalıntı Cihaz' },
                                      { value: 'other', label: 'Diğer' },
                                    ]}
                                  />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item label="QR Kod">
                                  <Input style={{ color: "black" }} value={qrCode} onChange={e => setQrCode(e.target.value)} />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item label="Tutar">
                                  <Input style={{ color: "black" }} value={amount} onChange={e => setAmount(e.target.value)} />
                                </Form.Item>
                              </Col>
                            </>
                          )}

                          {transactionType === '4' && (
                            <>
                              <Col span={24}>
                                <Form.Item label="Tutar">
                                  <Input style={{ color: "black" }} value={amount} onChange={e => setAmount(e.target.value)} />
                                </Form.Item>
                              </Col>
                              <Col span={24}>
                                <Form.Item label="İşlem No">
                                  <Input style={{ color: "black" }} value={iyzicoID} onChange={e => setTransactionNo(e.target.value)} />
                                </Form.Item>
                              </Col>
                            </>
                          )}


                          <Col span={24}>
                            <Button type="primary" style={{ width: '100%' }} onClick={handleMakeMoney}>
                              İşlemi Kaydet
                            </Button>
                          </Col>
                        </Form>
                      </TabPane>
                    )}

                  </Tabs>
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
                  {/* Büyük Harita Modal */}
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
              ) : (
                <Card style={{ marginTop: 20 }}>
                  <Tabs defaultActiveKey="1">
                    {/* Bilgiler Tab */}
                    <TabPane tab="Bilgiler" key="1">
                      <Form layout="vertical">
                        <Row gutter={[16, 16]}>

                          <Col span={6}>
                            <Form.Item label="Kullanıcı Adı Soyadı">
                              <Input value={userData.user?.name} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item label="TC Kimlik Numarası">
                              <Input value={userData.tckno} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="Toplam Hareket Adeti">
                              <Input value={`${userData.wallet?.transactions.length || 0} adet`} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>

                          <Col span={6}>
                            <Form.Item label="Kullanıcı Doğum Tarihi">
                              <Input value={formatDateOnly(userData.birth_date)} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item label="Email Adresi">
                              <Input value={userData.user?.email} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>

                          {/* Uyruk - Şehir - Cinsiyet yan yana */}
                          <Col span={12}>
                            <Row gutter={[16, 16]}>
                              <Col span={8}>
                                <Form.Item label="Uyruk Bilgisi">
                                  <Input value={userData.nation || "-"} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item label="Şehir Bilgisi">
                                  <Input value={userData.city || "-"} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item label="Cinsiyet Bilgisi">
                                  <Input value={userData.gender || "-"} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>
                          <Col span={12}>
                            <Row gutter={[16, 16]}>
                              <Col span={12}>
                                <Form.Item label="Cüzdan Miktarı">
                                  <Input value={`${Number(userData.wallet?.balance).toFixed(2)}  ₺`} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>

                              <Col span={12}>
                                <Form.Item label="WeePuan Miktarı">
                                  <Input value={`${Number(userData?.wallet?.score || 0).toFixed(2)} Wee Puan`} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Col>

                          <Col span={12}>
                            <Form.Item label="Kullanıcı Telefon Adı">
                              <Input value={userData.OSBuildNumber || "-"} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item label="Kullanıcı Referans Kodu">
                              <Input value={userData.referenceCode} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>
                          <Col span={6}>
                            <Form.Item label="Takip Et Kazan Kampanyası">
                              <Input value={userData.followSocial} disabled style={{ color: "black" }} />
                            </Form.Item>
                          </Col>

                          <Col span={6}>
                            <Form.Item label="Kullanıcı Durumu">
                              <Select
                                value={userPassiveType}
                                onChange={(value) => setUserPassiveType(value)}
                                style={{ minWidth: "150px" }}
                                options={[
                                  { value: 'NONE', label: 'NORMAL' },
                                  { value: 'DELETED', label: 'SİLİNDİ' },
                                  { value: 'BLOCKED', label: 'KARA LİSTE' },
                                  { value: 'SUSPENDED', label: 'ASKIYA AL' },
                                ]}
                              >
                              </Select>
                            </Form.Item>
                            <Button type="primary" onClick={() => handleIsActiveChange(userPassiveType, "user")}>
                              Kaydet
                            </Button>
                          </Col>
                          {
                            userData?.wallet?.cards[0] ?
                              <Col span={6}>
                                <Form.Item label="Kart Durumu" >
                                  <Select
                                    //defaultValue={value}
                                    value={cardIsActive}
                                    onChange={(value) => setCardIsActive(value)}
                                    style={{ minWidth: "150px" }}
                                    options={[
                                      { value: true, label: 'Güvenli' },
                                      { value: false, label: 'Şüpheli' },
                                    ]}
                                  />
                                </Form.Item>
                                <Button type="primary" onClick={() => handleIsActiveChange(cardIsActive, "card")}>
                                  Kaydet
                                </Button>
                              </Col>
                              :
                              <>
                              </>
                          }
                        </Row>
                      </Form>
                    </TabPane>

                    {/* Yüklemeler Tab */}
                    <TabPane tab={`Yüklemeler (${uploads.length})`} key="2">
                      <Row gutter={[24]} justify="space-between" align="middle">
                        <Col span={8}>
                          <Button
                            type="primary"
                            style={{ marginBottom: 10, width: isMobile ? "100%" : "auto" }}
                            onClick={() => exportToExcel(excelDataUploads, excelFileNameUploads)}
                          >
                            Excel İndir
                          </Button>
                        </Col>

                        <Col span={12}>
                          <Form layout="vertical" justify="end" >
                            <Row gutter={[24]} justify="end">
                              <Col span={4}>
                                <Form.Item label="Yükleme">
                                  <Input value={counts["iyzico"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item label="Hediye">
                                  <Input value={counts["hediye"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item label="Ceza">
                                  <Input value={counts["ceza/fine"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item label="İyz.İade">
                                  <Input value={counts["iyzico/iade"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item label="İade">
                                  <Input value={counts["iade/return"]} disabled style={{ color: "black" }} />
                                </Form.Item>
                              </Col>
                            </Row>
                          </Form>
                        </Col>

                        <Col span={24} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                          <Input
                            style={{ maxWidth: 250 }}
                            placeholder="ara"
                            onChange={(e) => {
                              const val = e.target.value;
                              const filtered = uploads.filter(u =>
                              (u.transaction_id?.toString().includes(val) ||
                                u.payment_gateway?.toLowerCase().includes(val.toLowerCase()) ||
                                u.fineType?.toLowerCase().includes(val.toLowerCase()) ||
                                u.qrlabel?.toString().includes(val)
                              )
                              );

                              setFilteredUploads(filtered);
                            }}
                          />
                        </Col>
                      </Row>


                      <Table
                        columns={uploadColumns}
                        dataSource={filteredUploads}
                        rowKey={(record, index) => record.id || `row-${index}`}
                        scroll={{ x: true }}
                        pagination={{
                          position: ["bottomCenter"],
                          pageSizeOptions: ["5", "10", "20", "50"],
                          size: paginationSize,
                        }}

                      />
                    </TabPane>

                    {/* Kiralamalar Tab */}
                    <TabPane tab={`Kiralamalar (${rentals.length})`} key="3">
                      <Row>
                        <Col span={12}>
                          <Button
                            type="primary"
                            style={{ marginBottom: 10, width: isMobile ? "100%" : "auto" }}
                            onClick={() => exportToExcel(excelDataRentals, excelFileNameRentals)}
                          >
                            Excel İndir
                          </Button>
                        </Col>
                        <Col span={12} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                          <Input
                            style={{ maxWidth: 250 }}
                            placeholder="Ara"
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase();

                              const filtered = rentals.filter((r) => {
                                const qr = r.rental?.device?.qrlabel?.toLowerCase() || "";
                                const start = formatDateTime(r.rental?.start).toLowerCase();
                                const end = formatDateTime(r.rental?.end).toLowerCase();
                                const finishedUser = r.rental?.finishedUser?.name?.toLowerCase() || "";
                                const amount = r.amount?.toString().toLowerCase() || "";
                                const version = (r.version || r.rental?.version || r.ip || "")
                                  .toString()
                                  .toLowerCase();

                                return (
                                  qr.includes(val) ||
                                  start.includes(val) ||
                                  end.includes(val) ||
                                  finishedUser.includes(val) ||
                                  amount.includes(val) ||
                                  version.includes(val)
                                );
                              });

                              setFilteredRentals(filtered);
                            }}
                          />
                        </Col>
                      </Row>


                      <Table
                        columns={rentalColumns}
                        dataSource={filteredRentals}
                        rowKey={(record, index) => record.id || `row-${index}`}
                        scroll={{ x: true }}
                        pagination={{
                          position: ["bottomCenter"],
                          pageSizeOptions: ["5", "10", "20", "50"],
                          size: paginationSize,
                        }}
                      />
                    </TabPane>

                    {/* Kampanyalar Tab */}
                    <TabPane tab={`Kampanyalar (${campaigns.length})`} key="4">
                      <Row>
                        <Col span={12}>
                          <Button
                            type="primary"
                            style={{
                              width: isMobile ? "100%" : "auto",
                            }}
                            onClick={() => exportToExcel(excelDataCampaigns, excelFileNameCampaigns)}
                          >
                            Excel İndir
                          </Button>
                        </Col>
                        <Col span={12} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                          <Input
                            style={{ maxWidth: 250 }}
                            placeholder="Ara"
                            onChange={(e) => {
                              const val = e.target.value.toLowerCase();

                              const filtered = campaigns.filter((r) => {
                                const date = formatDateTime(r.date).toLowerCase();
                                const transactionId = r.transaction_id?.toString().toLowerCase() || "";
                                const amount = r.amount?.toString().toLowerCase() || "";
                                const version = (r.version || r.ip || "").toString().toLowerCase();

                                return (
                                  date.includes(val) ||
                                  transactionId.includes(val) ||
                                  amount.includes(val) ||
                                  version.includes(val)
                                );
                              });

                              setFilteredCampaigns(filtered);
                            }}
                          />
                        </Col>
                      </Row>

                      <Table
                        columns={campaignColumns}
                        dataSource={filteredCampaigns}
                        rowKey={(record, index) => record.id || `row-${index}`}
                        scroll={{ x: true }}
                        pagination={{
                          position: ["bottomCenter"],
                          pageSizeOptions: ["5", "10", "20", "50"],
                          size: paginationSize,
                        }}
                      />
                    </TabPane>
                    {user?.permissions?.addGift && (
                      <TabPane tab={`Para İşlemleri`} key="5">
                        <Form layout="vertical" labelAlign="left">
                          <Row gutter={[24]}>
                            <Col span={12}>
                              <Form.Item label="Kullanıcı Adı Soyadı">
                                <Input disabled style={{ color: "black" }} value={userData.user?.name} />
                              </Form.Item>
                            </Col>
                            <Col span={12}>
                              <Form.Item label="Kullanıcı GSM">
                                <Input disabled style={{ color: "black" }} value={userData.gsm} />
                              </Form.Item>
                            </Col>
                          </Row>

                          <Row gutter={[24]}>
                            <Col span={12}>
                              <Form.Item label="İşlem Türü">
                                <Select
                                  value={transactionType}
                                  onChange={setTransactionType}
                                  style={{ minWidth: "150px" }}
                                  options={[{ value: '1', label: 'Hediye Ekle' },
                                  { value: '2', label: 'Para İade' },
                                  { value: '3', label: 'Ceza Ekle' },
                                  { value: '4', label: 'İyzico Para İade' },
                                  { value: '5', label: 'Wee Puan Ekle' }]}
                                />
                              </Form.Item>
                            </Col>

                            {['1', '2', '5'].includes(transactionType) && (
                              <Col span={12}>
                                <Form.Item label="Tutar">
                                  <Input style={{ color: "black" }} value={amount} onChange={e => setAmount(e.target.value)} />
                                </Form.Item>
                              </Col>
                            )}

                            {transactionType === '3' && (
                              <>
                                <Col span={12}>
                                  <Form.Item label="Ceza Türü">
                                    <Select
                                      value={fineType}
                                      onChange={setFineType}
                                      style={{ minWidth: "150px" }}
                                      options={[
                                        { value: 'park', label: 'Park' },
                                        { value: 'lock', label: 'Kilit' },
                                        { value: 'photo', label: 'Fotoğraf' },
                                        { value: 'damage', label: 'Cihaz Hasar' },
                                        { value: 'stolenCard', label: 'Çalıntı Kart' },
                                        { value: 'stolenDevice', label: 'Çalıntı Cihaz' },
                                        { value: 'other', label: 'Diğer' },
                                      ]}
                                    />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item label="QR Kod">
                                    <Input style={{ color: "black" }} value={qrCode} onChange={e => setQrCode(e.target.value)} />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item label="Tutar">
                                    <Input style={{ color: "black" }} value={amount} onChange={e => setAmount(e.target.value)} />
                                  </Form.Item>
                                </Col>
                              </>
                            )}

                            {transactionType === '4' && (
                              <>
                                <Col span={12}>
                                  <Form.Item label="Tutar">
                                    <Input style={{ color: "black" }} value={amount} onChange={e => setAmount(e.target.value)} />
                                  </Form.Item>
                                </Col>
                                <Col span={12}>
                                  <Form.Item label="İşlem No">
                                    <Input style={{ color: "black" }} value={iyzicoID} onChange={e => setTransactionNo(e.target.value)} />
                                  </Form.Item>
                                </Col>
                              </>
                            )}
                          </Row>

                          <Row gutter={[24]} style={{ marginTop: 16 }}>
                            <Col>
                              <Button type="primary" onClick={handleMakeMoney}>
                                İşlemi Kaydet
                              </Button>
                            </Col>
                          </Row>
                        </Form>
                      </TabPane>
                    )}
                  </Tabs>
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
                  {/* Büyük Harita Modal */}
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
              )

            )}
          </div>
        </div>
      )}

      {loading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255,255,255,0.6)",
            zIndex: 10,
            borderRadius: "8px",
          }}
        >
          <Spin size="large" />
        </div>
      )}
    </>
  );
};

export default Users;
