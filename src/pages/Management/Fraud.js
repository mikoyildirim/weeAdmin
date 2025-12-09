import React, { useEffect, useState } from "react";
import {
  Table,
  Card,
  DatePicker,
  Button,
  Form,
  Row,
  Col,
  Input,
  message,
} from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import "../../utils/styles/rangePickerMobile.css"

dayjs.locale("tr");
const { RangePicker } = DatePicker;
const { Search } = Input;

const FraudCheck = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [form] = Form.useForm();
  const [selectedDates, setSelectedDates] = useState([
    dayjs().subtract(7, "day"),
    dayjs(),
  ]);

  const fetchTransactions = async () => {
    const startDate = selectedDates[0].format("YYYY-MM-DD");
    const endDate = selectedDates[1].format("YYYY-MM-DD");

    setLoading(true);
    try {
      let url = "transactions/list/fraud";
      if (startDate && endDate) {
        url += `?filterStart=${startDate}&filterEnd=${endDate}`;
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

  const checkTransaction = async (id) => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.get(`transactions/iyzico/fraud/check/${id}`);

      if (res.data?.success) {
        message.success(res.data.message || "İşlem başarıyla kontrol edildi!");

        if (res.data.transaction) {
          setTransactions((prev) =>
            prev.map((tx) => (tx._id === id ? res.data.transaction : tx))
          );
        } else {
          setTransactions((prev) =>
            prev.map((tx) =>
              tx._id === id ? { ...tx, fraudCheck: true } : tx
            )
          );
        }
      } else {
        setStatus({ success: false, message: res.data.message });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: error.response?.data?.message || "Hata oluştu",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [selectedDates]);

  const onFinish = () => fetchTransactions();

  const filteredTransactions = transactions.filter((item) => {
    const text = searchText.toLowerCase();

    return (
      item.transaction_id?.toLowerCase().includes(text) ||
      item.member?.gsm?.toLowerCase().includes(text) ||
      `${item.member?.first_name || ""} ${item.member?.last_name || ""}`
        .toLowerCase()
        .includes(text) ||
      item.OSBuildNumber?.toLowerCase().includes(text) ||
      item.wallet?.version?.toLowerCase().includes(text) ||
      String(item.amount || "")
        .toLowerCase()
        .includes(text) ||
      dayjs(item.created_date).format("YYYY/MM/DD HH:mm")
        .toLowerCase()
        .includes(text)
    );
  });

  const columns = [
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_date",
      align: "center",
      render: (val) =>
        val ? dayjs(val).format("YYYY/MM/DD HH:mm:ss") : "-",
      sorter: (a, b) =>
        dayjs(a.created_date).unix() - dayjs(b.created_date).unix(),
    },
    {
      title: "GSM",
      dataIndex: ["member", "gsm"],
      align: "center",
      render: (val) => val || "Yok",
      sorter: (a, b) => {
        const v1 = a.member?.gsm || "";
        const v2 = b.member?.gsm || "";
        return v1.localeCompare(v2);
      },
    },
    {
      title: "İyzico ID",
      dataIndex: "transaction_id",
      align: "center",
      sorter: (a, b) =>
        (a.transaction_id || "").localeCompare(b.transaction_id || ""),
    },
    {
      title: "Ad Soyad",
      align: "center",
      render: (row) =>
        row.member
          ? `${row.member.first_name} ${row.member.last_name}`
          : "-",
      sorter: (a, b) => {
        const v1 = a.member
          ? `${a.member.first_name} ${a.member.last_name}`
          : "";
        const v2 = b.member
          ? `${b.member.first_name} ${b.member.last_name}`
          : "";
        return v1.localeCompare(v2);
      },
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
      sorter: (a, b) => Number(a.amount) - Number(b.amount),
    },
    {
      title: "Telefon Adı",
      dataIndex: "OSBuildNumber",
      align: "center",
      render: (val) => val || "Yok",
      sorter: (a, b) =>
        (a.OSBuildNumber || "").localeCompare(b.OSBuildNumber || ""),
    },
    {
      title: "Versiyon",
      dataIndex: ["wallet", "version"],
      align: "center",
      render: (val) => (val ? val : "eski sürüm"),
      sorter: (a, b) =>
        (a.wallet?.version || "").localeCompare(b.wallet?.version || ""),
    },
    {
      title: "Durum",
      dataIndex: "fraudCheck",
      align: "center",
      render: (val) => (val ? "✅ Kontrol edildi" : "⏳ Bekliyor"),
      sorter: (a, b) => Number(a.fraudCheck) - Number(b.fraudCheck),
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
    <>

      <h1>
        Şüpheli İşlemler
      </h1>
      <div>

        <Card title="Filtreleme" className="mb-4">
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Row gutter={[16, 16]}>
              <RangePicker
                value={selectedDates}
                onChange={(val) => setSelectedDates(val || [])}
                style={{ width: 250 }}
                allowEmpty={[false, false]}
              />

              <Col xs={24} sm={12} md={4}>
                <Button type="primary" htmlType="submit" block>
                  Filtrele
                </Button>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          extra={
            <Search
              placeholder="Ara (GSM, ad soyad, ID...)"
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
          }
        >
          <Table
            rowKey="_id"
            dataSource={filteredTransactions}
            columns={columns}
            loading={loading}
            bordered
            pagination={{ pageSize: 10 }}
            scroll={{ x: "max-content" }}
          />
        </Card>
      </div>
    </>
  );
};

export default FraudCheck;
