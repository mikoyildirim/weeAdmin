import React, { useEffect, useState } from "react";
import { Card, Tabs, Table, Button, Input, Modal, Badge, message } from "antd";
import { useSelector } from "react-redux";
import axios from "../api/axios";

const { TabPane } = Tabs;

const statusColors = {
  ACTIVE: "green",
  CONTROLLED: "orange",
  DONE: "gray",
};

const Supports = () => {
  const userPermissions = useSelector((state) => state.user.user?.permissions) || {};
  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [gsm, setGsm] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState({});

  useEffect(() => {
    fetchSupports();
  }, []);

  const fetchSupports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/supports/find/listWithGroup");
      setSupports(res.data || []);
    } catch (err) {
      message.error("Destek kayıtları alınamadı!");
    } finally {
      setLoading(false);
    }
  };

  const searchWithGsm = async (e) => {
    e.preventDefault();
    if (!gsm) return;
    try {
      const res = await axios.post("/supports/find/findWithGsm", { gsm });
      setSupports(res.data || []);
    } catch (err) {
      message.error("Kayıt bulunamadı!");
    }
  };

  const openModal = (support) => {
    setSelectedSupport(support);
    setModalVisible(true);
  };

  const handleModalUpdate = async () => {
    try {
      await axios.post("/supports/update/" + selectedSupport._id, {
        status: selectedSupport.status,
        note: selectedSupport.note,
      });
      setModalVisible(false);
      fetchSupports();
    } catch (err) {
      message.error("Güncelleme başarısız!");
    }
  };

  const columns = [
    {
      title: "Oluşturulma Tarihi",
      dataIndex: "created_date",
      key: "created_date",
      render: (d) => new Date(d).toLocaleString(),
    },
    {
      title: "GSM",
      dataIndex: ["member", "gsm"],
      key: "gsm",
      render: (_, r) => r.member?.gsm || "Yok",
    },
    {
      title: "Ad Soyad",
      dataIndex: ["member", "first_name"],
      key: "name",
      render: (_, r) => `${r.member?.first_name || ""} ${r.member?.last_name || ""}`,
    },
    { title: "Kategori", dataIndex: "category", key: "category" },
    {
      title: "Tanım",
      dataIndex: "description",
      key: "description",
      render: (d) => <Input.TextArea value={d} rows={2} readOnly bordered={false} style={{ background: "#f5f5f5" }} />,
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      render: (s) => <Badge color={statusColors[s]} text={s} />,
    },
    { title: "Şehir", dataIndex: "city", key: "city", render: (c) => c || "Yok" },
    {
      title: "Açıklama",
      dataIndex: "note",
      key: "note",
      render: (n) => <Input.TextArea value={n || "Veri yok..."} rows={2} readOnly bordered={false} style={{ background: "#f5f5f5" }} />,
    },
  ];

  if (userPermissions.updateSupport) {
    columns.push({
      title: "İşlem",
      key: "action",
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
      <form onSubmit={searchWithGsm} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Input
          placeholder="Cep Telefonu"
          value={gsm}
          onChange={(e) => setGsm(e.target.value)}
          style={{ minWidth: 180 }}
        />
        <Button type="primary" htmlType="submit">
          Ara
        </Button>
      </form>

      <Tabs type="card" tabBarGutter={8}>
        {supports.map((category) => (
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
        <label>Durum:</label>
        <select
          className="form-control"
          value={selectedSupport.status || ""}
          onChange={(e) => setSelectedSupport({ ...selectedSupport, status: e.target.value })}
        >
          <option value="ACTIVE">AKTİF</option>
          <option value="CONTROLLED">İNCELENDİ</option>
          <option value="DONE">ÇÖZÜLDÜ</option>
        </select>

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
