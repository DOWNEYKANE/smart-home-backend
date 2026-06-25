require('dotenv').config()

module.exports = {
  port: process.env.PORT || 3001,
  jwtSecret: process.env.JWT_SECRET || 'smart-home-jwt-secret-2026',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'smart_home'
  },
  mqtt: {
    host: process.env.MQTT_HOST || 'localhost',
    port: parseInt(process.env.MQTT_PORT) || 1883
  },
  gizwits: {
    productKey: process.env.GIZWITS_PRODUCT_KEY || '',
    productSecret: process.env.GIZWITS_PRODUCT_SECRET || '',
    deviceDid: process.env.GIZWITS_DEVICE_DID || '',
    username: process.env.GIZWITS_USERNAME || '',
    password: process.env.GIZWITS_PASSWORD || '',
    enabled: process.env.GIZWITS_ENABLED === 'true'
  }
}
