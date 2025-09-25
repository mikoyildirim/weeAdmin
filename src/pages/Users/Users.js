import React, { useState } from "react";
import { Card, Tabs, Form, Input, Row, Col, Select, Button, Spin, message, Table } from "antd";
import axios from "../../api/axios";

const { TabPane } = Tabs;
const { Option } = Select;

const Users = () => {
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [userData, setUserData] = useState(null);
  const [searched, setSearched] = useState(false);
  const [userStatus, setUserStatus] = useState("");
  const [cardStatus, setCardStatus] = useState("");
  //const [cardStatus, setCardStatus] = useState("");

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // sadece rakam
    setPhone(value);
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
      const res = await axios.get(`/members/listByTenantGsm/${phone}`);
      setUserData(res.data || null);
      if (res.data) {
        setUserStatus(res.data.userStatus || "");
        setCardStatus(res.data.cardStatus || "");
      }
    } catch (err) {
      console.error(err);
      setUserData(null);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  };

  const handleStatusChange = (value, type) => {
    if (type === "user") setUserStatus(value);
    else if (type === "card") setCardStatus(value);
  };

  // transactions filtresi

  const uploads = userData?.wallet?.transactions?.filter(t => t.type === 1) || [];
  const rentals = userData?.wallet?.transactions?.filter(t => t.type === -3) || [];
  const campaigns = userData?.wallet?.transactions?.filter(t => t.type === 3) || [];
  console.log(userData?.wallet)
  // Columns tanımları
  const uploadColumns = [
    { title: "Tarih", dataIndex: "date", key: "date" },
    { title: "Yükleme Noktası", dataIndex: "payment_gateway", key: "payment_gateway" },
    { title: "Yükleme ID", dataIndex: "transaction_id", key: "transaction_id" },
    { title: "Ceza Türü", dataIndex: "penalty_type", key: "penalty_type" },
    { title: "QR", dataIndex: "qr", key: "qr" },
    { title: "Tutar", dataIndex: "amount", key: "amount" },
    { title: "İşlem Versiyon", dataIndex: "version", key: "version" },
    { title: "Durum", dataIndex: "status", key: "status" },
  ];

  const rentalColumns = [
    { title: "QR", dataIndex: ["rental", "device", "qrlabel"], key: "qr" },
    { title: "Başlangıç", dataIndex: ["rental", "start"], key: "start" },
    { title: "Bitiş", dataIndex: ["rental", "end"], key: "end" },
    { title: "Sonlandıran", dataIndex: ["rental", "finishedUser", "name"], key: "finishedUser" },
    {
      title: "Süre",
      key: "duration",
      render: (_, record) => {
        if (record.rental?.start && record.rental?.end) {
          const start = new Date(record.rental.start);
          const end = new Date(record.rental.end);
          const diff = Math.floor((end - start) / 1000);
          const hours = Math.floor(diff / 3600);
          const minutes = Math.floor((diff % 3600) / 60);
          return `${hours}h ${minutes}m`;
        }
        return "-";
      },
    },
    { title: "Tutar", dataIndex: ["rental", "total"], key: "total" },
    { title: "İşlem Versiyon", dataIndex: "version", key: "version" },
    //{ title: "Harita", dataIndex: ["rental", "avldatas"], key: "map" },
    { title: "Görsel", dataIndex: "image", key: "image" },
    { title: "Sürüşü Düzenle", dataIndex: "editDriving", key: "editDriving" },
  ];

  const campaignColumns = [
    { title: "Tarih", dataIndex: "date", key: "date" },
    { title: "Yükleme ID", dataIndex: "transaction_id", key: "transaction_id" },
    { title: "Tutar", dataIndex: "amount", key: "amount" },
    { title: "İşlem Versiyon", dataIndex: "version", key: "version" },
  ];

  return (
    <>
      <h1>Kullanıcı Bilgileri</h1>

      <Card title={"Kullanıcı Arama"}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={24} md={24} lg={16}>
            <Input
              placeholder="Telefon numarası ile ara..."
              value={phone}
              onChange={handlePhoneChange}
              style={{ width: "300px", marginRight: "8px" }}
              onPressEnter={searchUser}
              maxLength={15}
            />
            <Button type="primary" onClick={searchUser}>
              Kullanıcı Ara
            </Button>
          </Col>
        </Row>
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

                  <Col span={12}>
                    <Form.Item label="Kullanıcı Doğum Tarihi">
                      <Input value={userData.birth_date} disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Email Adresi">
                      <Input value={userData.user?.email} disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>

                  {/* Uyruk - Şehir - Cinsiyet yan yana, ekranın yarısı */}
                  <Col span={12}>
                    <Row gutter={[16, 16]}>
                      <Col span={8}>
                        <Form.Item label="Uyruk Bilgisi">
                          <Input value={userData.nation} disabled style={{ color: "black" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Şehir Bilgisi">
                          <Input value={userData.city} disabled style={{ color: "black" }} />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="Cinsiyet Bilgisi">
                          <Input value={userData.gender} disabled style={{ color: "black" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Toplam Hareket Adeti">
                      <Input value={userData.wallet?.length || 0} disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item label="Cüzdan Miktarı">
                          <Input value={userData.wallet?.balance} disabled style={{ color: "black" }} />
                        </Form.Item>
                      </Col>

                      <Col span={12}>
                        <Form.Item label="WeePuan Miktarı">
                          <Input value={userData.score} disabled style={{ color: "black" }} />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Col>

                  <Col span={8}>
                    <Form.Item label="Kullanıcı Telefon Adı">
                      <Input value={userData.OSBuildNumber} disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Kullanıcı Referans Kodu">
                      <Input value={userData.referenceCode} disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Takip Et Kazan Kampanyası">
                      <Input value={userData.followSocial} disabled style={{ color: "black" }} />
                    </Form.Item>
                  </Col>

                  <Col span={12}>
                    <Form.Item label="Kullanıcı Durumu">
                      <Select
                        value={userStatus}
                        onChange={(value) => handleStatusChange(value, "user")}
                        style={{ width: "150px" }}
                      >
                        <Option value="active">Aktif</Option>
                        <Option value="passive">Pasif</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item label="Kart Durumu">
                      <Select
                        value={cardStatus}
                        onChange={(value) => handleStatusChange(value, "card")}
                        style={{ width: "150px" }}
                      >
                        <Option value="active">Aktif</Option>
                        <Option value="passive">Pasif</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </TabPane>

            {/* Yüklemeler Tab */}
            <TabPane tab="Yüklemeler" key="2">
              <Table
                columns={uploadColumns}
                dataSource={uploads}
                rowKey={(record) => record.transaction_id || record.id}
                pagination={false}
              />
            </TabPane>

            {/* Kiralamalar Tab */}
            <TabPane tab="Kiralama" key="3">
              <Table
                columns={rentalColumns}
                dataSource={rentals}
                rowKey={(record) => record.transaction_id || record.id}
                pagination={false}
              />
            </TabPane>

            {/* Kampanyalar Tab */}
            <TabPane tab="Kampanyalar" key="4">
              <Table
                columns={campaignColumns}
                dataSource={campaigns}
                rowKey={(record) => record.transaction_id || record.id}
                pagination={false}
              />
            </TabPane>
          </Tabs>
        </Card>
      )}
    </>
  );
};

export default Users;
