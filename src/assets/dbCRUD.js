export class dbCRUD {
    constructor(DB_Instance) {
        this.DB = DB_Instance
    }

    add(table, kv) {
        this.DB[table].add(kv)
    }

    delete(table, k) {
        this.DB[table].delete(k)
    }

    update(table, kv) {
        this.DB[table].put(kv)
    }

    async query(table, kv) {
        return this.DB[table].get(kv)
    }

    async queryRange(table, start, limit) {
        return this.DB.table(table).reverse().offset(start).limit(limit).toArray()
    }
}