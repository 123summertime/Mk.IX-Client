export class dbCRUD {
  constructor(DB_Instance) {
    this.DB = DB_Instance
  }

  add(table, kv) {
    this.DB[table].add(kv)
  }

  delete(table, k, v) {
    this.DB[table].where(k).equals(v).delete()
  }

  update(table, kv) {
    this.DB[table].put(kv)
  }

  async query(table, kv) {
    return await this.DB[table].get(kv)
  }

  async queryRange(table, start, limit, reverse) {
    // reverse从后往前数
    if (reverse) {
      return await this.DB.table(table).reverse().offset(start).limit(limit).toArray()
    }
    return await this.DB.table(table).offset(start).limit(limit).toArray()
  }

  deleteDB() {
    return this.DB.delete()
  }
}