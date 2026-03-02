import sqlite3 from "sqlite3";
import * as sqlite from "sqlite";
const config = await (await import("./Config.js")).getInstance();
const DATABASE_FILE = config.ensureValue("database.path", "string", "./data/Database.sqlite")

export default class Database {
    constructor () {
        this.initialized = false;
        this.db = null;
    }
    async init(){
        if(!this.initialized){
            console.log(`Loading Database file: ${DATABASE_FILE}`);
            this.db = await sqlite.open({
                filename: DATABASE_FILE,
                driver: sqlite3.Database
            })

            await this.db.migrate({migrationsPath: "./src/migrations"});
            this.initialized = true;
            console.log(`Database loaded`);
        } else {
            console.log("Database already initialized.");
        }
    }
    async run(query, ...parameters){
        return this.db.run(query, ...parameters);
    }
    async get(query, ...parameters){
        return this.db.get(query, ...parameters);
    }

    async all(query, ...parameters){
        return this.db.all(query, ...parameters);
    }
}
