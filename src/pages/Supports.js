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
  const userPermissions = useSelector((state) => state.auth.user?.permissions) || {};
  const userEmail = useSelector((state) => state.auth.user?.email) || {};

  const [supports, setSupports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState({});
  const [filteredSupports, setFilteredSupports] = useState([]);


  let supportStatusSelectOptions = []

  userPermissions.supports.map((item) => {
    switch (item) {
      case 'ACTIVE':
        supportStatusSelectOptions.push({ value: 'ACTIVE', label: 'AKTİF' })
        break
      case 'CONTROLLED':
        supportStatusSelectOptions.push({ value: 'CONTROLLED', label: 'İNCELENDİ' })
        break
      case 'DONE':
        supportStatusSelectOptions.push({ value: 'DONE', label: 'ÇÖZÜLDÜ' })
        break
      default:
        break
    }
  })



  useEffect(() => {
    fetchSupports();
  }, []);

  const fetchSupports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/supports/find/listWithGroup");
      console.log(res)

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

    try {
      await axios.post("/supports/" + selectedSupport._id, {
        status: selectedSupport.status,
        note: selectedSupport.note,
      }).then(res => console.log("Güncelleme başarılı."))
        .catch(err => console.log("Güncelleme başarısız!", err))
      setModalVisible(false);
      fetchSupports();
    } catch (err) {
      console.log("Güncelleme başarısız!", err);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    if (!value) {
      setFilteredSupports(supports);
      return;
    }
    const filtered = supports
      .map((category) => ({
        ...category,
        supports: category.supports.filter((s) =>
          s.member?.gsm?.includes(value) || s?.qr?.includes(value)
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
      sorter: (a, b) => dayjs(a.created_date).valueOf() - dayjs(b.created_date).valueOf(),
      defaultSortOrder: "descend",
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
    { title: "İşlem Versiyon", dataIndex: "version", key: "version", render: (c) => c || "Yok", align: "center", },
    { title: "Şehir", dataIndex: "city", key: "city", render: (c) => c || "Yok", align: "center", },
    {
      title: "Açıklama",
      dataIndex: "note",
      key: "note",
      align: "center",
      render: (n) => <Input.TextArea value={n || "Veri yok..."} rows={2} readOnly bordered={false} style={{ background: "#f5f5f5" }} />,
    },
  ];

  console.log(supports)

  if (userPermissions.updateSupport && userEmail !== "info@weescooter.com.tr" && userPermissions?.supports.length !== 0) {
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
        placeholder="GSM ya da QR"
        value={searchText}
        onChange={(e) => handleSearch(e.target.value)}
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
            }}
            style={{ minWidth: "150px" }}
            options={supportStatusSelectOptions}
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
