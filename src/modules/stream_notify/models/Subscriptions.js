const queries = {
    create: `
        INSERT INTO stream_notify_subscriptions
            (broadcaster_id, added_by)
        VALUES (?, ?);`,
    read: `
        SELECT *
        FROM stream_notify_subscriptions
        WHERE broadcaster_id = ?;
    `,
    readAll: `
        SELECT *
        FROM stream_notify_subscriptions;
    `,
    readByAddedBy: `
        SELECT *
        FROM stream_notify_subscriptions
        WHERE added_by = ?
    `,
    delete: `
        DELETE
        FROM stream_notify_subscriptions
        WHERE broadcaster_id = ?;`,
}

export class Subscriptions {

    constructor(db) {
        this.db = db;
    }

    async createSubscription(broadcasterId, addedBy) {
        let sub = new Subscription(this.db, {broadcasterId, addedBy})
        await sub.create();
    }

    async getSubscription(broadcasterId) {
        let sub = new Subscription(this.db, {broadcasterId})
        if (await sub.load())
            return sub;
        return null
    }

    async getAllSubscriptions(addedBy) {
        let subsData = await this.db.all(queries.readAll)
        let subs = []
        for (let subsDatum of subsData) {
            subs.push(new Subscription(this.db,
                {
                    broadcasterId: subsDatum.broadcaster_id,
                    addedBy: subsDatum.added_by,
                }));
        }
        return subs;
    }

    async getAllSubscriptionsAddedBy(addedBy) {
        let subsData = await this.db.all(queries.readByAddedBy, addedBy)
        let subs = []
        for (let subsDatum of subsData) {
            subs.push(new Subscription(this.db,
                {
                    broadcasterId: subsDatum.broadcaster_id,
                    addedBy: subsDatum.added_by,
                }));
        }
        return subs;
    }
}

export class Subscription {
    #broadcasterId;

    get broadcasterId() {
        return this.#broadcasterId;
    }

    constructor(db, data) {
        this.db = db;
        this.#broadcasterId = data.broadcasterId;
        this.addedBy = data.addedBy;

    }

    async create() {
        await this.db.run(queries.create, this.#broadcasterId, this.addedBy);
    }

    async load() {
        let result = await this.db.get(queries.read, this.#broadcasterId);
        if (!result)
            return false;
        this.addedBy = result.added_by;
        return true;
    }

    async delete() {
        await this.db.run(queries.delete, this.#broadcasterId);
    }
}