import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  DatePicker,
  Button,
  Form,
  Row,
  Col,
  message,
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";

dayjs.locale("tr");

const FraudCheck = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // Hata veya başarı mesajı
  const [form] = Form.useForm();

  // API'den fraud listesi çekme
  const fetchTransactions = async (params = {}) => {
    setLoading(true);
    try {
      let url = "transactions/list/fraud";
      if (params.startDate && params.endDate) {
        url += `?filterStart=${params.startDate}&filterEnd=${params.endDate}`;
      }
      const res = await axios.get(url);
      setTransactions(res.data || []);
    } catch (err) {
      message.error("Veriler yüklenemedi!");
      console.error("Liste Hatası:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Kontrol et -> GET ile id gönderiliyor
  const checkTransaction = async (id) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.get(`transactions/iyzico/fraud/check/${id}`);

      if (res.data?.success) {
        message.success(res.data.message || "İşlem başarıyla kontrol edildi!");

        // API’den dönen güncel transaction verisi ile tabloyu güncelle
        if (res.data.transaction) {
          setTransactions((prev) =>
            prev.map((tx) => (tx._id === id ? res.data.transaction : tx))
          );
        } else {
          // Eğer sadece fraudCheck true dönerse eski mantık
          setTransactions((prev) =>
            prev.map((tx) =>
              tx._id === id ? { ...tx, fraudCheck: true } : tx
            )
          );
        }

        setStatus({ success: true, message: res.data.message });
      } else {
        setStatus({
          success: false,
          message: res.data.message || "Beklenmeyen durum",
        });
      }
    } catch (error) {
      if (error.response) {
        console.error("API Hatası:", error.response.data);
        setStatus({
          success: false,
          message: error.response.data.message || "Hata oluştu",
          data: error.response.data,
        });
      } else if (error.request) {
        console.error("Cevap Yok:", error.request);
        setStatus({ success: false, message: "API cevap vermedi" });
      } else {
        console.error("Axios Hatası:", error.message);
        setStatus({ success: false, message: error.message });
      }
    } finally {
      setLoading(false);
    }
  };

  // İlk açılışta son 7 gün ile yükle + tarihleri doldur
  useEffect(() => {
    const start = dayjs().subtract(7, "day");
    const end = dayjs();
    form.setFieldsValue({
      startDate: start,
      endDate: end,
    });
    fetchTransactions({
      startDate: start.format("YYYY-MM-DD"),
      endDate: end.format("YYYY-MM-DD"),
    });
  }, [form]);

  // Filtreleme submit
  const onFinish = (values) => {
    if (!values.startDate || !values.endDate) {
      return message.warning("Başlangıç ve bitiş tarihi seçin!");
    }
    if (values.startDate.isAfter(values.endDate)) {
      return message.error("Başlangıç tarihi bitişten büyük olamaz!");
    }
    const startDate = values.startDate.format("YYYY-MM-DD");
    const endDate = values.endDate.add(1, "day").format("YYYY-MM-DD");
    fetchTransactions({ startDate, endDate });
  };

  const columns = [
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_date",
      align: "center",
      render: (val) =>
        val ? dayjs(val).format("YYYY/MM/DD HH:mm:ss") : "-",
    },
    {
      title: "GSM",
      dataIndex: ["member", "gsm"],
      align: "center",
      render: (val) => val || "Yok",
    },
    {
      title: "İyzico ID",
      dataIndex: "transaction_id",
      align: "center",
    },
    {
      title: "Ad Soyad",
      align: "center",
      render: (row) =>
        row.member
          ? `${row.member.first_name} ${row.member.last_name}`
          : "-",
    },
    {
      title: "Ödeme Miktarı",
      dataIndex: "amount",
      align: "center",
      render: (val) =>
        val
          ? `${Number(val).toLocaleString("tr-TR", {
              minimumFractionDigits: 2,
            })} ₺`
          : "-",
    },
    {
      title: "Telefon Adı",
      dataIndex: "OSBuildNumber",
      align: "center",
      render: (val) => val || "Yok",
    },
    {
      title: "Versiyon",
      dataIndex: ["wallet", "version"],
      align: "center",
      render: (val) => (val ? val : "eski sürüm"),
    },
    {
      title: "Durum",
      dataIndex: "fraudCheck",
      align: "center",
      render: (val) => (val ? "✅ Kontrol edildi" : "⏳ Bekliyor"),
    },
    {
      title: "İşlem",
      align: "center",
      render: (row) => (
        <Button
          type="primary"
          size="small"
          onClick={() => checkTransaction(row._id)}
        >
          Kontrol Et
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Card title="Filtreleme" className="mb-4">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Başlangıç Tarihi" name="startDate">
                <DatePicker format="YYYY-MM-DD" className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Form.Item label="Bitiş Tarihi" name="endDate">
                <DatePicker format="YYYY-MM-DD" className="w-full" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={4} className="flex items-end">
              <Button type="primary" htmlType="submit" block>
                Filtrele
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card title="Şüpheli İşlemler">
        <Table
          rowKey="_id"
          dataSource={transactions}
          columns={columns}
          loading={loading}
          bordered
          pagination={{ pageSize: 10 }}
          scroll={{ x: "max-content" }}
        />
        {status && (
          <div style={{ marginTop: "1rem" }}>
            <p style={{ color: status.success ? "green" : "red" }}>
              {status.message}
            </p>
            {!status.success && status.data && (
              <pre>{JSON.stringify(status.data, null, 2)}</pre>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default FraudCheck;
