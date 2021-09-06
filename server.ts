import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

// GET BOOKS
app.get("/books", async (req, res) => {

  try {
    const dbres = await client.query('select * from books');
    res.json(dbres.rows);
    
  } catch (error) {
    console.error(error.message);
    res.status(404).json({
      status: "fail",
      error: error.message
    })
  }
  
});

// POST A BOOK
app.post("/books", async (req, res) => {
  const {name, author, genre} = req.body;

  try {
    await client.query('INSERT INTO books (name, author, genre) VALUES ($1, $2, $3)', [name, author, genre]);
    res.status(201).json({
      status: "success",})
    
  } catch (error) {
    console.error(error.message);
    res.status(400).json({
      status: "fail",
      error: error.message
    }); 
  }
  
});

// GET ALL FAVOURITES
app.get("/favourites", async (req, res) =>{
  try {
    const dbres = await client.query('SELECT * FROM favourites');
    res.json(dbres.rows);
    
  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      error: error.message
    }); 
  }
});

// GET FAVOURITES OF ONE PERSON
app.get("/favourites/:id", async (req, res) =>{
  const id = parseInt(req.params.id);
  
  try {
    const dbres = await client.query('SELECT * FROM favourites WHERE userID=$1', [id]);
    res.json(dbres.rows);
    
  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      error: error.message
    }); 
  }
});


// GET FAVOURITES OF ONE PERSON
app.post("/favourites", async (req, res) =>{
  const {userid, bookid} = req.body;

  try {
    await client.query('INSERT INTO favourites (userid, bookid) VALUES ($1, $2)', [userid, bookid]);
    
  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      error: error.message
    }); 
  }
});


app.get("/favouriteBooks/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const dbres = await client.query('SELECT b.name, b.author, b.genre FROM books AS B INNER JOIN favourites AS f ON b.id=f.bookid WHERE f.userid=$1', [id])
    res.json(dbres.rows);
  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      error: error.message
    }); 
    
  }
});

app.get("/users", async (req,res) => {
  try {
    const dbres = await client.query('SELECT * from users');
    res.json(dbres.rows);
    
  } catch (error) {
    console.error(error.message)
    res.status(404).json({
      status: "fail",
      error: error.message
    }); 
    
  }
})


app.delete("/books/:id", async (req,res) => {
  const id = parseInt(req.params.id);
  try {
    await client.query('DELETE FROM books WHERE id=$1', [id]);
    res.status(201).json({
      status: "success",})
    
  } catch (error) {
    console.error(error.message)
    
  };

});



//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
