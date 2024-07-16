import mongoose from 'mongoose';
const { Schema } = mongoose;

const scheduleSchema = new Schema({
    person: { type: String, required: true },
    task: { type: String, required: false },
    start: { type: String, required: false },
    end: { type: String, required: false }
});

export default mongoose.model('Schedule', scheduleSchema);
