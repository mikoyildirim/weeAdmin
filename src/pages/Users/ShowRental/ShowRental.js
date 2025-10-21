import { Button, Card, Col, Form, Input, Row, Spin } from 'antd';
import axios from '../../../api/axios';
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);
dayjs.locale("tr");

const ShowRental = () => {
  const { id } = useParams();
  const [rental, setRental] = useState(null)
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);

  console.log(id)
  useEffect(() => {
    getRental()
  }, [])

  
  const getRental = async () => {
    setLoading(true)
    await axios.get(`/rentals/${id}`)
      .then((res) => {
        console.log(res.data)
        setRental(res.data)
        form.setFieldsValue({
          qrLabel: res.data.device.qrlabel,
          city: res.data.device.city,
          startDate: dayjs.utc(res.data.start).format("YYYY-MM-DD HH.mm"),
          endDate: dayjs.utc(res.data.end).format("YYYY-MM-DD HH.mm"),
          duration: res.data.duration,
          total: res.data.total,
        });
        setLoading(false)
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

      <Form layout="vertical" form={form}>
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
              <Input style={{ color: "black" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Bitiş Saati" name="endDate">
              <Input style={{ color: "black" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Sürüş Dakikası" name="duration">
              <Input disabled style={{ color: "black" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Sürüş Tutarı" name="total">
              <Input disabled style={{ color: "black" }} />
            </Form.Item>
          </Col>
        </Row>

        <Button type="primary"  >
          Kaydet
        </Button>
      </Form>
    </Card>
  )
}

export default ShowRental