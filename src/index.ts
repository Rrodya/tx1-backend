import express, { Express, Request, Response} from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./router";
import cors from "cors";


dotenv.config();

const app: Express = express();
const port = process.env.PORT;
const jsonBodyMiddleware = express.json();

app.use(jsonBodyMiddleware);
app.use(cors());
app.use("/api", router);

async function startApp(){
    try {
        mongoose.connect('mongodb://root:password@127.0.0.1:27017', { })
            .then(() => console.log('⚡️ Connected to database!!!'))
            .catch(err => console.error('Error connecting to database', err));
            
        app.listen(port, () => {
            console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
        })
    } catch (e) {
        console.log("error start server");
    }
}

startApp();


