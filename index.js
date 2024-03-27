const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const db = require("./config/db");
const {createUser,login, verifyEmail, forgotPassword, resetPassword} = require("./controllers/user");
const authenticateToken = require("./middlewares/authmiddleware");
const app = express()
const router = express.Router()


app.use(cors())
app.use(express.json())
app.use(router);
const port = 8080;

db.connect((err) => {
    if(err){
      console.log('Error connecting to Db');
      return;
    }
    console.log('Connection established');
  });
  console.log("Runn")
router.post("/register" ,createUser)
router.post("/login",authenticateToken,login)
router.get('/verify-email',verifyEmail)
router.post('/forgot-password',forgotPassword)
router.post('/reset-password',resetPassword)

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
  });