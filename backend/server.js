require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });

const app = require('./src/app');
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Pay Services activo en el puerto ${port}.`);
});
