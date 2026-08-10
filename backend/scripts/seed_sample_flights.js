
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Airport = require('../models/flight/airport.model');
const Airline = require('../models/flight/airline.model');
const Flight = require('../models/flight/flight.model');
const dayjs = require('dayjs');

async function seedFlights() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Get Airports
        const del = await Airport.findOne({ $or: [{ iataCode: 'DEL' }, { airportCode: 'DEL' }] });
        const bom = await Airport.findOne({ $or: [{ iataCode: 'BOM' }, { airportCode: 'BOM' }] });

        if (!del || !bom) {
            console.log('DEL or BOM airport not found. Creating them...');
            // In a real scenario we'd create them, but here I expect them to exist based on previous checks.
            return;
        }

        // 2. Get an Airline
        let airline = await Airline.findOne({});
        if (!airline) {
            console.log('No airline found. Creating a default one...');
            airline = new Airline({
                name: 'GoAirClass Airlines',
                airlineName: 'GoAirClass Airlines',
                iataCode: 'GA',
                airlineCode: 'GA',
                icaoCode: 'GAC',
                country: 'India',
                status: true
            });
            await airline.save();
        }

        // 3. Create Flights for today and tomorrow
        const today = dayjs().startOf('day');
        
        const flightData = [
            {
                flightNumber: 'GA-101',
                airlineId: airline._id,
                fromAirport: del._id,
                toAirport: bom._id,
                departureTime: today.hour(10).minute(30).toDate(),
                arrivalTime: today.hour(12).minute(45).toDate(),
                duration: '2H 15M',
                totalSeats: 180,
                availableSeats: 150,
                price: 4500,
                status: 'Scheduled'
            },
            {
                flightNumber: 'GA-102',
                airlineId: airline._id,
                fromAirport: del._id,
                toAirport: bom._id,
                departureTime: today.hour(18).minute(0).toDate(),
                arrivalTime: today.hour(20).minute(15).toDate(),
                duration: '2H 15M',
                totalSeats: 180,
                availableSeats: 120,
                price: 5200,
                status: 'Scheduled'
            },
            {
                flightNumber: 'GA-201',
                airlineId: airline._id,
                fromAirport: del._id,
                toAirport: bom._id,
                departureTime: today.add(1, 'day').hour(9).minute(0).toDate(),
                arrivalTime: today.add(1, 'day').hour(11).minute(15).toDate(),
                duration: '2H 15M',
                totalSeats: 180,
                availableSeats: 180,
                price: 4200,
                status: 'Scheduled'
            }
        ];

        console.log('Inserting sample flights...');
        await Flight.insertMany(flightData);
        console.log('Done.');

    } catch (err) {
        console.error('Error seeding flights:', err);
    } finally {
        await mongoose.disconnect();
    }
}

seedFlights();
