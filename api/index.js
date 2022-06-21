const db = require("./models");
const { default: axios } = require("axios");
const express = require("express");
const { parse } = require("csv-parse");
const fs = require("fs");
const cors = require("cors");
const { create } = require("./db.service");
const app = express();
const stripe = require("stripe")(
  "sk_test_51JXZUEG7sexGMMroUi7TCRjAEAkzEKi7OnoElwhOq1U2RRm20XXelosapCngJBvJs4IdbNzAzTyr8gdWfYEvd8LG00hShlxzXo"
);
app.use(cors());
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.json());

db.sequelize
  .sync()
  .then(() => {
    console.log("Synced db.");
  })
  .catch((err) => {
    console.log("Failed to sync db: " + err.message);
  });

app.get("/currentweather", async (req, res) => {
  try {
    console.log("Request recvd");
    let data = await axios.get(
      `http://api.weatherapi.com/v1/current.json?key=d631e98629ea4438aa4141525210810&q=${req.query.country}`
    );
    res.send({
      data: data.data.current,
    });
  } catch (error) {
    console.log(error);
    console.log("Err");
    res.status(500).send(error);
  }
});

app.get("/airports", async (req, res) => {
  let data = [];
  fs.createReadStream("./airports.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
      data.push(row);
    })
    .on("finish", () => {
      if (req?.query?.country) {
        res.send({
          success: true,
          data: data
            .filter((el) => el[8] == req?.query?.country)
            .map((el) => {
              let result = {};
              let kw = [
                "id",
                "ident",
                "type",
                "name",
                "latitude_deg",
                "longitude_deg",
                "elevation_ft",
                "continent",
                "iso_country",
                "iso_region",
                "municipality",
                "scheduled_service",
                "gps_code",
                "iata_code",
                "local_code",
                "home_link",
                "wikipedia_link",
                "keywords",
              ];
              for (let i of kw) {
                result[i] = el[kw.indexOf(i)];
              }
              return result;
            }),
        });
      } else
        res.send({
          success: true,
          data: data.map((el) => {
            let result = {};
            let kw = [
              "id",
              "ident",
              "type",
              "name",
              "latitude_deg",
              "longitude_deg",
              "elevation_ft",
              "continent",
              "iso_country",
              "iso_region",
              "municipality",
              "scheduled_service",
              "gps_code",
              "iata_code",
              "local_code",
              "home_link",
              "wikipedia_link",
              "keywords",
            ];
            for (let i of kw) {
              result[i] = el[kw.indexOf(i)];
            }
            return result;
          }),
        });
    });
});

app.post("/travel", async (req, res) => {
  console.log("Travel endpoint");
  console.log("req.body", req.body);
  let airport1 = req.body.from;
  let airport2 = req.body.to;
  airport1 = await getAirport(airport1);
  airport2 = await getAirport(airport2);
  console.log("airport1", airport1);
  console.log("airport2", airport2);
  let lon1 = parseFloat(airport1.longitude_deg);
  let lon2 = parseFloat(airport2.longitude_deg);
  let lat1 = parseFloat(airport1.latitude_deg);
  let lat2 = parseFloat(airport2.latitude_deg);
  // The math module contains a function
  // named toRadians which converts from
  // degrees to radians.
  lon1 = (lon1 * Math.PI) / 180;
  lon2 = (lon2 * Math.PI) / 180;
  lat1 = (lat1 * Math.PI) / 180;
  lat2 = (lat2 * Math.PI) / 180;

  // Haversine formula
  let dlon = lon2 - lon1;
  let dlat = lat2 - lat1;
  let a =
    Math.pow(Math.sin(dlat / 2), 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);

  let c = 2 * Math.asin(Math.sqrt(a));

  // Radius of earth in kilometers. Use 3956
  // for miles
  let r = 6371;

  // calculate the result
  let distance = c * r;

  let cost = Math.floor(distance * 10);

  try {
    console.log(cost);
    const { url, id } = await createCheckoutSession(
      airport1.iso_country,
      airport2.iso_country,
      cost
    );
    create(
      airport1.name,
      airport1.iso_country,
      airport2.name,
      airport2.iso_country,
      cost,
      id,
      true,
      res
    );
    return res.send({ uri: url });
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

async function createCheckoutSession(from, to, price) {
  try {
    let session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      success_url: "http://localhost:3000/success.html",
      cancel_url: "http://localhost:3000/cancel.html",
      line_items: [
        {
          price_data: {
            currency: "USD",
            product_data: {
              name: `Flight from ${from} to ${to}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
    });
    return session;
  } catch (err) {
    console.log(err);
    throw new Error(err);
  }
}

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/book", (req, res) => {
  res.render("flight");
});

app.get("/allcountries", (req, res) => {
  let data = [];
  fs.createReadStream("./countries.csv")
    .pipe(parse({ delimiter: ",", from_line: 2 }))
    .on("data", function (row) {
      data.push(row);
    })
    .on("finish", () => {
      if (req.query.country) {
        return res.send(
          data
            .filter(
              (el) => el[0].toLowerCase() == req.query.country.toLowerCase()
            )
            .map((el) => el[1])[0]
        );
      }
      res.send(data);
    });
});

function getAirport(id) {
  let data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream("./airports.csv")
      .pipe(parse({ delimiter: ",", from_line: 2 }))
      .on("data", function (row) {
        data.push(row);
      })
      .on("finish", () => {
        resolve(
          data
            .filter((el) => el[0] == id)
            .map((el) => {
              let result = {};
              let kw = [
                "id",
                "ident",
                "type",
                "name",
                "latitude_deg",
                "longitude_deg",
                "elevation_ft",
                "continent",
                "iso_country",
                "iso_region",
                "municipality",
                "scheduled_service",
                "gps_code",
                "iata_code",
                "local_code",
                "home_link",
                "wikipedia_link",
                "keywords",
              ];
              for (let i of kw) {
                result[i] = el[kw.indexOf(i)];
              }
              return result;
            })[0]
        );
      });
  });
}

app.listen("3000");
