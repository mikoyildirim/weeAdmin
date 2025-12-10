import React, { useEffect, useState } from "react";
import { Table, Button, Tag, Input } from "antd";
import { useNavigate } from "react-router-dom";
import axios from "../../../api/axios";
import { useIsMobile } from "../../../utils/customHooks/useIsMobile";

const StaffList = () => {
  const [staffs, setStaffs] = useState([]);
  const [filteredStaffs, setFilteredStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const isMobile = useIsMobile(991);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffs();
  }, []);


  const fetchStaffs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/staffs");
      setStaffs(res.data);
      setFilteredStaffs(res.data);
    } catch (error) {
      console.error("Staff verisi alınamadı:", error);
    }
    setLoading(false);
  };

  // 🔍 Anlık arama
  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = staffs.filter((item) => {
      const nameMatch = item.staffName?.toLowerCase().includes(value.toLowerCase());
      const emailMatch = item.user?.email?.toLowerCase().includes(value.toLowerCase());
      const cityMatch = item.user?.permissions?.locations?.join(", ")?.toLowerCase().includes(value.toLowerCase());
      return nameMatch || emailMatch || cityMatch;
    });
    setFilteredStaffs(filtered);
  };

  const columns = [
    {
      title: "İsim",
      align: "center",
      dataIndex: "staffName",
      key: "staffName",
      sorter: (a, b) => a.staffName.localeCompare(b.staffName),
      render: (text, record) => (
        <a onClick={() => navigate(`update/${record._id}`)}>{text}</a>
      ),
    },
    {
      title: "Email",
      align: "center",
      dataIndex: ["user", "email"],
      key: "email",
      sorter: (a, b) => (a.user?.email || "").localeCompare(b.user?.email || ""),
      render: (email) => email || "-",
    },
    {
      title: "Yetkili Şehirler",
      align: "center",
      dataIndex: ["user", "permissions", "locations"],
      key: "locations",
      sorter: (a, b) => {
        const locA = a.user?.permissions?.locations?.join(", ") || "";
        const locB = b.user?.permissions?.locations?.join(", ") || "";
        return locA.localeCompare(locB);
      },
      render: (locations) =>
        locations && locations.length > 0 ? locations.join(", ") : "-",
    },
    {
      title: "Durum",
      align: "center",
      dataIndex: ["user", "active"],
      key: "active",
      filters: [
        { text: "Aktif", value: true },
        { text: "Pasif", value: false },
      ],
      onFilter: (value, record) => record.user?.active === value,
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
      {/* Üst bar */}
      <div
        style={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          margin: 16,
          gap: isMobile ? 8 : 0, 
        }}
      >
        <Button
          type="primary"
          onClick={() => navigate("create")}
          style={{
            width: isMobile ? "100%" : "auto", 
          }}
        >
          Kullanıcı Oluştur
        </Button>

        <Input
          placeholder="İsim, email veya şehir ara..."
          allowClear
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: isMobile ? "100%" : 300, 
          }}
        />
      </div>

      {/* Tablo */}
      <Table
        rowKey="_id"
        columns={columns}
        dataSource={filteredStaffs}
        loading={loading}
        scroll={{ x: true }}
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
};

export default StaffList;
