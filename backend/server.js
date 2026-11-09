require('dotenv').config({ path: require('node:path').join(__dirname, '.env') });

const app = require('./src/app');
const port = Number(process.env.PORT) || 3000;

app.listen(port, '0.0.0.0', () => {
  console.log(`Pay Services activo en el puerto ${port}.`);
});
