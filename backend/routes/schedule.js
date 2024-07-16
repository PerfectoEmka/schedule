import express from 'express';
import Schedule from '../models/Schedule.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const schedules = await Schedule.find();
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/', async (req, res) => {
    const schedule = new Schedule({
        person: req.body.person,
        task: req.body.task,
        start: req.body.start,
        end: req.body.end
    });

    try {
        const newSchedule = await schedule.save();
        res.status(201).json(newSchedule);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', getSchedule, async (req, res) => {
    if (req.body.person != null) {
        res.schedule.person = req.body.person;
    }
    if (req.body.task != null) {
        res.schedule.task = req.body.task;
    }
    if (req.body.start != null) {
        res.schedule.start = req.body.start;
    }
    if (req.body.end != null) {
        res.schedule.end = req.body.end;
    }

    try {
        const updatedSchedule = await res.schedule.save();
        res.json(updatedSchedule);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', getSchedule, async (req, res) => {
    try {
        await res.schedule.remove();
        res.json({ message: 'Deleted Schedule' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function getSchedule(req, res, next) {
    let schedule;
    try {
        schedule = await Schedule.findById(req.params.id);
        if (schedule == null) {
            return res.status(404).json({ message: 'Cannot find schedule' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }

    res.schedule = schedule;
    next();
}

export default router;
