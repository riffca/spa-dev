import { getFireDocs, getFireDocById, getFireDocsByIds } from '../firestore/lib.js'
import { createStore } from '../store.js'
import { sendMessage } from './chats.js'

export const usersStore = createStore('users')

export function init(){
    usersStore.profiles  = {}
    usersStore.friends = {}
}


export function setupRequetsSnapshot(){
    const unsubscribe = getFireSnapshot(collectionName,[],{
        add(doc){

        },
        modified(doc){

        }
    })
    return unsubscribe
}

export async function requestFriend(userId){
    await setFireDoc('profile', getUserId(), { friends: { [userId]: true }})
    await addFireDoc('chat', { type: 'chat', members: { [userId]: true } } )
}

export async function acceptFriend(userId){
    const docs = await setFireDoc('profile', getUserId(), { friends: { [userId]: true }})
    docs.forEach(item=>{
        usersStore.frineds = {
            ...usersStore.frineds,
            [item.id]: item,
        }
    })
}

export async function rejectFriend(userId){
    const docs = await getFireDocs('profile', [['frinends.' + userId, '==', true]], 100, false)
    docs.forEach(item=>{
        usersStore.frineds = {
            ...usersStore.frineds,
            [item.id]: item,
        }
    })
}

export async function loadFriends(userId){
    const docs = await getFireDocs('profile', [['frinends.' + userId, '==', true]], 100, false)
    docs.forEach(item=>{
        usersStore.frineds = {
            ...usersStore.frineds,
            [item.id]: item,
        }
    })

}

export async function loadProfilesByIds(ids){
    if(Array.isArray(ids)) {
        const docs = await getFireDocsByIds('profile', ids)
        docs.forEach(doc=>{
            usersStore.profiles[doc.id] = doc
        })
    } else {
        const docs = await getFireDocById('profile', ids)
        usersStore.profiles[doc.id] = doc
    }
}

export async function loadUsers(value){
    const docs = await getFireDocs('profile', [['email', '==', value]], 100, false)
    docs.forEach(item=>{
        usersStore.profiles = {
            ...usersStore.profiles,
            [item.id]: item,
        }
    })
}
