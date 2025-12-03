import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message, Card, Input, Space, Tabs, Modal, Form, InputNumber, Select, Switch } from "antd";
import axios from "../../api/axios"; // kendi axios instance yolunu kullan
import { Link } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";


const { TabPane } = Tabs;
const DevicesPage = () => {
  const [devices, setDevices] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const [prices, setPrices] = useState([]);
  const [filteredPrices, setFilteredPrices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTextDevices, setSearchTextDevices] = useState("");
  const [searchTextPrices, setSearchTextPrices] = useState("");
  const [form] = Form.useForm();
  const [openModal, setOpenModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);
  const user = useSelector((state) => state.auth.user);





  const [qrList, setQrList] = useState([]);
  const [cityValue, setCityValue] = useState("");
  const [tableVisible, setTableVisible] = useState(true);
  const [qrInput, setQrInput] = useState("");

  const handleAddQR = () => {
    if (!qrInput) return message.warning("QR boş olamaz.");

    const newQR = {
      qr: qrInput,
    };

    setQrList([...qrList, newQR]);
    setQrInput("");
  };

  const handleRemoveQR = (index) => {
    const updated = [...qrList];
    updated.splice(index, 1);
    setQrList(updated);
  };

  const handleSubmit = async () => {
    console.log(cityValue.split("|")[0])
    try {
      await axios.patch("/devices/update/many", {
        getField: "qrlabel",
        setField: "priceObject",
        getData: qrList.map((x) => x.qr),
        setData: cityValue.split("|")[0],
      })
        .then((res) => {
          console.log(res.data)
        })
        .catch((err) => {
          console.log(err.data)
        })
        .finally(() => { })

      setQrList([]);
    } catch (error) {
      message.error("Gönderim sırasında hata oluştu");
    }
  };










  useEffect(() => {
    if (openModal) {
      if (editingPrice) {
        form.setFieldsValue({
          city: editingPrice.name,
          startingFee: editingPrice.startPrice,
          perMinuteFee: editingPrice.minutePrice,
          rate: editingPrice.priceRate,
        });
      } else {
        form.resetFields(); // yeni oluşturma
      }
    }
  }, [openModal, editingPrice, form]);


  const handleFinish = async (values) => {
    try {
      if (editingPrice) {
        // console.log(editingPrice)
        // console.log({
        //   "name": values.city,
        //   "startPrice": values.startingFee,
        //   "minutePrice": values.perMinuteFee,
        //   "priceRate": values.rate,
        // })
        // GÜNCELLEME İSTEĞİ
        await axios.patch(`/prices/${editingPrice._id}`, {
          name: values.city,
          startPrice: values.startingFee,
          minutePrice: values.perMinuteFee,
          priceRate: values.rate,
        });
        message.success("Şehir fiyatı güncellendi.");
      } else {
        // YENİ OLUŞTURMA
        await axios.post("/prices", {
          tenant: user?.tenant || null,
          name: values.city,
          startPrice: values.startingFee,
          minutePrice: values.perMinuteFee,
          priceRate: values.rate,
        });
        // console.log({
        //   "name": values.city,
        //   "startPrice": values.startingFee,
        //   "minutePrice": values.perMinuteFee,
        //   "priceRate": values.rate,
        // })

        message.success("Yeni şehir fiyatı oluşturuldu.");
      }

      form.resetFields();
      setEditingPrice(null);
      setOpenModal(false);
      fetchPrices(); // tabloları yenilemek için
      fetchDevices()
    } catch (error) {
      message.error("Bir hata oluştu.");
    }
  };

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/devices"); // API endpoint
      setDevices(res.data || []);
      setFilteredDevices(res.data || []);
    } catch (err) {
      message.error("Cihazlar yüklenirken hata oluştu!");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async () => {
    try {
      const res = await axios.get("/prices");
      setPrices(res.data || [])
      setFilteredPrices(res.data || []);
    } catch (err) {
      message.error("Cihazlar yüklenirken hata oluştu!");
    }
  }

  useEffect(() => {
    fetchDevices();
    fetchPrices()
  }, []);

  // Anlık filtreleme cihazlar
  useEffect(() => {
    const filtered = devices.filter((d) => {
      const text = `${d.qrlabel} ${d.imei} ${d.serial_number} ${d.gsm} ${d.city} ${d.town}`.toLowerCase();
      return text.includes(searchTextDevices.toLowerCase());
    });
    setFilteredDevices(filtered);
  }, [searchTextDevices, devices]);

  // Anlık filtreleme cihazlar ücretler
  useEffect(() => {
    const filtered = prices.filter((d) => {
      const text = `${d.name} ${d.startPrice} ${d.minutePrice} ${d.priceRate}`.toLowerCase();
      return text.includes(searchTextPrices.toLowerCase());
    });
    setFilteredPrices(filtered);
  }, [searchTextPrices, prices]);

  const renderDangerStatus = (type) => {
    switch (type) {
      case "SAFE":
        return <Tag color="green">GÜVENDE</Tag>;
      case "UNKNOWN":
        return <Tag color="blue">BİLİNMİYOR</Tag>;
      case "ILLEGAL_MOVE":
        return <Tag color="black">YASADIŞI HAREKET</Tag>;
      case "FALLING_DOWN":
        return <Tag color="orange">DÜŞÜRÜLDÜ</Tag>;
      case "ILLEGAL_REMOVED":
        return <Tag color="red">PARÇA SÖKME</Tag>;
      case "LOW_POWER":
        return <Tag color="orange">DÜŞÜK PİL GÜCÜ</Tag>;
      case "LIFTED_UP":
        return <Tag color="purple">KALDIRILDI</Tag>;
      case "ILLEGAL_DEMOLITION":
        return <Tag color="red">PARÇA KIRMA</Tag>;
      default:
        return <Tag color="default">BİLİNMİYOR</Tag>;
    }
  };

  const columnsPrices = [
    {
      title: "Şehir",
      align: "center",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Başlangıç Ücreti",
      align: "center",
      dataIndex: "startPrice",
      key: "startPrice",
    },
    {
      title: "Dakika Ücreti",
      align: "center",
      dataIndex: "minutePrice",
      key: "minutePrice",
    },
    {
      title: "Oran",
      align: "center",
      dataIndex: "priceRate",
      key: "priceRate",
    },
    {
      title: "Düzenle",
      align: "center",
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <EditOutlined
            style={{ cursor: "pointer", fontSize: 18 }}
            onClick={() => {
              setEditingPrice(record);
              setOpenModal(true)
            }
            }
          />
        </div>
      )
    },
  ]

  const columnsDevices = [
    {
      title: "QR Label",
      align: "center",
      dataIndex: "qrlabel",
      key: "qrlabel",
      render: (_, record) => (
        <Button type="link" >
          <Link to={`/panel/devices/update/${record?._id}`}>
            <span style={{ userSelect: "text" }}>{record?.qrlabel}</span>
          </Link>
        </Button>
      ),
    },
    { title: "IMEI", align: "center", dataIndex: "imei", key: "imei" },
    { title: "Seri No", align: "center", dataIndex: "serial_number", key: "serial_number" },
    { title: "Key Secret", align: "center", dataIndex: "key_secret", key: "key_secret" },
    { title: "GSM", align: "center", dataIndex: "gsm", key: "gsm" },
    { title: "Batarya (%)", align: "center", dataIndex: "battery", key: "battery" },
    {
      title: "Şehir/İlçe",
      align: "center",
      key: "location",
      render: (_, record) => (
        <>
          {record.city}/{record.town}
          <br />
          <Tag color="blue">{record?.priceObject?.name || "Yok"}</Tag>
        </>
      ),
    },
    { title: "Durum", align: "center", dataIndex: "status", key: "status" },
    {
      title: "Son Görülme",
      align: "center",
      dataIndex: "last_seen",
      key: "last_seen",
      render: (val) => (val ? new Date(val).toLocaleString() : ""),
    },
    {
      title: "Tehlike Durumu",
      align: "center",
      key: "danger",
      render: (_, record) => renderDangerStatus(record?.danger?.type),
    },
    {
      title: "İşlemler",
      align: "center",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          target="_blank"
          href={`https://www.google.com/maps/dir/?api=1&destination=${record?.last_location?.location?.coordinates[1] || 0
            },${record?.last_location?.location?.coordinates[0] || 0}&travelmode=driving`}
        >
          Konuma Git
        </Button>
      ),
    },
  ];

  const columnsDevicePriceAssignment = [
    {
      title: "#",
      align: "center",
      render: (_, __, index) => index + 1,
      width: 50,
    },
    {
      title: "QR",
      dataIndex: "qr",
      align: "center",
    },
    {
      title: "Kaldır",
      align: "center",
      render: (_, __, index) => (
        <Button danger size="small" onClick={() => handleRemoveQR(index)}>
          Sil
        </Button>
      ),
    },
  ];


  return (
    <>
      <h1>Cihaz Yönetimi</h1>
      <Card >
        <Tabs
          defaultActiveKey="1"
          tabBarGutter={16}
          tabBarStyle={{
            display: "flex",
            flexWrap: window.innerWidth < 768 ? "wrap" : "nowrap",
          }}
        >
          <TabPane tab="Cihazlar" key="1">
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary">
                <Link to={`/panel/devices/create`}>
                  Cihaz Oluştur
                </Link>
              </Button>
              <Input
                placeholder="Cihaz ara..."
                value={searchTextDevices}
                onChange={(e) => setSearchTextDevices(e.target.value)}
                allowClear
                style={{ width: 300 }}
              />
            </Space>
            <Table
              columns={columnsDevices}
              dataSource={filteredDevices}
              loading={loading}
              rowKey={(record) => record._id}
              scroll={{ x: true }}
            />
          </TabPane>

          <TabPane tab="Ücret Düzenleme" key="2">
            <Space style={{ marginBottom: 16 }}>
              <Button type="primary" onClick={() => { setOpenModal(true) }}>Şehir Oluştur</Button>
              <Input
                placeholder="Ücret Ara..."
                value={searchTextPrices}
                onChange={(e) => setSearchTextPrices(e.target.value)}
                allowClear
                style={{ width: 300 }}
              />
            </Space>
            <Table
              columns={columnsPrices}
              dataSource={filteredPrices}
              loading={loading}
              rowKey={(record) => record._id}
              scroll={{ x: true }}
            />
          </TabPane>

          <TabPane tab="Cihaz Ücret Ataması" key="3">
            <Form layout="vertical">
              {/* Şehir Seçimi */}
              <Form.Item label={<span> Şehir {<span style={{ color: "red" }}>(Cihazların ücreti burada seçili şehir olarak ayarlanmaktadır.)</span>}</span>}>
                <Select
                  value={cityValue}
                  onChange={setCityValue}
                  style={{ width: "100%" }}
                >
                  {prices.map((dp) => (
                    <Select.Option
                      key={dp._id}
                      value={dp._id} // şehir seçme sırasında sadece id bilgisi gönderilir.
                    >
                      Şehir: {dp.name} - Başlangıç: {dp.startPrice}₺ - Dakika: {dp.minutePrice}₺
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              {/* QR Ekleme */}
              <Form.Item label="QR">
                <Input.Group compact>
                  <Input
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    style={{ width: "calc(100% - 70px)" }}
                  />
                  <Button type="primary" onClick={handleAddQR}>
                    + Ekle
                  </Button>
                </Input.Group>
              </Form.Item>

              {/* Tablo Göster / Gizle */}
              <div style={{ marginBottom: 10 }}>
                <Switch
                  checked={tableVisible}
                  onChange={() => setTableVisible(!tableVisible)}
                />{" "}
                <span style={{ marginLeft: 8 }}>Göster / Gizle</span>
              </div>

              {/* QR Tablosu */}
              {tableVisible && (
                <Table
                  bordered
                  dataSource={qrList}
                  columns={columnsDevicePriceAssignment}
                  rowKey="qr"
                  pagination={false}
                />
              )}

              {/* Gönder */}
              <Button
                type="primary"
                style={{ marginTop: 15 }}
                onClick={handleSubmit}
                disabled={qrList.length === 0}
              >
                Gönder
              </Button>
            </Form>
          </TabPane>
        </Tabs>

        <Modal
          title={editingPrice ? "Şehir Fiyatını Düzenle" : "Yeni Şehir Fiyatı Oluştur"}
          open={openModal}
          onCancel={() => {
            form.resetFields();
            setEditingPrice(null);
            setOpenModal(false);
          }}
          footer={[
            <Button key="cancel" onClick={() => { setOpenModal(false) }}>
              İptal
            </Button>,
            <Button key="submit" type="primary" onClick={() => form.submit()}>
              {editingPrice ? "Düzenle" : "Oluştur"}

            </Button>,
          ]}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleFinish}>
            {/* Şehir (Text Input) */}
            <Form.Item
              name="city"
              label="Şehir"
              rules={[{ required: true, message: "Lütfen şehir adını girin." }]}
            >
              <Input placeholder="Örn. İstanbul" />
            </Form.Item>

            {/* Başlangıç Ücreti */}
            <Form.Item
              name="startingFee"
              label="Başlangıç Ücreti (₺)"
              rules={[
                { required: true, message: "Lütfen başlangıç ücretini girin." },
                { type: "number", min: 0, message: "Geçerli bir sayı girin." },
              ]}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={0.5} />
            </Form.Item>

            {/* Dakika Ücreti */}
            <Form.Item
              name="perMinuteFee"
              label="Dakika Ücreti (₺/dk)"
              rules={[
                { required: true, message: "Lütfen dakika ücretini girin." },
                { type: "number", min: 0, message: "Geçerli bir sayı girin." },
              ]}
            >
              <InputNumber style={{ width: "100%" }} min={0} step={0.1} />
            </Form.Item>

            {/* Oran */}
            <Form.Item
              name="rate"
              label="Oran (0-1 arası)"
              rules={[
                { required: true, message: "Lütfen oran girin." },
                { type: "number", min: 0, max: 1, message: "0-1 arası oran girin." },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                max={1000}
                step={1}
                formatter={(v) => `${v}`}
              />
            </Form.Item>
          </Form>
        </Modal>

      </Card>

    </>

  );
};

export default DevicesPage;
