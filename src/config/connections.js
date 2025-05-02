let sequelize;

if (process.env.DB_URL) {
  sequelize = new Sequelize(process.env.DB_URL);
} else {
  sequelize = new Sequelize(
    process.env.TINTAMAYTOES_DB_NAME,
    process.env.TINTAMAYTOES_DB_USER,
    process.env.TINTAMAYTOES_DB_PW,
    {
      host: 'localhost',
      dialect: 'postgres',
    },
  );
}