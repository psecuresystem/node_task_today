module.exports = {
  HOST: "localhost",
  USER: "debian-sys-maint",
  PASSWORD: "iOankiLaeeFqLG3l",
  DB: "testdb",
  dialect: "mysql",
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};
