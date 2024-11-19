import axios from 'axios'

import { info } from '../../db/db.js'
import { dbCRUD } from './dbCRUD.js'
import store from './../../store'

const infoDB = new dbCRUD(info)

export const queryInfo = async function (table, lastUpdate, uuid) {
  try {
    const queryConditions = {
      Account: { uuid: uuid },
      Group: { group: uuid }
    }

    const res = await infoDB.query(table, queryConditions[table])
    if (res && (res.time === lastUpdate || !lastUpdate)) {
      return res
    }

    if (table === "Account") {
      const URL = `http://${localStorage.getItem('adress')}/v1/user/${uuid}/profile`
      const res = await axios.get(URL)
      const data = res.data
      
      infoDB.update("Account", {
        time: data.lastUpdate,
        uuid: uuid,
        username: data.username,
        avatar: data.avatar,
      })

      store.commit('refresh', {
        uuid: uuid,
        username: data.username,
        avatar: data.avatar
      })
      data.uuid = uuid
      return data
    }

    if (table === "Group") {
      const URL = `http://${localStorage.getItem('adress')}/v1/group/${uuid}/info`
      const res = await axios.get(URL)
      const data = res.data

      infoDB.update("Group", {
        time: data.lastUpdate,
        group: uuid,
        name: data.name,
        avatar: data.avatar,
      })
      
      data.group = uuid
      return data
    }
  } catch (err) {
    console.log(err)
  }
}
