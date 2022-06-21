const sequelize = require("./models").sequelize;
const Sequelize = require("sequelize");

const Orders = require("./models/order.model.js")(sequelize, Sequelize);
// Create and Save a new Tutorial
module.exports.create = (
  from_airport,
  from_country,
  to_airport,
  to_country,
  total,
  stripe_id,
  status
) => {
  const order = {
    from_airport,
    from_country,
    to_airport,
    to_country,
    total,
    stripe_id,
    status,
  };
  // Save order in the database
  Orders.create(order)
    .then((data) => {
      return data;
    })
    .catch((err) => {
      return {
        message:
          err.message || "Some error occurred while creating the Tutorial.",
      };
    });
};
