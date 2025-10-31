import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Card, Input, Row, Col, Typography, Spin } from "antd";
import axios from "../../../api/axios";
import dayjs from "dayjs";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

const CampaignsPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [paginationSize, setPaginationSize] = useState("medium");


  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  useEffect(() => {
    if (!searchText) {
      setFilteredCampaigns(campaigns);
      return;
    }
    const lowerSearch = searchText.toLowerCase();
    const filtered = campaigns.filter(c =>
      c.campaignName.toLowerCase().includes(lowerSearch) ||
      (c.campaignType ?? "").toLowerCase().includes(lowerSearch) ||
      c.discountType.toLowerCase().includes(lowerSearch) ||
      c.status.toLowerCase().includes(lowerSearch)
    );
    setFilteredCampaigns(filtered);
    console.log(filtered)
  }, [searchText, campaigns]);

  console.log(campaigns)
  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/campaigns");
      setCampaigns(Array.isArray(res.data) ? res.data : []);
      setFilteredCampaigns(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Kampanyalar çekilirken hata:", err);
      setCampaigns([]);
      setFilteredCampaigns([]);
    } finally {
      setLoading(false);
    }
  };


  const columns = [
    { title: "Öncelik", dataIndex: "priority", key: "priority", align: "center" },
    {
      title: "Kampanya Adı", dataIndex: "campaignName", key: "campaignName", align: "center",
      render: (text, record) => (
        user.permissions.showCampaign ?
          (
            <Button
              type="link"
              onClick={() => navigate(`/panel/management/campaigns/showCampaigns/${record._id}`)}
            >{text}</Button>
          ) :
          (
            <p>{text}</p>
          )
      )
    },
    {
      title: "Tür", dataIndex: "campaignType", key: "campaignType", align: "center",
      render: (type) => type || "Kampanya Türü Yok"
    },
    { title: "İndirim Tipi", dataIndex: "discountType", key: "discountType", align: "center" },
    { title: "Miktar", dataIndex: "amount", key: "amount", align: "center" },
    { title: "Yüzde", dataIndex: "percentage", key: "percentage", align: "center" },
    {
      title: "Başlangıç", dataIndex: "startDate", key: "startDate", align: "center",
      render: date => dayjs(date).format("YYYY/MM/DD HH:mm")
    },
    {
      title: "Bitiş", dataIndex: "endDate", key: "endDate", align: "center",
      render: date => dayjs(date).format("YYYY/MM/DD HH:mm")
    },
    {
      title: "Durum", dataIndex: "status", key: "status", align: "center",
      render: status => <Tag color={status === "ACTIVE" ? "green" : "red"}>{status === "ACTIVE" ? "Aktif" : "Pasif"}</Tag>
    }
  ];

  if (loading) return <Spin tip="Yükleniyor..." size="large" style={{ display: "block", marginTop: 50, textAlign: "center" }} />;

  return (
    <Card>
      <Title level={2} style={{ marginBottom: 20 }}>📢 Kampanyalar</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={24} md={12} lg={8}>
          <Input
            placeholder="Ara..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: "100%" }}
          />
        </Col>
        <Col xs={24} sm={24} md={12} lg={8}>
          <Button type="primary" href="/panel/management/campaigns/newCampaign" >Yeni Kampanya</Button>
        </Col>
      </Row>

      <Table
        columns={isMobile ? [columns[1], columns[8]] : columns}
        dataSource={filteredCampaigns}
        rowKey="_id"
        bordered
        pagination={{ size: paginationSize, position: ["bottomCenter"] }}
        scroll={{ x: true }}
        expandable={isMobile ? {
          expandedRowRender: record => (
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <p><b>Öncelik:</b> {record.priority}</p>
              <p><b>Tür:</b> {record.campaignType || "Kampanya Türü Yok"}</p>
              <p><b>İndirim Tipi:</b> {record.discountType}</p>
              <p><b>Miktar:</b> {record.amount}</p>
              <p><b>Yüzde:</b> {record.percentage}</p>
              <p><b>Başlangıç:</b> {dayjs(record.startDate).format("YYYY/MM/DD HH:mm")}</p>
              <p><b>Bitiş:</b> {dayjs(record.endDate).format("YYYY/MM/DD HH:mm")}</p>
            </div>
          ),
          expandRowByClick: true
        } : undefined}
      />
    </Card>
  );
};

export default CampaignsPage;
