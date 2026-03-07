import {promises as fs}  from "fs";

let instancePromise = null

export async function getInstance(){
    if(instancePromise === null){
        instancePromise = (async ()=>{
            let config = new Config();
            await config.init();
            return config;
        })();
    }
    return instancePromise;
}

class Config {
    constructor() {
        this.config = null;
    }

    async init(){
        if(this.config !== null){
            throw new Error("Config already loaded")
        }
        let config = await fs.readFile("./data/config.json", "utf8");
        this.config = JSON.parse(config);
    }
    async save(){
        await fs.writeFile("./config.json", JSON.stringify(this.config, null, 4));
    }

    ensureValue(path, type, defaultValue){
        if(this.config === null)
            throw new Error("Config not loaded")

        if(!this.verifyType(type, defaultValue))
            throw new Error("defaultValue does not match type")

        let components = path.split(".");
        let current = this.config;
        for(let i = 0;i < components.length; i++){
            if(current[components[i]] == null){
                if(i === components.length -1){
                    current[components[i]] = defaultValue;
                } else {
                    current[components[i]] = {};
                }
            }
            current = current[components[i]];
        }

        if(this.verifyType(type, current)){
            return current;
        } else {
            switch (typeof type) {
                case "string":
                    throw new Error(`Invalid type of ${path} , must be type of ${type}`)
                case "function":
                    throw new Error(`Invalid type of ${path} , must pass following condition function:\n ${type.toString()}`)
                default:
                    throw new Error("Unrecognized type");
            }
        }

    }


    verifyType(type, value){
        if(type === null){
            return true
        } else if(typeof type === "string") {
            return typeof value === type;
        } else if (typeof type === "function"){
            return type(value);
        }
    }

}