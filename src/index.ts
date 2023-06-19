import express, { Express, Request, Response} from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./router";
import cors from "cors";
import http from "http";


dotenv.config();

const app: Express = express();
const port = process.env.PORT;


const jsonBodyMiddleware = express.json();

app.use(jsonBodyMiddleware);
app.use(cors());
app.use("/api", router);

const server = http.createServer(app);

async function startApp(){
    try {
        mongoose.connect('mongodb://root:password@127.0.0.1:27017', { })
            .then(() => console.log('⚡️ Connected to database!!!'))
            .catch(err => console.error('Error connecting to database', err));
            
        server.listen(port, () => {
            console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
        })
    } catch (e) {
        console.log("error start server");
    }
}

startApp();


