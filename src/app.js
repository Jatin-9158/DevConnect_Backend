const express = require('express');
const mongoose = require("mongoose");
const bcrypt  = require("bcrypt");
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser');
const cors = require("cors")
require('dotenv').config();
const app = express();
const { connectDB } = require('./config/database');
const User = require("./models/user");
const {userAuth} = require("./middlewares/auth")


app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true 
}));
app.options('*', cors());
app.use(express.json());

app.use(express.json())
app.use(cookieParser())
const authRouter=require("./routes/authRouter");
const profileRouter=require("./routes/profileRouter")
const requestRouter=require("./routes/requestRouter")
const userRouter = require("./routes/userRouter");
app.use("/",authRouter)
app.use("/",profileRouter)
app.use("/",requestRouter)
app.use("/",userRouter)
connectDB().then(()=>{
  console.log("Database Connected Successfully !!")
  app.listen(3000, () => {
    console.log(`Server is successfully running on port 3000`);
  });
  
})
.catch((err)=> 
{
  console.log("Database not connected successfully !!")
})


