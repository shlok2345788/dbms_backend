const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  console.log('Starting AI Career Compass backend...');
  console.log(`PORT=${PORT}`);
  console.log(`DB_HOST=${process.env.DB_HOST || 'not set'}`);
  console.log(`DB_NAME=${process.env.DB_NAME || 'not set'}`);
  console.log(`JWT_SECRET=${process.env.JWT_SECRET ? 'set' : 'missing'}`);
  await testConnection();
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
