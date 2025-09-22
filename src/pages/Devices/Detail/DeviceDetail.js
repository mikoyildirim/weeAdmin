import { useParams, useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from "react";
import { Tabs, Form, Input, Row, Col, Table, Typography, Spin } from "antd";
import axios from "../../../api/axios";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const { TabPane } = Tabs;
const { Link } = Typography;

const DeviceDetail = () => {
  const [lastTenUser, setLastTenUser] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate();
  const { id } = useParams();

  const fetchLastTenUser = async () => {
    try {
      const res = await axios.post(
        "/devices/findLastTenUser",
        { "qrlabel": id },
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

  useEffect(() => {
    fetchLastTenUser()
  }, [id])

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
    name: `${lastTenUser[0].member.first_name} ${lastTenUser[0].member.last_name}`,
    birthDate: `${dayjs(lastTenUser[0].member.birth_date).format("DD.MM.YYYY")}`,
    phone: `${lastTenUser[0].member.gsm} `,
    battery: `${id}`,
    cihazQrKodu: id,
  };



  const tableData = lastTenUser.map((item, index) => {
    const start = dayjs.utc(item.start);
    const end = dayjs.utc(item.updated_date);
    const diffMinutes = end.diff(start, "minute");
    return {
      key: index + 1,
      col1: item.start,
      col2: item.updated_date,
      col3: `${item.member.first_name} ${item.member.last_name}`,
      col4: item.member.gsm,
      col5: diffMinutes // burada istediğini doldurabilirsin
    }
  });


  const columns = [
    {
      title: "Sürüş Başlangıç",
      dataIndex: "col1",
      key: "col1",
      sorter: (a, b) => a.col1.localeCompare(b.col1),
      render: (value) => dayjs.utc(value).format("DD.MM.YYYY HH.mm.ss")
    },
    {
      title: "Sürüş Bitiş",
      dataIndex: "col2",
      key: "col2",
      sorter: (a, b) => a.col2.localeCompare(b.col2),
      render: (value) => dayjs.utc(value).format("DD.MM.YYYY HH.mm.ss")
    },
    {
      title: "Ad Soyad",
      dataIndex: "col3",
      key: "col3",
      sorter: (a, b) => a.col3.localeCompare(b.col3)
    },
    {
      title: "GSM",
      dataIndex: "col4",
      key: "col4",
      sorter: (a, b) => a.col4.localeCompare(b.col4)
    },
    {
      title: "Sürüş Süresi", dataIndex: "col5", key: "col5",
      sorter: (a, b) => a.col5 - b.col5,
      render: (value) => `${value} dk` // tableData'daki diffMinutes kullanılıyor
    },
  ];

  return (
    <div>
      <h1>Sürüş Bilgileri: {id}</h1>
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
                <Form.Item label="Batarya">
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
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            bordered
          />
        </TabPane>
      </Tabs>
    </div>
  );
};

export default DeviceDetail;
