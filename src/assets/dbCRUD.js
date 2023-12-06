import { info } from '../db/db.js'

class dbCRUD {
    constructor(DB_Instance) {
        this.DB = DB_Instance
    }

    add(table, kv) {
        this.DB[table].add(kv)
    }

    delete(table, v) {
        this.DB[table].delete(v)
    }

    update(table, kv) {
        this.DB[table].put(kv)
    }

    async query(table, kv) {
        return this.DB[table].get(kv)
    }
}

export const infoDB = new dbCRUD(info)