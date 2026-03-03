import { faker } from "@faker-js/faker";
import sequelize from "./config/sequelize";
import Division from "./models/Division";
import User from "./models/User";
import Fighter from "./models/Fighter";
import Sponsor from "./models/Sponsor";
import Event from "./models/Event";
import bcrypt from "bcryptjs";

const GOVERNMENTS_DIVISIONS = [
    { name: "Strawweight", gender: "female", min_weight: 105, max_weight: 115 },
    { name: "Flyweight", gender: "female", min_weight: 116, max_weight: 125 },
    { name: "Flyweight", gender: "male", min_weight: 116, max_weight: 125 },
    { name: "Bantamweight", gender: "male", min_weight: 126, max_weight: 135 },
    { name: "Featherweight", gender: "male", min_weight: 136, max_weight: 145 },
    { name: "Lightweight", gender: "male", min_weight: 146, max_weight: 155 },
    { name: "Welterweight", gender: "male", min_weight: 156, max_weight: 170 },
    { name: "Middleweight", gender: "male", min_weight: 171, max_weight: 185 },
    { name: "Light Heavyweight", gender: "male", min_weight: 186, max_weight: 205 },
    { name: "Heavyweight", gender: "male", min_weight: 206, max_weight: 265 },
];

const seedDatabase = async () => {
    try {
        console.log("Connecting to the database...");
        await sequelize.authenticate();

        // 1. Divisions
        console.log("Seeding divisions...");
        let divisions = await Division.findAll();
        if (divisions.length === 0) {
            divisions = await Division.bulkCreate(GOVERNMENTS_DIVISIONS as any);
        }

        const passwordHash = await bcrypt.hash("password123", 10);

        // 2. Sponsors
        console.log("Seeding 15 random sponsors...");
        const sponsorTiers = ["Platinum", "Gold", "Silver", "Bronze", "Partner"];
        for (let i = 0; i < 15; i++) {
            const user = await User.create({
                name: faker.company.name(),
                email: faker.internet.email(),
                password: passwordHash,
                user_type: "SPONSOR",
                country: faker.location.country(),
            });

            await Sponsor.create({
                user_id: user.id,
                company_name: user.name,
                logo_url: faker.image.url({ width: 200, height: 200 }),
                description: faker.company.catchPhrase(),
                tier: faker.helpers.arrayElement(sponsorTiers),
                email: user.email,
                password: passwordHash,
                wallet_address: `0x${faker.string.hexadecimal({ length: 40 }).replace('0x', '')}`,
            });
        }

        // 3. Events
        console.log("Seeding 15 random events...");
        const eventStatuses = ["upcoming", "completed", "live"];
        for (let i = 0; i < 15; i++) {
            const division = faker.helpers.arrayElement(divisions);
            await Event.create({
                title: `Fighter League ${faker.number.int({ min: 100, max: 200 })}: ${faker.location.city()}`,
                event_date: faker.date.future().toISOString().split('T')[0],
                started_time: "19:00",
                location: `${faker.location.city()}, ${faker.location.country()}`,
                division: division.name,
                timezone: "UTC",
                status: faker.helpers.arrayElement(eventStatuses),
            });
        }

        // 4. Fighters
        console.log("Seeding 30 random fighters...");
        for (let i = 0; i < 30; i++) {
            const gender = faker.helpers.arrayElement(["male", "female"]);
            const fname = faker.person.firstName(gender as any);
            const lname = faker.person.lastName();
            const division = faker.helpers.arrayElement(divisions.filter(d => d.gender === gender)) || divisions[0];

            const user = await User.create({
                name: `${fname} ${lname}`,
                email: faker.internet.email(),
                password: passwordHash,
                user_type: "FIGHTER",
                country: faker.location.country(),
            });

            const wins = faker.number.int({ min: 0, max: 30 });

            await Fighter.create({
                user_id: user.id,
                name: user.name,
                country: user.country,
                division_id: division.id,
                division: division.name,
                weight: faker.number.float({ min: Number(division.min_weight), max: Number(division.max_weight), fractionDigits: 1 }),
                gender: gender,
                wins: wins,
                losses: faker.number.int({ min: 0, max: 10 }),
                draws: faker.number.int({ min: 0, max: 3 }),
                knockouts: faker.number.int({ min: 0, max: wins }), // Knockouts can't exceed wins
                age: faker.number.int({ min: 18, max: 40 }),
                height: `${faker.number.int({ min: 5, max: 6 })}'${faker.number.int({ min: 0, max: 11 })}"`,
                reach: `${faker.number.int({ min: 60, max: 80 })}"`,
                image: faker.image.url({ width: 400, height: 600 }),
                bio: faker.lorem.paragraph(),
                status: "verified",
                ranking: 0
            });
        }

        console.log("🎉 Database seeded successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedDatabase();
