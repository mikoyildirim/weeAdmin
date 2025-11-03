import React, { useEffect, useState } from "react";
import {
    Card,
    Typography,
    Form,
    Input,
    Select,
    DatePicker,
    InputNumber,
    Radio,
    Button,
    List,
    Upload,
    Spin,
    Row,
    Col,
} from "antd";
import dayjs from "dayjs";
import { UploadOutlined } from "@ant-design/icons";
import axios from "../../../api/axios";

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CreateCampaign = () => {
    const [campaign, setCampaign] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    const [form] = Form.useForm();
    const [conditions, setConditions] = useState([]);
    const [fileList, setFileList] = useState([]);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 991);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);


    const addCondition = () => setConditions([...conditions, ""]);
    const removeCondition = (index) =>
        setConditions(conditions.filter((_, i) => i !== index));
    const handleConditionChange = (index, value) => {
        const newConditions = [...conditions];
        newConditions[index] = value;
        setConditions(newConditions);
    };

    const handleFinish = async (values) => {
        if (conditions.length === 0 || conditions.some((c) => !c.trim())) {
            return Form.error({
                title: "Eksik Bilgi",
                content: "Lütfen en az bir geçerli katılım koşulu girin!",
            });
        }

        if (fileList.length === 0) {
            return Form.error({
                title: "Eksik Bilgi",
                content: "Lütfen kampanya görseli yükleyin!",
            });
        }

        let imageBase64 = null;

        if (fileList.length > 0 && fileList[0].originFileObj) {
            const file = fileList[0].originFileObj;
            const reader = new FileReader();

            imageBase64 = await new Promise((resolve, reject) => {
                reader.readAsDataURL(file);
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });
        } else if (fileList[0]?.url) {
            // Eğer eski bir görsel varsa (örneğin kampanyayı düzenliyorsan)
            imageBase64 = fileList[0].url;
        }
        const payload = {
            ...values,
            conditions,
            image: imageBase64,
        }
        console.log("Kaydedilecek değerler:", payload);
        // await axios.patch(`/campaigns/${id}`, payload)
        // .then((res)=>console.log(res.data))
        // .catch((err)=>console.log(err))
    };

    if (loading)
        return (
            <Spin
                tip="Yükleniyor..."
                size="large"
                style={{ display: "block", marginTop: 50, textAlign: "center" }}
            />
        );


    return (
        <Card>
            <Title level={2} style={{ marginBottom: 20 }}>
                📢 Kampanya Oluştur
            </Title>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                validateMessages={{
                    required: "Bu alan boş bırakılamaz!",
                }}
                initialValues={{
                    status: "PASSIVE", // 👈 varsayılan değer
                    startDate: dayjs(),
                    endDate: dayjs(),
                }}
            >
                <Row gutter={16}>
                    <Col span={24}>
                        <Form.Item
                            label="Kampanya İsmi"
                            name="campaignName"
                            rules={[{ required: true }]}
                        >
                            <Input />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item
                            label="Kampanya Görseli"
                            rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}
                        >
                            <Upload
                                listType="picture-card"
                                fileList={fileList}
                                maxCount={1}
                                onRemove={(file) => setFileList(fileList.filter((f) => f.uid !== file.uid))}
                                beforeUpload={(file) => {
                                    setFileList([{ ...file, url: URL.createObjectURL(file), originFileObj: file }]);
                                    return false; // yükleme iptal
                                }}
                            >
                                <Button icon={<UploadOutlined />}>Yükle</Button>
                            </Upload>


                            {/* Burada büyük önizleme */}
                            {fileList.length > 0 && (
                                <img
                                    src={fileList[0].url}
                                    alt="Kampanya Görseli"
                                    style={{ marginTop: 16, width: "100%", maxWidth: 500 }}
                                />
                            )}
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item label="Kampanya Açıklaması" name="description" rules={[{ required: true }]}>
                            <TextArea rows={3} />
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Form.Item label="Katılım Koşulları" rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}>
                            <List
                                dataSource={conditions}
                                renderItem={(item, index) => (
                                    <List.Item>
                                        <Input
                                            value={item}
                                            onChange={(e) =>
                                                handleConditionChange(index, e.target.value)
                                            }
                                            style={{ width: "85%", marginRight: 8 }}
                                        />
                                        <Button danger onClick={() => removeCondition(index)}>
                                            Sil
                                        </Button>
                                    </List.Item>
                                )}
                                footer={
                                    <Button
                                        type="dashed"
                                        onClick={addCondition}
                                        style={{ width: "100%" }}
                                    >
                                        + Koşul Ekle
                                    </Button>
                                }
                            />
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="Kampanya Tipi" name="campaignType" rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}>
                            <Select>
                                <Option value="FOLLOWSOCIAL">Takip Et Kazan Kampanyası</Option>
                                <Option value="BIRTHDAY">Doğum Günü Kampanyası</Option>
                                <Option value="LOAD">Yükleme Kampanyası</Option>
                                <Option value="RENTAL">Sürüş Kampanyası</Option>
                                <Option value="PASSIVEDEVICE">Pasif Cihaz Kampanyası</Option>
                                <Option value="UNUSED">Kullanılmayan Cihazlar Kampanyası</Option>
                                <Option value="RANK">Rütbe Kampanyası</Option>
                                <Option value="REFERENCECODE">Referans Kodu Kampanyası</Option>
                                <Option value="SCORE">Poligon Kampanyası</Option>
                                <Option value="STATION">Bataryası Düşük Cihaz Kampanyası</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="İndirim Türü" name="discountType" rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}>
                            <Select>
                                <Option value="AMOUNT">Tutar</Option>
                                <Option value="PERCENTAGE">Yüzde</Option>
                            </Select>
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="Yüzdesel İndirim" name="percentage" rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}>
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="İndirim Tutarı" name="amount" rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}>
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="Başlangıç Tarihi" name="startDate" rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}>
                            <DatePicker showTime style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="Bitiş Tarihi" name="endDate"
                            rules={[
                                {
                                    required: true,
                                    validator: (_, value) => {
                                        const startDate = form.getFieldValue("startDate");
                                        if (!value || !startDate) return Promise.resolve();
                                        if (value.isBefore(startDate)) {
                                            return Promise.reject(new Error("Bitiş tarihi, başlangıç tarihinden önce olamaz!"));
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}>
                            <DatePicker showTime style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="Öncelik" name="priority" rules={[{ required: true, message: "Bu alan boş bırakılamaz!" }]}>
                            <InputNumber min={1} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>

                    <Col span={isMobile ? 24 : 12}>
                        <Form.Item label="Kampanya Durumu" name="status">
                            <Radio.Group >
                                <Radio value="ACTIVE">Aktif</Radio>
                                <Radio value="PASSIVE">Pasif</Radio>
                            </Radio.Group>
                        </Form.Item>
                    </Col>

                    <Col span={24}>
                        <Button type="primary" htmlType="submit">
                            Kaydet
                        </Button>
                    </Col>
                </Row>
            </Form>
        </Card>
    );
};

export default CreateCampaign;
