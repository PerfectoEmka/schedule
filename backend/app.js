import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import scheduleRouter from './routes/schedule.js';
import dotenv from 'dotenv';
import seedData from './models/SeedData.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

mongoose.connect(
    process.env.MONGO_URI,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
).then(async () => {
    console.log('DB connected');
    await seedData();
}).catch((err) => console.log('DB error', err));

const app = express();

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/schedule', scheduleRouter);

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, (err) => {
    if (err) {
        return console.log(err);
    }
    console.log(`Server is running on port ${PORT}`);
});

export default app;
