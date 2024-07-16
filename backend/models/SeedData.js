import Schedule from './Schedule.js';

const seedData = async () => {
    try {
        const count = await Schedule.countDocuments();
        if (count === 0) {
            const sampleData = [
                { person: 'Anton', task: 'first', start: 'Monday', end: 'Wednesday' },
                { person: 'Ivan', task: 'second', start: 'Monday', end: 'Monday' },
                { person: 'Oleg'},
                { person: 'Petr', task: 'third', start: 'Wednesday', end: 'Friday' },
            ];
            await Schedule.insertMany(sampleData);
            console.log('Sample data inserted successfully');
        } else {
            console.log('Sample data already exists');
        }
    } catch (error) {
        console.error('Error seeding data:', error);
    }
};

export default seedData;
