import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import { Card, Tabs, Form, Input, Row, Col, Table, Typography, Spin } from "antd";
import axios from "../../../api/axios";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const { TabPane } = Tabs;
const { Link } = Typography;

const DeviceDetail = () => {
  const [lastTenUser, setLastTenUser] = useState([])
  const [lastUser, setLastUser] = useState({})
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [tableData, setTableData] = useState([]);

  const navigate = useNavigate();
  const { id: qrlabel } = useParams();


  const fetchLastTenUser = async () => {
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
      )
      setLastTenUser(Array.isArray(res.data) ? res.data : []);
      console.log(lastTenUser)
    } catch (err) {
      console.error("/devices/findLastTenUser alınırken hata oluştu", err)
      setLastTenUser([])
    } finally {
      setLoading(false);
    }
  }

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
      )
      setLastUser(res.data);
      console.log(lastUser)
    } catch (err) {
      console.error("/devices/findLastUser alınırken hata oluştu", err)
      setLastUser()
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { // search işlemi
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

  useEffect(() => { // ekranın genişlik pixeline göre mobil olup olmadığına karar veriyor
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchLastUser()
    fetchLastTenUser()
  }, [qrlabel])

  useEffect(() => { // son 10 kullanıcı bilgilerini düzenleyip lastTenUser' a yükler
    const temp = lastTenUser.map((item, index) => {
      const start = dayjs.utc(item.start);
      const end = dayjs.utc(item.updated_date);
      const diffMinutes = `${end.diff(start, "minute")} dk`;
      return {
        key: index + 1,
        startDate: item.start,
        endDate: item.updated_date,
        memberName: `${item.member.first_name} ${item.member.last_name}`,
        memberGsm: item.member.gsm,
        timeDrive: diffMinutes 
      }
    })

    setTableData(temp)
  }, [lastTenUser])

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
  }

  if (!lastTenUser.length) {
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
      sorter: (a, b) => a.startDate.localeCompare(b.startDate),
      render: (value) => dayjs.utc(value).format("DD.MM.YYYY HH.mm.ss")
    },
    {
      title: "Sürüş Bitiş",
      dataIndex: "endDate",
      key: "endDate",
      sorter: (a, b) => a.endDate.localeCompare(b.endDate),
      render: (value) => dayjs.utc(value).format("DD.MM.YYYY HH.mm.ss")
    },
    {
      title: "Ad Soyad",
      dataIndex: "memberName",
      key: "memberName",
      sorter: (a, b) => a.memberName.localeCompare(b.memberName)
    },
    {
      title: "GSM",
      dataIndex: "memberGsm",
      key: "memberGsm",
      sorter: (a, b) => a.memberGsm.localeCompare(b.memberGsm)
    },
    {
      title: "Sürüş Süresi", dataIndex: "timeDrive", key: "timeDrive",
      sorter: (a, b) => a.timeDrive - b.timeDrive,
      render: (value) => `${value} dk` // tableData'daki diffMinutes kullanılıyor
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
                  <Link onClick={() => navigate(`/city/${lastUserInfo.city}`)}>
                    {lastUserInfo.phone}
                  </Link>
                </Form.Item>
                <Form.Item label="Cihaz QR Kodu">
                  <Input value={lastUserInfo.cihazQrKodu} disabled style={{ color: "black" }} />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </TabPane>

        <TabPane tab="Geçmiş Sürüşler" key="2">
          <Row gutter={[16, 16]}>
            {/* Search Input */}
            <Col xs={24} sm={24} md={24} lg={8}>
              <Input
                placeholder="Ara..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ margin: "16px 0", width: "100%", ...(isMobile ? { marginBottom: "16px" } : { maxWidth: "300px" }), }}
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
                      <p><b>GSM:</b> {record.memberGsm}</p>
                      <p><b>Sürüş Süresi:</b> {record.timeDrive} </p>
                    </div>
                  ),
                  expandRowByClick: true,
                }
                : undefined
            }
          />

        </TabPane>
      </Tabs>
    </Card>
  );
};

export default DeviceDetail;
