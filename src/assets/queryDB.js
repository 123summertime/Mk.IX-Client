import axios from 'axios'

import { infoDB } from "./dbCRUD"

export const queryInfo = async function (table, lastUpdate, uuid) {
    try {
        const queryConditions = {
            Account: { uuid },
            Group: { group: uuid }
        }

        const res = await infoDB.query(table, queryConditions[table]);

        if (res && res["time"] === lastUpdate) {
            return res
        }

        if (table === "Account") {
            const URL = `http://${localStorage.getItem('adress')}/getUserInfo?uuid=${uuid}`
            const res = await axios.get(URL)
            const data = res["data"]
            infoDB.update("Account", {
                "time": data["lastUpdate"],
                "uuid": uuid,
                "userName": data["userName"],
                "avatar": data["avatar"]
            })
            return data
        }

        if (table === "Group") {
            const URL = `http://${localStorage.getItem('adress')}/getGroupInfo?group=${uuid}`
            const res = await axios.get(URL)
            const data = res["data"]
            infoDB.update("Group", {
                "time": data["lastUpdate"],
                "group": uuid,
                "name": data["name"],
                "avatar": data["avatar"]
            })
            return data
        }
    } catch (err) {
        console.log(err)
    }
}