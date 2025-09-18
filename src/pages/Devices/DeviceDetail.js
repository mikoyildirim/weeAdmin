import { useParams } from 'react-router-dom';

const DeviceDetail = () => {
  const { id } = useParams(); // URL'deki :deviceId burada

  console.log(id); // örn: 222414

  return (
    <div>
      <h1>Device Detail: {id}</h1>
    </div>
  );
};

export default DeviceDetail;