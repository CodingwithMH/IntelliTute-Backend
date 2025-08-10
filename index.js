const express=require('express');
const connectToMongo = require("./db");
const Groq=require('groq-sdk')
const dotenv=require('dotenv')
dotenv.config();
const cors=require('cors')
const cookieParser = require("cookie-parser");
connectToMongo()
const app=express()
app.use(cookieParser(process.env.COOKIE_SECRET_KEY));
app.use(cors({
  methods:["GET","POST","DELETE","PUT"],
  origin:"https://intellitute.netlify.app",
  credentials:true
}))
app.use(express.json())
const port = process.env.PORT || 5000;
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
app.use('/api/auth',require("./routes/auth"))

app.post("/ask",async (req,res)=>{
  const {query}=req.body;
const chatCompletion=await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: query,
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
  res.json({message:chatCompletion.choices[0]?.message?.content || ""})
})

app.listen(port,()=>{
    console.log("app is running")
})