import React, { useEffect, useState } from "react";
import { Card, Tabs, Table, Button, Input, Modal, Tag, message, Select, Form } from "antd";
import { useSelector } from "react-redux";
import axios from "../api/axios";
import dayjs from "dayjs";
import { Link } from "react-router-dom";

const { TabPane } = Tabs;

const statusColors = {
  ACTIVE: "green",
  CONTROLLED: "orange",
  DONE: "gray",
};

const statusTr = {
  ACTIVE: "AKTİF",
  CONTROLLED: "İNCELENDİ",
  DONE: "PASİF",
}

const Supports = () => {
  const userPermissions = useSelector((state) => state.user.user?.permissions) || {};
  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gsm, setGsm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState({});
  const [filteredSupports, setFilteredSupports] = useState([]);


  useEffect(() => {
    fetchSupports();
  }, []);

  const fetchSupports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/supports/find/listWithGroup");
      console.log(res.data)

      setSupports(res.data || []);
      setFilteredSupports(res.data || []);
    } catch (err) {
      message.error("Destek kayıtları alınamadı!");
    } finally {
      setLoading(false);
    }
  };


  const openModal = (support) => {
    setSelectedSupport(support);
    setModalVisible(true);
  };

  const handleModalUpdate = async () => {
    console.log(selectedSupport)
    try {
      await axios.post("/supports/" + selectedSupport._id, {
        status: selectedSupport.status,
        note: selectedSupport.note,
      }).then(res=>console.log(res.data))
        .catch(err => console.log("Güncelleme başarısız!",err))
      setModalVisible(false);
      fetchSupports();
    } catch (err) {
      console.log("Güncelleme başarısız!",err);
    }
  };

  const handleGsmSearch = (value) => {
    setGsm(value);
    if (!value) {
      setFilteredSupports(supports);
      return;
    }
    const filtered = supports
      .map((category) => ({
        ...category,
        supports: category.supports.filter((s) =>
          s.member?.gsm?.includes(value)
        ),
      }))
      .filter(category => category.supports.length > 0); // Boş kategorileri kaldır
    setFilteredSupports(filtered);
  };



  const columns = [
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_date",
      key: "created_date",
      align: "center",
      render: (d) => dayjs.utc(d).format("DD.MM.YYYY HH:mm:ss"),
    },
    {
      title: "GSM",
      dataIndex: ["member", "gsm"],
      key: "gsm",
      align: "center",
      render: (gsm) =>
        gsm ? (
          <Link to={`/panel/users?gsm=${encodeURIComponent(gsm)}`}>{gsm}</Link>
        ) : (
          "-"
        ),
    },
    {
      title: "Ad Soyad",
      dataIndex: ["member", "first_name"],
      key: "name",
      align: "center",
      render: (_, r) => `${r.member?.first_name || ""} ${r.member?.last_name || ""}`,
    },
    { title: "Kategori", dataIndex: "category", key: "category", align: "center", },
    {
      title: "Tanım",
      dataIndex: "description",
      key: "description",
      align: "center",
      render: (d) => <Input.TextArea value={d} rows={2} readOnly bordered={false} style={{ background: "#f5f5f5" }} />,
    },
    {
      title: "QR",
      dataIndex: "qr",
      key: "qr",
      align: "center",
      render: (qr) =>
        qr ? (
          <Link to={`/panel/devices/detail/${qr}`}>{qr}</Link>
        ) : (
          "-"
        ),
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (s) => <Tag color={statusColors[s]} style={{ margin: 0 }}>{statusTr[s]}</Tag>
    },

    { title: "Şehir", dataIndex: "city", key: "city", render: (c) => c || "Yok" },
    {
      title: "Açıklama",
      dataIndex: "note",
      key: "note",
      align: "center",
      render: (n) => <Input.TextArea value={n || "Veri yok..."} rows={2} readOnly bordered={false} style={{ background: "#f5f5f5" }} />,
    },
  ];


  if (userPermissions.updateSupport) {
    columns.push({
      title: "İşlem",
      key: "action",
      align: "center",
      render: (_, r) => (
        <Button type="primary" ghost size="small" onClick={() => openModal(r)}>
          Güncelle
        </Button>
      ),
    });
  }

  return (
    <Card
      style={{ borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      bodyStyle={{ padding: 16 }}
    >
      <Input
        placeholder="Cep Telefonu"
        value={gsm}
        onChange={(e) => handleGsmSearch(e.target.value)}
        style={{ minWidth: 180, marginBottom: 16 }}
      />

      <Tabs type="card" tabBarGutter={8}>
        {filteredSupports.map((category) => (



          <TabPane tab={category.title} key={category.title}>
            <Table
              dataSource={category.supports}
              columns={columns}
              rowKey={(r) => r._id}
              loading={loading}
              pagination={{ pageSize: 8 }}
              scroll={{ x: "max-content" }}
              bordered
              size="middle"
              rowClassName={(record, index) => (index % 2 === 0 ? "table-row-light" : "table-row-dark")}
            />
          </TabPane>
        ))}
      </Tabs>

      <Modal
        visible={modalVisible}
        title="Destek Güncelleme"
        onCancel={() => setModalVisible(false)}
        onOk={handleModalUpdate}
        okText="Kaydet"
        cancelText="Kapat"
      >


        <Form.Item label="Durum: ">
          <Select
            value={selectedSupport.status || ""}
            onChange={(value) => {
              
              setSelectedSupport({ ...selectedSupport, status: value })
              console.log(selectedSupport)
            }}
            style={{ minWidth: "150px" }}
            options={[
              { value: 'ACTIVE', label: 'AKTİF' },
              { value: 'CONTROLLED', label: 'İNCELENDİ' },
              { value: 'DONE', label: 'ÇÖZÜLDÜ' },
            ]}
          />
        </Form.Item>



        <label>Not:</label>
        <Input.TextArea
          value={selectedSupport.note || ""}
          onChange={(e) => setSelectedSupport({ ...selectedSupport, note: e.target.value })}
          rows={3}
        />
      </Modal>

      <style>
        {`
          .table-row-light { background: #fafafa; }
          .table-row-dark { background: #fff; }
          .ant-badge-status-success { background-color: #52c41a !important; }
          .ant-badge-status-error { background-color: #ff4d4f !important; }
          .ant-badge-status-warning { background-color: #faad14 !important; }
        `}
      </style>
    </Card>
  );
};

export default Supports;
