import { useParams } from 'react-router-dom';

const DeviceDetail = () => {
  const { deviceId } = useParams(); // URL'deki :deviceId burada

  console.log(deviceId); // örn: 222414

  return (
    <div>
      <h1>Device Detail: {deviceId}</h1>
    </div>
  );
};

export default DeviceDetail;