import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({    origin: process.env.CORS_ORIGIN,Credential:true}))
app.use(express.json({limit:"16kb"})) // to limit the json response
app.use(express.urlencoded({    extended:true,limit:"16kb"})) 
app.use(express.static("public")) //to store files locally 
app.use(cookieParser()) // server se cookies access aur set kar pau

//Routes Import
import userRouter from "./routes/user.routes.js"

//Routes Declaration
app.use("/api/v1/users",userRouter)


export { app }