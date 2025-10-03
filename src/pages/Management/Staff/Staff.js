import React, { useEffect, useState } from "react";
import { Table, Button, Tag } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";

const StaffList = () => {
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffs();
  }, []);

  const fetchStaffs = async () => {
    setLoading(true);
    try {
      // API isteğini kendi backend endpointine göre güncelle
      const res = await axios.get("/staffs");
      setStaffs(res.data);
      console.log(res.data)
    } catch (error) {
      console.error("Staff verisi alınamadı:", error);
    }
    setLoading(false);
  };

  const columns = [
    {
      title: "İsim",
      dataIndex: "staffName",
      key: "staffName",
      render: (text, record) => (
        <a onClick={() => navigate(`update/${record._id}`)}>{text}</a>
      ),
    },
    {
      title: "Email",
      dataIndex: ["user", "email"],
      key: "email",
      render: (email) => email || "-",
    },
    {
      title: "Yetkili Şehirler",
      dataIndex: ["user", "permissions", "locations"],
      key: "locations",
      render: (locations) =>
        locations && locations.length > 0 ? locations.join(", ") : "-",
    },
    {
      title: "Durum",
      dataIndex: ["user", "active"],
      key: "active",
      render: (active) =>
        active ? (
          <Tag color="green">Aktif</Tag>
        ) : (
          <Tag color="red">Pasif</Tag>
        ),
    },
  ];

  return (
    <div>
      {/* Sol üstte kullanıcı oluşturma butonu */}
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => navigate("create")}>
          Kullanıcı Oluştur
        </Button>
      </div>

      {/* Personel tablosu */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={staffs}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default StaffList;
