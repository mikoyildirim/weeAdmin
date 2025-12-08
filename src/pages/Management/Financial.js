import React, { useEffect, useState } from "react";
import {
  Card,
  Tabs,
  Input,
  InputNumber,
  Button,
  Checkbox,
  Table,
  Modal,
  Form,
  message,
  Space,
  Typography,
  Spin,
  Tag,
  Row,
  Col
} from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import axios from "../../api/axios"; // Axios instance
import { useIsMobile } from "../../utils/customHooks/useIsMobile";

const { TabPane } = Tabs;
const { Title } = Typography;

const ManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState([]);
  const [popups, setPopups] = useState([]);

  // Tenant form states
  const [versions, setVersions] = useState([]);
  const [parameter, setParameter] = useState(0);
  const [balanceLimit, setBalanceLimit] = useState(0);
  const [priceLimit, setPriceLimit] = useState(0);
  const [priceSets, setPriceSets] = useState([]);

  // Form instance for the main tenant submission
  const [tenantForm] = Form.useForm();

  // Popup modal states
  const [isPopupModalVisible, setIsPopupModalVisible] = useState(false);
  const [editingPopup, setEditingPopup] = useState(null);
  const [popupForm] = Form.useForm();
  const isMobile = useIsMobile(991);


  // Veri çekme
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tenantsRes, popupsRes] = await Promise.all([
          axios.get("tenants"),
          axios.get("popups"),
        ]);

        const fetchedTenants = tenantsRes.data || [];
        const fetchedPopups = popupsRes.data || [];

        setTenants(fetchedTenants);
        setPopups(fetchedPopups);

        if (fetchedTenants.length > 0) {
          const t = fetchedTenants[0];
          setVersions([...t.version]);
          setParameter(t.parameter);
          setBalanceLimit(t.balanceLimit);
          setPriceLimit(t.priceLimit);
          setPriceSets([...t.priceSets]);

          // Form alanlarını doldur
          tenantForm.setFieldsValue({
            parameter: t.parameter,
            balanceLimit: t.balanceLimit,
            priceLimit: t.priceLimit,
          });
        }
        // Başarılı yüklemede bilgi mesajı
        message.success("Tüm genel ve Pop-Up verileri başarıyla yüklendi.", 2);

      } catch (error) {
        // Hata durumunda detaylı hata mesajı
        message.error("Veri çekme hatası: Sunucuya bağlanılamadı veya veriler eksik. Lütfen kontrol edin.", 5);
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Tenant işlemleri
  const addVersion = () => setVersions([...versions, ""]);
  const removeVersion = (index) => setVersions(versions.filter((_, i) => i !== index));
  const updateVersion = (index, value) =>
    setVersions(versions.map((v, i) => (i === index ? value : v)));

  const addPriceSet = () =>
    setPriceSets([...priceSets, { value: 0, popular: false, visibility: true, campaign: false, weePuan: 0 }]);
  const removePriceSet = (index) => setPriceSets(priceSets.filter((_, i) => i !== index));
  const updatePriceSet = (index, key, value) =>
    setPriceSets(priceSets.map((p, i) => (i === index ? { ...p, [key]: value } : p)));

  // GENEL BİLGİLER SEKME KAYDETME
  const handleTenantSubmit = async (values) => {
    if (!tenants[0]) {
      message.error("Tenant verisi bulunamadı. Genel parametreler kaydedilemiyor.");
      return;
    }

    // Versiyon listesi kontrolü
    const hasEmptyVersion = versions.some(v => v.trim() === "");
    if (hasEmptyVersion) {
      message.warning("Lütfen tüm **versiyon numaralarını** doldurun veya boş olanları silin. İşlem iptal edildi.");
      return;
    }

    const dataToSend = {
      version: versions.filter(v => v.trim() !== ""),
      parameter: values.parameter,
      priceLimit: values.priceLimit,
      balanceLimit: values.balanceLimit,
    };

    try {
      await axios.patch(`tenants/${tenants[0]._id}`, dataToSend);
      message.success("Tenant genel bilgileri (**WeePuan, Limitler, Versiyonlar**) başarıyla güncellendi.", 3);
      setParameter(values.parameter);
      setBalanceLimit(values.balanceLimit);
      setPriceLimit(values.priceLimit);
    } catch (error) {
      message.error("Genel parametreleri güncelleme başarısız oldu. Sunucuya giden isteği kontrol edin.", 5);
      console.error(error);
    }
  };

  // YÜKLEME TUTARLARI SEKME KAYDETME
  const handlePriceSetsSubmit = async () => {
    if (!tenants[0]) {
      message.error("Tenant verisi bulunamadı. Yükleme tutarları kaydedilemiyor.");
      return;
    }

    // Fiyat setlerinin doğrulanması
    const validationErrors = priceSets.map((p, index) => {
      const value = Number(p.value);
      const weePuan = Number(p.weePuan);

      if (isNaN(value) || value <= 0) {
        return `Hata: ${index + 1}. satırda **Yükleme Tutarı** (Value) sıfırdan büyük bir sayı olmalıdır.`;
      }
      if (isNaN(weePuan) || weePuan < 0) {
        return `Hata: ${index + 1}. satırda **WeePuan** geçerli bir sayı olmalıdır.`;
      }
      return null;
    }).filter(error => error !== null);

    if (validationErrors.length > 0) {
      // Doğrulama hatalarını birleştirerek tek bir uzun mesaj göster
      message.error(`**Yükleme Tutarları** kaydı başarısız: ${validationErrors.join(" / ")}`, 7);
      return;
    }

    const formattedPriceSets = priceSets.map((p) => ({
      ...p,
      value: Number(p.value) || 0,
      weePuan: Number(p.weePuan) || 0,
      popular: !!p.popular,
      campaign: !!p.campaign,
      visibility: !!p.visibility,
    }));

    try {
      await axios.patch(`tenants/${tenants[0]._id}`, {
        priceSets: formattedPriceSets,
      });
      message.success("Yükleme Tutarları (**Price Sets**) listesi başarıyla güncellendi ve kaydedildi.", 3);
    } catch (error) {
      message.error("Yükleme tutarları güncelleme başarısız oldu. API isteğinde bir sorun var.", 5);
      console.error(error);
    }
  }

  // PopUp işlemleri
  const openPopupModal = (popup = null) => {
    setEditingPopup(popup);
    if (popup) {
      popupForm.setFieldsValue({
        title: popup.title,
        subtitle: popup.subtitle,
        link: popup.link,
        textTr: popup.textTr,
        textEn: popup.textEn,
        isActive: popup.isActive,
      });
    } else {
      popupForm.resetFields();
      popupForm.setFieldsValue({ isActive: true });
    }
    setIsPopupModalVisible(true);
  };

  const handlePopupSubmit = async () => {
    try {
      const values = await popupForm.validateFields();
      const valuesToSend = {
        ...values,
        isActive: !!values.isActive,
      };

      if (editingPopup) {
        await axios.patch(`popups/${editingPopup._id}`, valuesToSend);
        message.success(`Popup "**${values.title}**" başarıyla güncellendi.`, 3);
      } else {
        await axios.post("popups", valuesToSend);
        message.success(`Yeni Popup (**${values.title}**) başarıyla oluşturuldu ve yayımlanabilir.`, 3);
      }

      const res = await axios.get("popups");
      setPopups(res.data);
      setIsPopupModalVisible(false);
    } catch (error) {
      if (error.errorFields) {
        message.error("Popup formu kaydedilemedi! Lütfen tüm **gerekli alanları** kontrol edin.", 5);
      } else {
        message.error("Popup kaydı sırasında beklenmedik bir sunucu hatası oluştu.", 5);
        console.error(error);
      }
    }
  };


  const priceSetsColumns = [
    {
      title: "Yükleme Tutarı (TL) *",
      dataIndex: "value",
      width: 150,
      render: (v, record, i) => (
        <InputNumber
          value={v}
          onChange={(val) => updatePriceSet(i, "value", val)}
          min={1}
          style={{ width: "100%", borderColor: (Number(v) <= 0 || isNaN(Number(v))) ? 'red' : undefined }}
        />
      ),
    },
    {
      title: "Kazanılacak WeePuan *",
      dataIndex: "weePuan",
      width: 150,
      render: (v, record, i) => (
        <InputNumber
          value={v}
          onChange={(val) => updatePriceSet(i, "weePuan", val)}
          min={0}
          style={{ width: "100%", borderColor: (Number(v) < 0 || isNaN(Number(v))) ? 'red' : undefined }}
        />
      ),
    },
    {
      title: "Popüler",
      dataIndex: "popular",
      align: 'center',
      render: (v, record, i) => (
        <Checkbox checked={v} onChange={(e) => updatePriceSet(i, "popular", e.target.checked)} />
      ),
    },
    {
      title: "Görünürlük",
      dataIndex: "visibility",
      align: 'center',
      render: (v, record, i) => (
        <Checkbox checked={v} onChange={(e) => updatePriceSet(i, "visibility", e.target.checked)} />
      ),
    },
    {
      title: "Kampanya",
      dataIndex: "campaign",
      align: 'center',
      render: (v, record, i) => (
        <Checkbox checked={v} onChange={(e) => updatePriceSet(i, "campaign", e.target.checked)} />
      ),
    },
    {
      title: "Eylem",
      width: 80,
      align: 'center',
      render: (v, record, i) => (
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => removePriceSet(i)}
          size="small"
        />
      ),
    },
  ]

  const popupsColumns = [
    { title: "Başlık", dataIndex: "title" },
    { title: "Alt Başlık", dataIndex: "subtitle" },
    {
      title: "Aktif Durum",
      dataIndex: "isActive",
      render: (v) => (
        <Tag color={v ? "green" : "red"}>
          {v ? "AKTİF" : "PASİF"}
        </Tag>
      )
    },
    {
      title: "Eylem",
      align: 'center',
      render: (v, record) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => openPopupModal(record)}
          size="small"
        />

      ),
    },
  ]


  if (loading) return <Spin size="large" style={{ display: "block", margin: "50px auto" }} tip="Veriler yükleniyor. Lütfen bekleyiniz..." />;

  return (
    <Card>
      <Title level={2}>Yönetim İşlemleri Paneli</Title>
      <Tabs defaultActiveKey="1">
        {/* Tenant Bilgileri */}
        <TabPane tab="Genel Bilgiler" key="1">
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card title={<Title level={4} style={{ margin: 0 }}>Sistem Parametreleri</Title>}>
                <Form form={tenantForm} layout="vertical" onFinish={handleTenantSubmit}>
                  <Form.Item
                    name="parameter"
                    label="WeePuan Çarpım Kat Sayısı"
                    rules={[
                      { required: true, message: 'Çarpım kat sayısı boş bırakılamaz.' },
                      { type: 'number', min: 0, message: 'Değer sıfırdan küçük olamaz.' }
                    ]}
                    initialValue={parameter}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="WeePuan Çarpım Kat Sayısı (örn: 0.1)"
                      step={0.01}
                    />
                  </Form.Item>
                  <Form.Item
                    name="priceLimit"
                    label="Max Tek Seferlik Yükleme Tutarı (TL)"
                    rules={[
                      { required: true, message: 'Yükleme tutarı sınırı boş bırakılamaz.' },
                      { type: 'number', min: 1, message: 'Değer 1 TL\'den küçük olamaz.' }
                    ]}
                    initialValue={priceLimit}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Max Yükleme Tutarı"
                      min={1}
                    />
                  </Form.Item>
                  <Form.Item
                    name="balanceLimit"
                    label="Max Cüzdan Tutarı (Toplam Bakiye TL)"
                    rules={[
                      { required: true, message: 'Cüzdan tutarı sınırı boş bırakılamaz.' },
                      { type: 'number', min: 1, message: 'Değer 1 TL\'den küçük olamaz.' }
                    ]}
                    initialValue={balanceLimit}
                  >
                    <InputNumber
                      style={{ width: "100%" }}
                      placeholder="Max Cüzdan Tutarı"
                      min={1}
                    />
                  </Form.Item>
                  <Button type="primary" htmlType="submit" style={{ marginTop: 16 }} block>
                    Parametreleri Kaydet
                  </Button>
                </Form>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={<Title level={4} style={{ margin: 0 }}>Mobil Uygulama Versiyonları</Title>}>
                <p style={{ color: 'gray', marginBottom: 16 }}>
                  Uygulamanın çalışacağı minimum versiyonları giriniz. **Kaydetmeden önce boş alanları doldurun/silin.**
                </p>
                <Space direction="vertical" style={{ width: "100%" }}>
                  {versions.map((v, i) => (
                    <Input.Group compact key={i} style={{ display: "flex", marginBottom: 8 }}>
                      <Input
                        value={v}
                        onChange={(e) => updateVersion(i, e.target.value)}
                        placeholder="Versiyon No (örn: 1.0.5)"
                        style={{
                          border: v.trim() === "" ? '1px solid red' : undefined
                        }}
                      />
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeVersion(i)}
                      />
                    </Input.Group>
                  ))}
                  <Button type="dashed" icon={<PlusOutlined />} onClick={addVersion} block>
                    Yeni Versiyon Ekle
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </TabPane>

        {/* PriceSets */}
        <TabPane tab="Yükleme Tutarları" key="2">
          <Card
            title={
              <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Tanımlı Yükleme Seçenekleri</Title>

                {/* 📱 Mobilde başlık altına buton */}
                {isMobile && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addPriceSet}
                    style={{ marginTop: 12 }}
                  >
                    Yeni Tutar Ekle
                  </Button>
                )}
              </div>
            }
            extra={
              !isMobile && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={addPriceSet}
                >
                  Yeni Tutar Ekle
                </Button>
              )
            }
          >
            <Table
              dataSource={priceSets.map((p, i) => ({ ...p, key: i }))}
              pagination={false}
              bordered
              scroll={{ x: "max-content" }}
              columns={priceSetsColumns}
            />
          </Card>
          <Button type="primary" onClick={handlePriceSetsSubmit} style={{ marginTop: 16, padding: 16, width: isMobile && "100%" }}>
            Yükleme Tutarlarını Kaydet
          </Button>
        </TabPane>

        {/* Popups */}
        <TabPane tab="PopUps" key="3">
          <Card
            title={
              <div style={{ display: "flex", flexDirection: "column", marginTop: 16 }}>
                <Title level={4} style={{ margin: 0 }}>Mobil Uygulama Açılış Pop-Up Yönetimi</Title>

                {/* 📱 Mobilde başlık altına buton */}
                {isMobile && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openPopupModal()}
                    style={{ marginTop: 12 }}
                  >
                    Yeni Popup Oluştur
                  </Button>
                )}
              </div>
            }
            extra={
              !isMobile && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => openPopupModal()}
                >
                  Yeni Popup Oluştur
                </Button>
              )
            }
          >
            <Table
              dataSource={popups.map((p) => ({ ...p, key: p._id }))}
              columns={popupsColumns}
              scroll={{ x: "max-content" }}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* PopUp Modal */}
      <Modal
        open={isPopupModalVisible}
        title={editingPopup ? "Popup Güncelle" : "Yeni Popup Oluştur"}
        onCancel={() => setIsPopupModalVisible(false)}
        onOk={handlePopupSubmit}
        okText="Kaydet"
        cancelText="Vazgeç"
      >
        <Form form={popupForm} layout="vertical">
          <Form.Item name="title" label="Başlık" rules={[{ required: true, message: 'Başlık boş bırakılamaz.' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="Alt Başlık (Opsiyonel)">
            <Input />
          </Form.Item>
          <Form.Item name="link" label="Yönlendirme Linki (Opsiyonel)">
            <Input />
          </Form.Item>
          <Form.Item name="textTr" label="İçerik Metni (TR)" rules={[{ required: true, message: 'Türkçe içerik zorunludur.' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="textEn" label="İçerik Metni (EN) (Opsiyonel)">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>Pop-Up'ı Aktif Et</Checkbox>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default ManagementPage;