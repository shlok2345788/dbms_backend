const app = require('./src/app');
const { testConnection } = require('./src/config/db');

const PORT = process.env.PORT || 5000;

(async () => {
  await testConnection();
})();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
