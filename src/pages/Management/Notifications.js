import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Row,
  Col,
  Typography,
  Divider,
} from "antd";
import { SendOutlined, ReloadOutlined, SearchOutlined, FileExcelOutlined } from "@ant-design/icons";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import utc from 'dayjs/plugin/utc';
import exportToExcel from "../../utils/exportToExcel";

dayjs.extend(utc);
dayjs.locale("tr");

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Notifications = () => {
  const [form] = Form.useForm();
  const [notificationType, setNotificationType] = useState("gsm");
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const excelFileName = `${dayjs().utc().format("YYYY-MM-DD")} Bildirimler.xlsx`;


  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Bildirimleri çek
  const fetchNotifications = async () => {
    console.log("📡 [FETCH] Bildirim listesi yükleniyor...");
    setTableLoading(true);
    try {
      const { data } = await axios.get("/notifications/list");
      console.log("✅ [FETCH SUCCESS]", data);
      setNotifications(data || []);
      setFilteredNotifications(data || []);
    } catch (error) {
      console.error("❌ [FETCH ERROR]", error);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // 🔍 Anlık arama
  useEffect(() => {
    if (!searchText.trim()) {
      setFilteredNotifications(notifications);
      return;
    }

    const lower = searchText.toLowerCase();

    const filtered = notifications.filter((n) => {
      const title = n.title?.toLowerCase() || "";
      const body = n.body?.toLowerCase() || "";
      const type = n.notificationType?.toLowerCase() || "";
      const dateFormatted = n.created_date
        ? dayjs(n.created_date).format("YYYY.MM.DD HH:mm:ss").toLowerCase()
        : "";

      return (
        title.includes(lower) ||
        body.includes(lower) ||
        type.includes(lower) ||
        dateFormatted.includes(lower)
      );
    });

    setFilteredNotifications(filtered);
  }, [searchText, notifications]);

  // Bildirim gönderme
  const onFinish = async (values) => {
    setLoading(true);
    console.log("🚀 [SUBMIT] Gönderilecek veriler:", values);
    try {
      let endpoint = "";
      let payload = {
        title: values.title,
        message: values.message,
        type: values.type,
      };

      switch (values.notificationType) {
        case "gsm":
          endpoint = "/notifications/notificationByGsm";
          payload.gsm = values.gsm;
          break;
        case "city":
          endpoint = "/notifications/notificationByCity";
          payload.city = values.city;
          break;
        case "global":
        default:
          endpoint = "/notifications/";
          break;
      }

      console.log("📡 [POST] Endpoint:", endpoint);
      console.log("📦 [POST] Payload:", payload);

      const res = await axios.post(endpoint, payload);
      console.log("✅ [POST SUCCESS]", res.data);

      form.resetFields();
      fetchNotifications();
    } catch (error) {
      console.error("❌ [POST ERROR]", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Tarih",
      dataIndex: "created_date",
      key: "created_date",
      align: "center",
      width: 180,
      sorter: (a, b) => a.created_date.localeCompare(b.created_date),
      defaultSortOrder: "descend",
      render: (val) =>
        val ? dayjs.utc(val).format("YYYY.MM.DD HH:mm:ss") : "-",
    },
    {
      title: "Bildirim Tipi",
      dataIndex: "notificationType",
      key: "notificationType",
      align: "center",
      width: 120,
    },
    {
      title: "Başarılı",
      dataIndex: "successedCount",
      key: "successedCount",
      align: "center",
      width: 100,
    },
    {
      title: "Başarısız",
      dataIndex: "failedCount",
      key: "failedCount",
      align: "center",
      width: 100,
    },
    {
      title: "Başlık",
      dataIndex: "title",
      key: "title",
      align: "left",
      render: (val) => (
        <TextArea
          value={val}
          readOnly
          style={{ backgroundColor: "#fafafa" }}
        />
      ),
    },
    {
      title: "Mesaj",
      dataIndex: "body",
      key: "body",
      align: "left",
      render: (val) => (
        <TextArea
          value={val}
          readOnly
          style={{ backgroundColor: "#fafafa" }}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 16 }}>
      <Card
        bordered={false}
        style={{
          background: "linear-gradient(135deg, #1890ff 0%, #73c0ff 100%)",
          color: "#fff",
          marginBottom: 24,
        }}
      >
        <Title level={2} style={{ color: "#fff", margin: 0 }}>
          📢 Bildirim Yönetimi
        </Title>
        <Text style={{ color: "#e6f7ff" }}>
          Kullanıcılara global, şehir bazlı veya GSM numarasına özel bildirim gönder.
        </Text>
      </Card>

      {/* 🔸 Bildirim Gönderme Formu */}
      <Card
        title={<b>Bildirim Gönder</b>}
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchNotifications}
            type="default"
          >
            Listeyi Yenile
          </Button>
        }
        style={{ marginBottom: 24 }}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          initialValues={{ notificationType: "gsm" }}
        >
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="notificationType"
                label="Gönderim Tipi"
                rules={[{ required: true }]}
              >
                <Select onChange={setNotificationType}>
                  <Option value="gsm">GSM ile Gönder</Option>
                  <Option value="global">Global Gönder</Option>
                  <Option value="city">Şehre Göre Gönder</Option>
                </Select>
              </Form.Item>
            </Col>

            {notificationType === "gsm" && (
              <Col xs={24} md={8}>
                <Form.Item
                  name="gsm"
                  label="GSM"
                  rules={[{ required: true, message: "GSM giriniz" }]}
                >
                  <Input placeholder="5xxxxxxxxx" />
                </Form.Item>
              </Col>
            )}

            {notificationType === "city" && (
              <Col xs={24} md={8}>
                <Form.Item
                  name="city"
                  label="Şehir"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="SIVAS">Sivas</Option>
                    <Option value="BURSA">Bursa</Option>
                    <Option value="WES">Wes</Option>
                    <Option value="ANTALYA">Antalya</Option>
                    <Option value="MANAVGAT">Manavgat</Option>
                    <Option value="ELAZIG">Elazığ</Option>
                  </Select>
                </Form.Item>
              </Col>
            )}

            <Col xs={24} md={8}>
              <Form.Item
                name="type"
                label="Bildirim Kategorisi"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="CAMPAIGN">Kampanya</Option>
                  <Option value="BIRTHDAY">Doğum Günü</Option>
                  <Option value="ANNOUNCEMENT">Duyuru</Option>
                  <Option value="GIFT">Hediye</Option>
                  <Option value="RENTAL">Kiralama</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="title"
                label="Başlık"
                rules={[{ required: true }]}
              >
                <Input placeholder="Bildirim başlığı" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item
                name="message"
                label="Mesaj"
                rules={[{ required: true }]}
              >
                <TextArea rows={3} placeholder="Mesaj içeriği" />
              </Form.Item>
            </Col>

            <Col span={24} style={{ textAlign: "right" }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                loading={loading}
                style={{width: isMobile && "100%"}}
              >
                Bildirim Gönder
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Divider />

      {/* 🔹 Bildirim Geçmişi + Arama Alanı */}
      <Card
        title={<b>Bildirim Geçmişi</b>}
        extra={
          <Input
            prefix={<SearchOutlined />}
            placeholder="Başlık, mesaj veya tip ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 300 }}
          />
        }
      >
        <Col xs={24} md={12} style={{ textAlign: "left", marginBottom: 16 }}>
          <Button type="primary" style={{width:isMobile&&"100%"}} icon={<FileExcelOutlined />}
            onClick={() => {
              const sortedNotifications = [...filteredNotifications].sort((a, b) => dayjs(b.created_date).valueOf() - dayjs(a.created_date).valueOf())
              exportToExcel(sortedNotifications, excelFileName)
            }
            }>Excel İndir</Button>
        </Col>
        <Table
          columns={isMobile ? [columns[0], columns[2]] : columns}
          dataSource={filteredNotifications}
          rowKey={(record) => record._id || Math.random()}
          loading={tableLoading}
          pagination={{ pageSize: 10, size: isMobile&&"small" }}
          expandable={isMobile ? {
            expandedRowRender: record => (
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                <p><b>Bildirim Tipi: </b> {record.notificationType}</p>
                <p><b>Başarılı: </b> {record.successedCount}</p>
                <p><b>Başarısız: </b> {record.failedCount}</p>
                <p><b>Başlık: </b> {record.title}</p>
                <p><b>Mesaj: </b> {record.body}</p>
              </div>
            ),
            expandRowByClick: true

          }
            : undefined
          }

          onRow={(record, index) => ({ // tabloya zebra görünümü ekler
            style: {
              backgroundColor: index % 2 === 0 ? "#fafafa" : "#ffffff",
            },
          })}
        />
      </Card>
    </div>
  );
};

export default Notifications;
