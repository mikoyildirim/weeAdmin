import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Card, Input, Space, Tabs, Modal, Form, InputNumber, Select, Switch, Spin, App } from "antd";
import axios from "../../api/axios"; // kendi axios instance yolunu kullan
import { Link } from "react-router-dom";
import { EditOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { useIsMobile } from "../../utils/customHooks/useIsMobile";


const { TabPane } = Tabs;
const DevicesPage = () => {
  const { message } = App.useApp();
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
  const isMobile = useIsMobile(991);

  const handleAddQRToTable = () => {
    if (!qrInput) return // qr olmadan tabloya bir şey eklemez

    const newQR = {
      qr: qrInput,
    };

    setQrList([...qrList, newQR]);
    setQrInput("");
  };

  const handleRemoveQRFromTable = (index) => {
    const updated = [...qrList];
    updated.splice(index, 1);
    setQrList(updated);
  };

  const handleSubmitDevicePriceUpdate = async () => {
    try {
      await axios.patch("/devices/update/many", {
        getField: "qrlabel",
        setField: "priceObject",
        getData: qrList.map((x) => x.qr),
        setData: cityValue.split("|")[0],
      }).then((res) => {
        const matchedCount = res.data.matchedCount
        const modifiedCount = res.data.modifiedCount
        message.success(<div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <div>Eşleşen cihaz sayısı: <span style={{ fontWeight: 700 }}>{matchedCount}</span></div>
          <div>Güncellenen cihaz sayısı: <span style={{ fontWeight: 700 }}>{modifiedCount}</span></div>
        </div>)
        // console.log(res)
      })
        .finally(() => {
          fetchDevices() // şehirlerin ücret güncellenmesi tamamlandıktan sonra tüm cihazların tablosunun güncellemek için
        })

      setQrList([]);
    } catch (error) {
      // console.log(error)
      message.error(<>Gönderim sırasında hata oluştu<br />{error.response.data.error.message}</>);
    }
  };

  const handleSubmitCityPriceUpdate = async (values) => {
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
        message.success("Şehir ücretlendirmesi güncellendi.");
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

  const fetchDangerType = async (qrlabel) => {
    try {
      await axios.post(`devices/update/danger`, {
        qrlabel: qrlabel,
        dangerType: "SAFE", // dangerType = SAFE
      });
      message.success("Cihaz Güvenli durumuna alındı.")
      fetchDevices() // işlem yapıldıktan sonra tabloyu yenilemek için tekrardan bütün cihazlar çekilir.
    } catch (e) { message.error(e.response.data.error.message) }
  }

  useEffect(() => {
    fetchDevices();
    fetchPrices()
  }, []);

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

  // Anlık filtreleme cihazlar
  useEffect(() => {
    const filtered = devices.filter((d) => {
      const text = `${d.qrlabel} ${d.imei} ${d.serial_number} ${d.gsm} ${d.city} ${d.town}`.toLowerCase();
      return text.includes(searchTextDevices.toLowerCase());
    });
    setFilteredDevices(filtered);
  }, [searchTextDevices, devices]);

  // Anlık filtreleme ücretler
  useEffect(() => {
    const filtered = prices.filter((d) => {
      const text = `${d.name} ${d.startPrice} ${d.minutePrice} ${d.priceRate}`.toLowerCase();
      return text.includes(searchTextPrices.toLowerCase());
    });
    setFilteredPrices(filtered);
  }, [searchTextPrices, prices]);

  const getMobileColumnsForPrices = (columns) => {
    return columns.map((col, index) => ({
      ...col,
      responsive: index === 0 || index === 4 ? ["xs", "sm", "md", "lg"] : ["md"],
    }));
  };

  const getMobileExpandableForPrices = (columns) => ({
    expandedRowRender: (record) => (
      <div style={{ paddingLeft: 10 }}>
        {columns.slice(1, -1).map(col => ( // birinci ve sonuncu kolonları expand içerisine göstermiyor
          <p key={col.key || col.dataIndex}>
            <b>{col.title}:</b> {record[col.dataIndex]}
          </p>
        ))}
      </div>
    ),
    expandRowByClick: true,
  });

  const getMobileColumnsForDevices = (columns) => {
    return columns.filter(col => col.key === "qrlabel" || col.key === "actions");
  };

  const getMobileExpandableForDevices = (columns) => ({
    expandedRowRender: (record) => (
      <div style={{ paddingLeft: 10 }}>
        {columns
          .filter(col => col.key !== "qrlabel" && col.key !== "actions") // görünür kolonları çıkar
          .map(col => (
            <div key={col.key || col.dataIndex} style={{ marginBottom: 8 }}>
              <b>{col.title}:</b>{" "}
              {col.render
                ? col.render(record[col.dataIndex], record)
                : record[col.dataIndex]}
            </div>
          ))}
      </div>
    ),
  });

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

  let columnsPrices = [
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
  ]

  if (user?.permissions?.updatePrice) { // izin varsa güncelleyebilir.
    columnsPrices.push({
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
      ),
    });
  }

  const columnsDevices = [
    {
      title: "QR Label",
      align: "center",
      dataIndex: "qrlabel",
      key: "qrlabel",
      render: (_, record) => {
        return user?.permissions?.updateDevice ? (
          <Button type="link">
            <Link to={`/panel/devices/update/${record?._id}`}>
              <span style={{ userSelect: "text" }}>{record?.qrlabel}</span>
            </Link>
          </Button>
        ) : (
          <span style={{ userSelect: "text" }}>{record?.qrlabel}</span>
        );
      },
      sorter: (a, b) => a.qrlabel?.localeCompare(b.qrlabel),
    },
    { title: "IMEI", align: "center", dataIndex: "imei", key: "imei" },
    { title: "Seri No", align: "center", dataIndex: "serial_number", key: "serial_number" },
    { title: "Key Secret", align: "center", dataIndex: "key_secret", key: "key_secret" },
    { title: "GSM", align: "center", dataIndex: "gsm", key: "gsm", },
    { title: "Batarya (%)", align: "center", dataIndex: "battery", key: "battery", sorter: (a, b) => (a.battery || 0) - (b.battery || 0), },
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
      sorter: (a, b) => `${a.city} ${a.town}`.localeCompare(`${b.city} ${b.town}`),
    },
    { title: "Durum", align: "center", dataIndex: "status", key: "status", sorter: (a, b) => a.status?.localeCompare(b.status), },
    {
      title: "Son Görülme",
      align: "center",
      dataIndex: "last_seen",
      key: "last_seen",
      render: (val) => (val ? new Date(val).toLocaleString() : ""),
      sorter: (a, b) => {
        const t1 = a.last_seen ? new Date(a.last_seen).getTime() : 0;
        const t2 = b.last_seen ? new Date(b.last_seen).getTime() : 0;
        return t1 - t2;
      },
    },
    {
      title: "Tehlike Durumu",
      align: "center",
      key: "danger",
      render: (_, record) => renderDangerStatus(record?.danger?.type),
      sorter: (a, b) =>
        (a?.danger?.type || "").localeCompare(b?.danger?.type || ""),
    },
    {
      title: "Durum Güncelle",
      align: "center",
      key: "updateDangerType",
      render: (_, record) => (<Button type="primary" onClick={() => { fetchDangerType(record.qrlabel) }} >Güvenliye Al</Button>)
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
        <Button danger size="small" onClick={() => handleRemoveQRFromTable(index)}>
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


            {!isMobile ? (
              <Space style={{ marginBottom: 16 }}>
                {user?.permissions?.addDevice && (
                  <Button type="primary">
                    <Link to={`/panel/devices/create`}>
                      Cihaz Oluştur
                    </Link>
                  </Button>
                )}

                <Input
                  placeholder="Cihaz ara..."
                  value={searchTextDevices}
                  onChange={(e) => setSearchTextDevices(e.target.value)}
                  allowClear
                  style={{ width: 300 }}
                />
              </Space>
            ) : (
              <Space
                direction="vertical"
                style={{ width: "100%", marginBottom: 16 }}
                size={16} // aradaki boşluk
              >
                {user?.permissions?.addDevice && (
                  <Button
                    type="primary"
                    style={{ width: "100%" }}
                    onClick={() => setOpenModal(true)}
                  >
                    <Link to={`/panel/devices/create`}>
                      Cihaz Oluştur
                    </Link>
                  </Button>
                )}

                <Input
                  placeholder="Cihaz ara..."
                  value={searchTextDevices}
                  onChange={(e) => setSearchTextDevices(e.target.value)}
                  allowClear
                  style={{ width: "100%" }}
                />
              </Space>
            )}
            <Table
              columns={isMobile ? getMobileColumnsForDevices(columnsDevices) : columnsDevices}
              expandable={isMobile ? getMobileExpandableForDevices(columnsDevices) : undefined}
              dataSource={filteredDevices}
              loading={loading}
              rowKey={(record) => record._id}
              scroll={{ x: true }}
              pagination={{ size: isMobile ? "small" : "large" }}
            />
          </TabPane>


          <TabPane tab="Ücret Düzenleme" key="2">
            {user?.permissions?.addPrice && (
              <>
                {
                  !isMobile ? (
                    <Space style={{ marginBottom: 16 }}>
                      <Button type="primary" onClick={() => setOpenModal(true)}>
                        Şehir Oluştur
                      </Button>
                      <Input
                        placeholder="Ara..."
                        value={searchTextPrices}
                        onChange={(e) => setSearchTextPrices(e.target.value)}
                        allowClear
                        style={{ width: 300 }}
                      />
                    </Space>
                  ) : (
                    <Space
                      direction="vertical"
                      style={{ width: "100%", marginBottom: 16 }}
                      size={16} // aradaki boşluk
                    >
                      <Button
                        type="primary"
                        style={{ width: "100%" }}
                        onClick={() => setOpenModal(true)}
                      >
                        Şehir Oluştur
                      </Button>
                      <Input
                        placeholder="Ara..."
                        value={searchTextPrices}
                        onChange={(e) => setSearchTextPrices(e.target.value)}
                        allowClear
                        style={{ width: "100%" }}
                      />
                    </Space>
                  )}
              </>
            )}




            <Table
              columns={isMobile ? getMobileColumnsForPrices(columnsPrices) : columnsPrices}
              expandable={isMobile ? getMobileExpandableForPrices(columnsPrices) : undefined}
              dataSource={filteredPrices}
              loading={loading}
              rowKey={(record) => record._id}
              scroll={{ x: true }}
            />
          </TabPane>


          {user?.permissions?.updateDevice && (
            <TabPane tab="Cihaz Ücret Ataması" key="3">
              <Spin spinning={loading}>
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
                        onPressEnter={handleAddQRToTable}
                      />
                      <Button type="primary" onClick={handleAddQRToTable} >
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
                    onClick={handleSubmitDevicePriceUpdate}
                    disabled={qrList.length === 0}
                  >
                    Gönder
                  </Button>
                </Form>
              </Spin>
            </TabPane>
          )}
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
          <Form form={form} layout="vertical" onFinish={handleSubmitCityPriceUpdate}>
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
