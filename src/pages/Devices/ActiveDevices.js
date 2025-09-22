import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Card, Input, Space } from "antd";
import axios from "../../api/axios";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import exportToExcel from "../../utils/exportToExcel";
import utc from 'dayjs/plugin/utc';

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
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
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
    const filtered = devices.filter((item) => {
      return (
        item.qrlabel?.toString().toLowerCase().includes(searchText) ||
        item.imei?.includes(searchText.toLowerCase()) ||
        item.key_secret?.toString().includes(searchText) ||
        item.battery?.toString().includes(searchText) ||
        item.city?.toString().toLowerCase().includes(searchText) ||
        item.status?.toString().toLowerCase().includes(searchText) ||
        dayjs.utc(item.last_seen).format("YYYY-MM-DD").includes(searchText)
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
    { title: "QR Label", dataIndex: "qrlabel", key: "qrlabel", sorter: (a, b) => a.qrlabel - b.qrlabel, },
    { title: "IMEI", dataIndex: "imei", key: "imei", sorter: (a, b) => a.imei - b.imei, },
    { title: "Key Secret", dataIndex: "key_secret", key: "key_secret", sorter: (a, b) => a.key_secret - b.key_secret, },
    { title: "Batarya (%)", dataIndex: "battery", key: "battery", sorter: (a, b) => a.battery - b.battery, },
    {
      title: "Şehir/İlçe",
      key: "location",
      sorter: (a, b) => a.city.localeCompare(b.city),
      render: (_, record) => (
        <>
          {record.city}/{record.town}
          <br />
          <Tag color="blue">{record?.priceObject?.name || "Yok"}</Tag>
        </>
      ),
    },
    { title: "Durum", dataIndex: "status", key: "status" },
    {
      title: "Son Görülme",
      dataIndex: "last_seen",
      key: "last_seen",
      sorter: (a, b) => new Date(a.last_seen) - new Date(b.last_seen),
      render: (val) => (val ? dayjs.utc(val).format("DD.MM.YYYY HH.mm.ss") : ""),
    },

    {
      title: "İşlemler",
      key: "actions",
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
      <Input
        placeholder="Ara..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: "16px", maxWidth: 300 }}
      />

      {/* Excel ve PDF indirme butonları */}
      <Space
        style={{
          margin: "0 0 16px 0",
          width: "100%",
          justifyContent: isMobile ? "center" : "start", // mobilde ortala
          display: "flex",
        }}>
        <Button
          style={{
            backgroundColor: "#1677ff", // mobilde mavi (AntD default primary zaten mavi)
            borderColor: "#1677ff",
            color: "white"
          }}
          onClick={() => exportToExcel(excelData, excelFileName)}>
          Excel İndir
        </Button>
      </Space>

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
              expandedRowRender: (record, ff) => (
                <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                  <p><b>IMEI:</b> {record.imei}</p>
                  <p><b>Key Secret:</b> {record.key_secret}</p>
                  <p><b>Batarya:</b> {record.battery} %</p>
                  <p><b>Şehir/İlçe:</b> {<>
                    {record.city}/{record.town}
                    <Tag style={{ marginLeft: "8px" }} color="blue">{record?.priceObject?.name || "Yok"}</Tag>
                  </>} </p>
                  <p><b>Durum:</b> {record.status}</p>
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