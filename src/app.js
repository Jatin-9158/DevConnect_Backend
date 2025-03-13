const express = require('express');

const app=express();

// Request Handler
app.use("/hello",(req,res)=>res.send("Hello from the server"));

app.listen(3000,()=>{console.log(`Server is successfully running on 3000`)});
