module.exports = (sequelize, Sequelize) => {
  const Orders = sequelize.define("orders", {
    id: {
      type: Sequelize.STRING,
      primaryKey: true,
    },
    from_airport: {
      type: Sequelize.STRING,
    },
    from_country: {
      type: Sequelize.STRING,
    },
    to_airport: {
      type: Sequelize.STRING,
    },
    to_country: {
      type: Sequelize.STRING,
    },
    total: {
      type: Sequelize.INTEGER,
    },
    stripe_id: {
      type: Sequelize.STRING,
    },
    status: {
      type: Sequelize.BOOLEAN,
    },
  });
  return Orders;
};
