import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import { Card, Tabs, Form, Input, Row, Col, Table, Typography, Spin, Button, Modal } from "antd";
import axios from "../../../api/axios";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const { TabPane } = Tabs;
const { Link } = Typography;

const DeviceDetail = () => {
  const [lastTenUser, setLastTenUser] = useState([]);
  const [lastUser, setLastUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [tableData, setTableData] = useState([]);

  // modal için seçili resim
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);

  const navigate = useNavigate();
  const { id: qrlabel } = useParams();

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
            console.error("Görsel alınırken hata oluştu", err);
            return { ...item, base64Img: null };
          }
        })
      );

      setLastTenUser(usersWithImages);
    } catch (err) {
      console.error("/devices/findLastTenUser alınırken hata oluştu", err);
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
      console.error("/devices/findLastUser alınırken hata oluştu", err);
      setLastUser({});
    }
  };

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

  // ekranın genişliğine göre mobil olup olmadığını belirle
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // sayfa yüklenince dataları getir
  useEffect(() => {
    fetchLastUser();
    fetchLastTenUser();
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
        photo: item.base64Img, // 👈 görsel tabloya eklendi
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
            {lastUserInfo.phone}
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
          Fotoğrafı Görüntüle
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
                      <p><b>GSM:</b>

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
    </Card>
  );
};

export default DeviceDetail;
