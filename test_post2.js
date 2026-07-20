import axios from 'axios';
const api = axios.create({ baseURL: 'https://car-market-backend.onrender.com/api' });
api.post('/seller/cars', {}).then(res => console.log('SUCCESS:', res.status)).catch(err => console.log('ERROR:', err.response?.status, err.response?.data));
