import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Card, Input, Row, Col } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/methods/exportToExcel";
import utc from 'dayjs/plugin/utc';
import { Link } from "react-router-dom";

dayjs.extend(utc);
dayjs.locale("tr");

const ActiveDevices = () => {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState(""); // <-- search state
  const [filteredDevices, setFilteredDevices] = useState([]); // <-- search için
  const [isMobile, setIsMobile] = useState(false);
  const [paginationSize, setPaginationSize] = useState("medium");

  const excelFileName = `${dayjs().format("DD.MM.YYYY_HH.mm")} Aktif Cihazlar.xlsx`;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 991);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    fetchConnectedDevices();
  }, []);

  useEffect(() => {
    isMobile ? setPaginationSize("small") : setPaginationSize("medium");
  }, [isMobile]);

  useEffect(() => {
    if (!searchText) {
      setFilteredDevices(devices);
      return;
    }
    const lowerSearch = searchText.toLowerCase();

    const filtered = devices.filter((item) => {
      return (
        item.qrlabel?.toString().toLowerCase().includes(lowerSearch) ||
        item.imei?.includes(lowerSearch.toLowerCase()) ||
        item.key_secret?.toString().includes(lowerSearch) ||
        item.battery?.toString().includes(lowerSearch) ||
        item.city?.toString().toLowerCase().includes(lowerSearch) ||
        item.status?.toString().toLowerCase().includes(lowerSearch) ||
        dayjs.utc(item.last_seen).format("YYYY-MM-DD").includes(lowerSearch)
      );
    });
    setFilteredDevices(filtered);
  }, [searchText, devices]);

  const fetchConnectedDevices = async () => { // bağlı cihazları backend den çekiyoruz
    setLoading(true);
    try {
      const devRes = await axios.get("/devices/connected");
      setDevices(Array.isArray(devRes.data) ? devRes.data : []);
    } catch (err) {
      console.error("devices/connected alınırken hata:", err);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const excelData = filteredDevices.map(d => ({ // excel ve pdf indirirken filtrelenmiş halini indirir. yani ekranda ne görünüyorsa o
    "QR Label": d.qrlabel,
    "IMEI": d.imei,
    "Key Secret": d.key_secret,
    "Batarya (%)": d.battery,
    "Şehir/İlçe": `${d.city}/${d.town}`,
    "Durum": d.status,
  }));

  const columns = [
    {
      title: "QR Label", dataIndex: "qrlabel", key: "qrlabel", sorter: (a, b) => a.qrlabel - b.qrlabel,
      align: "center",
      render: (_, record) => (
        <>
          <Button
            type="link"
          >
            <Link to={`/panel/devices/detail/${record.qrlabel}`}>
              <span style={{ userSelect: "text" }}>{record.qrlabel}</span>
            </Link>
          </Button>
        </>
      ),
    },
    { title: "IMEI", dataIndex: "imei", key: "imei", sorter: (a, b) => a.imei - b.imei, align: "center", },
    { title: "Kilit Kodu", dataIndex: "key_secret", key: "key_secret", sorter: (a, b) => a.key_secret - b.key_secret, align: "center", },
    { title: "Batarya (%)", dataIndex: "battery", key: "battery", sorter: (a, b) => a.battery - b.battery, align: "center", },
    {
      title: "Şehir/İlçe",
      key: "location",
      sorter: (a, b) => a.city.localeCompare(b.city),
      render: (_, record) => (<>{record.city}/{record.town}</>),
      align: "center",
    },
    {
      title: "Durum", dataIndex: "status", key: "status", align: "center",
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (_, record) => {
        const statusColors = {
          ONLINE: "green",
          OFFLINE: "red",
          BUSY: "gray",
          MAINTENANCE: "orange"
        };
        return <Tag color={statusColors[record.status] || "default"}>{record.status}</Tag>;
      },
    },
    {
      title: "Son Görülme",
      dataIndex: "last_seen",
      key: "last_seen",
      sorter: (a, b) => new Date(a.last_seen) - new Date(b.last_seen),
      render: (val) => (val ? dayjs.utc(val).format("DD.MM.YYYY HH.mm.ss") : ""),
      align: "center",
    },

    {
      title: "İşlemler",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <>
          <Button
            type="link"
            target="_blank"
            href={`https://www.google.com/maps/dir/?api=1&destination=${record?.last_location?.location?.coordinates[1] || 0
              },${record?.last_location?.location?.coordinates[0] || 0}&travelmode=driving`}
          >
            Konuma Git
          </Button>
        </>
      ),
    },
  ];

  return (

    <Card title={"Aktif Cihazlar"}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={24} lg={16}>
          <div
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: isMobile ? "wrap" : "nowrap",
              alignItems: "center",
            }}
          >
            <Input
              placeholder="Ara..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                margin: isMobile ? "0 0 8px 0" : "16px 0",
                width: isMobile ? "100%" : "300px",
              }}
            />
            <Button
              type="primary"
              style={{
                width: isMobile ? "100%" : "auto",
              }}
              onClick={() => exportToExcel(excelData, excelFileName)}
            >
              Excel İndir
            </Button>
          </div>
        </Col>
      </Row>

      <Table
        columns={isMobile ? [columns[0], columns[columns.length - 1]] : columns}
        dataSource={filteredDevices}
        loading={loading}
        rowKey={(record) => record._id}
        scroll={{ x: true }}
        pagination={{
          position: ["bottomCenter"],
          pageSizeOptions: ["5", "10", "20", "50"],
          size: paginationSize,
        }}
        expandable={
          isMobile
            ? {
              expandedRowRender: (record) => (
                <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                  <p><b>IMEI:</b> {record.imei}</p>
                  <p><b>Kilit Kodu:</b> {record.key_secret}</p>
                  <p><b>Batarya:</b> {record.battery} %</p>
                  <p><b>Şehir/İlçe:</b> {<>{record.city}/{record.town}</>} </p>
                  <p>
                    <b>Durum:</b>{" "}
                    {record.status === "ONLINE" ? (
                      <Tag color="green">{record.status}</Tag>
                    ) : record.status === "OFFLINE" ? (
                      <Tag color="red">{record.status}</Tag>
                    ) : record.status === "BUSY" ? (
                      <Tag color="gray">{record.status}</Tag>
                    ) : record.status === "MAINTENANCE" ? (
                      <Tag color="gray">{record.status}</Tag>
                    ) : (
                      record.status
                    )}
                  </p>
                  <p><b>Son Görülme:</b> {record.last_seen ? dayjs.utc(record.last_seen).format("DD.MM.YYYY HH.mm.ss") : ""}</p>
                </div>
              ),
              expandRowByClick: true,
            }
            : undefined
        }
      />
    </Card>
  );
};

export default ActiveDevices;