import Dexie from 'dexie';

export const info = new Dexie('Info')
info.version(3).stores({
    Account: "&uuid",
    Group: "&group"
})


// export const message = new Dexie('Message')