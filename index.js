import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "Main",
  password: "************",
  port: 5432
});

db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let total = 0;
let countries = [];

app.get("/", async (req, res) => {
  //Write your code here.
  try {
    const dataset = await db.query("SELECT Country_Code FROM Visited_Countries");
    const result = dataset.rows;
    console.log(result);
    countries = result.map(item => item.country_code); //The map method creates a new array by applying a function to each element in the original array and extracts the country code property. Can also use forEach method and push each country_code to a new array
    total = result.length;
    res.render("index.ejs", {
      total: total,
      countries: countries
    });
  } catch (err) {
    console.error("Server Error!", err.stack);
    res.status(500).send("Server Error");
  }
});

app.post("/add", async (req, res) => {
  try {
    const countryName = req.body.country;
    const dataset = await db.query("SELECT Country_Code, Country_Name FROM Countries WHERE LOWER(Country_Name) LIKE $1", ['%' + countryName.toLowerCase() + '%']);
    const countryDetails = dataset.rows;
    if (countryDetails.length !== 0) { //valid country entered by the user
      console.log(countryDetails);
      const country = countryDetails[0];
      const check = await hasVisited(country.country_code);
      console.log(check);
      if (!check) {
        console.log("Adding New Country!");
        db.query("INSERT INTO Visited_Countries (Country_Code) VALUES ($1)", [country.country_code]);
        res.redirect("/");
      } else {
        console.log("Country Already Visited!");
        res.render("index.ejs", {
          total: total,
          countries: countries,
          error: "Country has already been added. Try Again!"
        });
      }
    } else {
      console.log("Invalid Country");
      res.render("index.ejs", {
        total: total,
        countries: countries,
        error: "Country does not exist. Try Again!"
      });
    }
  } catch (err) {
    console.error("Server Error!", err.stack);
    res.status(500).send("Server Error");
  }
});

async function hasVisited(countryCode) {
  try {
    const dataset = await db.query("SELECT Country_Code FROM Visited_Countries WHERE Country_Code = ($1)", [countryCode]);
    const result = dataset.rows;
    if (result.length === 0) { //Country not visited
      return false;
    }
    return true;
  } catch (err) {
    console.error("Server Error!", err.stack);
    res.status(500).send("Server Error");
  }
}

// Only call db.end() when app is shutting down
process.on("SIGINT", async () => {
  await db.end();
  console.log("Database connection closed.");
  process.exit(0);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
