import { Button, Card, Col, Form, Input, Row, Spin } from 'antd';
import axios from '../../../api/axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);


const ShowRental = () => {
  const { id } = useParams();
  const [rental, setRental] = useState(null)
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [priceObject, setPriceObject] = useState(null);


  useEffect(() => {
    getRental()
  }, [])

  console.log(priceObject)


  const handleSave = async () => {
    try {

      const values = await form.validateFields();
      console.log("Form verileri:", values.startDate);
      console.log("Yerel:", dayjs().format());
      await axios.patch(`/rentals/${id}`, {
        "total": values.total,
        "start": dayjs(values.startDate).add(3, "hour"),
        "date": dayjs().format(),
        "created_date": dayjs().format(),
        "duration": values.duration,
        "end": dayjs(values.endDate).add(3, "hour"),
      }).then((res) => {
        console.log(res.data)
      }).catch((error) => {
        console.log(error)
      })
      // burada API isteği veya işlem yapılabilir
    } catch (error) {
      console.log("Doğrulama hatası:", error);
    }
  };


  // Tarihler değiştiğinde otomatik hesaplama
  const handleDateChange = () => {
    const start = form.getFieldValue("startDate");
    const end = form.getFieldValue("endDate");
    console.log(Date(start))
    if (!start || !end || !priceObject) return;

    const startTime = dayjs(start, "YYYY-MM-DD HH:mm");
    const endTime = dayjs(end, "YYYY-MM-DD HH:mm");

    if (endTime.isAfter(startTime)) {
      const diffMinutes = (endTime.diff(startTime, "minute"));
      let total = 0;

      if (diffMinutes <= 0) {
        total = priceObject.startPrice; // sadece başlangıç ücreti
      } else {
        total = priceObject.startPrice + diffMinutes * priceObject.minutePrice;
      }

      form.setFieldsValue({
        duration: diffMinutes,
        total: total.toFixed(2),
      });
    } else {
      form.setFieldsValue({
        duration: 0,
        total: priceObject.startPrice.toFixed(2),
      });
    }
  };

  const getRental = async () => {
    setLoading(true)
    await axios.get(`/rentals/${id}`)
      .then((res) => {
        console.log(res.data)
        setRental(res.data)
        setPriceObject(res.data.device.priceObject)
        form.setFieldsValue({
          qrLabel: res.data.device.qrlabel,
          city: res.data.device.city,
          startDate: dayjs.utc(res.data.start).format("YYYY-MM-DD HH:mm"),
          endDate: dayjs.utc(res.data.end).format("YYYY-MM-DD HH:mm"),
          duration: Math.trunc(res.data.duration/60),
          total: res.data.total,
        });
        setLoading(false)
        console.log(res.data)
      })
      .catch((err) => {
        console.log(err)
        setLoading(false)
      })
  }


  return (
    <Card title={`Sürüş Güncelle - ${id}`} style={{ maxWidth: 900, margin: "20px auto" }}>

      <Spin
        spinning={loading}
        tip="Yükleniyor..."
        size="large"
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", zIndex: 10 }}
      />

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSave}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Cihaz QR" name="qrLabel">
              <Input disabled style={{ color: "black" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Şehir" name="city">
              <Input disabled style={{ color: "black" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Başlangıç Saati" name="startDate">
              <Input style={{ color: "black" }} onChange={handleDateChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Bitiş Saati" name="endDate">
              <Input style={{ color: "black" }} onChange={handleDateChange} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Sürüş Dakikası" name="duration">
              <Input disabled style={{ color: "black" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Sürüş Tutarı (₺)" name="total">
              <Input disabled style={{ color: "black" }} />
            </Form.Item>
          </Col>
        </Row>

        <Button type="primary" htmlType="submit" >
          Kaydet
        </Button>
      </Form>
    </Card>
  )
}

export default ShowRental