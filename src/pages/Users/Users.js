import React, { useState, useEffect } from "react";
import { Card, Tabs, Form, Input, Row, Col, Select, Button, Spin, message, Table } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import exportToExcel from "../../utils/exportToExcel";
import utc from 'dayjs/plugin/utc';

import { useNavigate } from "react-router-dom";
dayjs.extend(utc);
dayjs.locale("tr");

const { TabPane } = Tabs;

const Users = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [userData, setUserData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [userPassiveType, setUserPassiveType] = useState("");
  const [cardIsActive, setCardIsActive] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [paginationSize, setPaginationSize] = useState("medium");


  const [transactionType, setTransactionType] = useState('5');
  const [amount, setAmount] = useState('');
  const [fineType, setFineType] = useState('park');
  const [qrCode, setQrCode] = useState('');
  const [iyzicoID, setTransactionNo] = useState('');


  

  const excelFileNameCharges = `${dayjs().format("DD.MM.YYYY_HH.mm")}_${phone} Yükleme Raporu.xlsx`;
  const excelFileNameRentals = `${dayjs().format("DD.MM.YYYY_HH.mm")}_${phone} Kiralama Raporu.xlsx`;
  const excelFileNameCampaigns = `${dayjs().format("DD.MM.YYYY_HH.mm")}_${phone} Kampanya Raporu.xlsx`;

  // useEffect(() => {
  //   const params = new URLSearchParams(window.location.search);
  //   const gsm = params.get("gsm");
  //   if (gsm) {
  //     setPhone(gsm);
  //     console.log("İlk yüklemede GSM:", gsm);
  //   }
  // }, []); // ✅ sadece ilk yüklemede çalışır




  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gsm = params.get("gsm");
    setPhone(gsm);
    if (gsm) {
      searchUser();
      //console.log("İlk yüklemede GSM:", gsm);
      form.setFieldsValue({ phone })
    }
  }, [phone]); // ✅ phone değişince çalışır

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  const handleIsActiveChange = async (value, cardOrUser) => {
    if (cardOrUser === "card") {
      setCardIsActive(value);
      const walletId = userData.wallet._id; // wallet ID
      const payload = { isActive: cardIsActive }
      console.log(userData.wallet.cards[0]._id)
      await axios.post(`wallets/card/isActive/${walletId}`, payload,)
        .then(res => {
          console.log(res.data)
        })
        .catch(err => {
          console.log(err)
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
          console.log(res.data)
        })
        .catch(err => {
          console.log(err)
        })
    }
  };


  const handleMakeMoney = async () => {
    try {
      const dateHourSecond = dayjs().format("HH:mm:ss")
      const date = dayjs().format("YYYY-MM-DD")
      let payload = { gsm: userData.gsm, amount };

      if (transactionType === '3') {
        payload = { ...payload, qrlabel: qrCode, fineType };
        await axios.post('/transactions/addFine', payload);
      } else {
        payload = { ...payload, type: transactionType, dateHourSecond, date };
        if (iyzicoID) payload.iyzicoID = iyzicoID;
        await axios.post('/transactions/addTransactionPanel', payload);
      }


      message.success('İşlem başarıyla kaydedildi!');
      // İşlem sonrası formu sıfırla
      setAmount('');
      setFineType('');
      setQrCode('');
      setTransactionNo('');
      setTransactionType('5');
      searchUser()

      // İstersen kullanıcı detay sayfasına yönlendirebilirsin
      // navigate(`/searchmember?gsm=${userData.gsm}`);
    } catch (error) {
      console.error(error);
      message.error('İşlem sırasında bir hata oluştu!');
    }
  };



  // transactions filtresi + sıralama
  const uploads = (userData?.wallet?.transactions?.filter(t => t.type === 1 || (t.type === -1 && !t.rental)) || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date)).reverse();

  let rentals = (userData?.wallet?.transactions?.filter(t => t.rental) || []) // transaction içerisinde rental değeri dolu ise rentals tablosuna ekle
    .sort((a, b) => new Date(a.rental?.start) - new Date(b.rental?.start))
    .reverse();


  const campaigns = (userData?.wallet?.transactions?.filter(t => t.type === 3) || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date)).reverse();


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
      "İşlem Versiyon": d.version || d.rental?.version || "-",
    };
  });

  const excelDataCampaigns = campaigns.map(d => ({ // excel ve pdf indirirken filtrelenmiş halini indirir. yani ekranda ne görünüyorsa o
    "Date": dayjs.utc(d.date).format("DD.MM.YYYY HH.mm"),
    "Yükleme ID": `${d.transaction_id} Wee Puan`,
    "Tutar": d.amount,
    "İşlem Versiyon": d.version,
  }));

  console.log(userData)
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


  const rentalColumns = [
    {
      title: "QR",
      dataIndex: ["rental", "device", "qrlabel"],
      key: "qr",
      align: "center",
      render: (_, record) => (record.rental.device.qrlabel || "-"),
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
      render: (_, record) =>
        record.version || record.rental?.version || record.ip || "-",
      sorter: (a, b) =>
        (a.version ||
          a.rental?.version ||
          a.ip ||
          "").toString().localeCompare(
            (b.version || b.rental?.version || b.ip || "").toString()
          ),
    },
    {
      title: "Görsel",
      dataIndex: "image",
      key: "image",
      align: "center",
    },
    {
      title: "Sürüşü Düzenle",
      dataIndex: "editDriving",
      key: "editDriving",
      align: "center",
    },
  ];

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
          <Form.Item name="phone" rules={[{ required: true, message: "Telefon numarası girin!" }]}>
            <Input placeholder="Telefon numarası ile ara..." style={{ width: 300, marginRight: 8 }} maxLength={15} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Kullanıcı Ara
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {loading && <Spin style={{ marginTop: 20 }} />}

      {!loading && searched && !userData && (
        <Card style={{ marginTop: 20 }}>
          <p style={{ color: "red", fontWeight: "bold" }}>Kullanıcı bulunamadı.</p>
        </Card>
      )}

      {userData && (
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
                          <Input value={`${userData?.wallet?.score || 0} Wee Puan`} disabled style={{ color: "black" }} />
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
                <Col span={12}>
                  <Button
                    type="primary"
                    style={{ marginBottom: 10, width: isMobile ? "100%" : "auto" }}
                    onClick={() => exportToExcel(excelDataUploads, excelFileNameCharges)}
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
                        <Form.Item label="İyzico İade">
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
              </Row>


              <Table
                columns={uploadColumns}
                dataSource={uploads}
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
              <Button
                type="primary"
                style={{ marginBottom: 10, width: isMobile ? "100%" : "auto" }}
                onClick={() => exportToExcel(excelDataRentals, excelFileNameRentals)}
              >
                Excel İndir
              </Button>
              <Table
                columns={rentalColumns}
                dataSource={rentals}
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
                }}
                onClick={() => exportToExcel(excelDataCampaigns, excelFileNameCampaigns)}
              >
                Excel İndir
              </Button>
              <Table
                columns={campaignColumns}
                dataSource={campaigns}
                rowKey={(record, index) => record.id || `row-${index}`}
                scroll={{ x: true }}
                pagination={{
                  position: ["bottomCenter"],
                  pageSizeOptions: ["5", "10", "20", "50"],
                  size: paginationSize,
                }}
              />
            </TabPane>
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
                        options={[
                          { value: '1', label: 'Hediye Ekle' },
                          { value: '2', label: 'Para İade' },
                          { value: '3', label: 'Ceza Ekle' },
                          { value: '4', label: 'İyzico Para İade' },
                          { value: '5', label: 'Wee Puan Ekle' },
                        ]}
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

          </Tabs>
        </Card>
      )}
    </>
  );
};

export default Users;
