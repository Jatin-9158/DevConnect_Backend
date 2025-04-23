const express = require('express');
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken")
const cookieParser = require('cookie-parser');
const cors = require("cors")
require('dotenv').config();
require("./utils/cronjob")
const app = express();
const { connectDB } = require('./config/database');
const User = require("./models/user");
const http = require("http")
const initializeSocket = require("./utils/socket")
const messageRoutes = require("./routes/message");
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], 
  allowedHeaders: ['Content-Type', 'Authorization'], 
  credentials: true 
}));
app.options('*', cors());
app.use(express.json());
app.use(cookieParser())
const authRouter=require("./routes/authRouter");
const profileRouter=require("./routes/profileRouter")
const requestRouter=require("./routes/requestRouter")
const userRouter = require("./routes/userRouter");
const otpRouter = require("./routes/otpRouter")
const uploadRouter = require("./routes/uploadRouter")
app.use("/", require("./routes/geminiRouter"));

app.use("/",authRouter)
app.use("/",profileRouter)
app.use("/",requestRouter)
app.use("/",userRouter)
app.use("/messages", messageRoutes);
app.use("/",otpRouter)
app.use("/",uploadRouter)
const server = http.createServer(app);
initializeSocket(server)
connectDB().then(()=>{
  console.log("Database Connected Successfully !!")
  server.listen(process.env.PORT_NO, () => {
    console.log(`Server is successfully running on port 3000`);
  });
  
})
.catch((err)=> 
{
  console.log("Database not connected successfully !!")
})


