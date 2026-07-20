import axios from 'axios';
const api = axios.create({ baseURL: 'https://api.negmcars.com/api' });
api.get('/user/brands').then(res => console.log(JSON.stringify(res.data.data.slice(0, 3), null, 2))).catch(err => console.log(err.message));
