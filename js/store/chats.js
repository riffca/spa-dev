import { createStore } from '../store.js'
import { usersStore, loadProfilesByIds } from './users.js'
import { addFireDoc, getUser, getFireSnapshot, getUserId } from '../firestore/lib.js'

const collectionName = 'chats'
const messagesCollectionName = 'messages'

export const chatsStore = createStore(collectionName)

export function init(){
    chatsStore.userChats = []
    chatsStore.messagesByChat = {}
    chatsStore.currentChat = {}
}

export function setCurrentChat(val){
    chatsStore.currentChat = val
}

export function sendMessage({
        to,
        chat,
        text,
        type='user', // room, group, entity
    }){

    const members = buildMembers(to)

    addFireDoc(messagesCollectionName, {
        chat,
        text,
        members,
        type,
    })
}

function buildMembers(users){
    if(!users) return
    const members = {
        [getUserId()]: true 
    }

    if(Array.isArray(users)) {
        users.forEach(user=>{
            members[user] = true
        })
    } else {
        members[users] = true
    }

    return members
}


export async function requestChat(users){
    if(!users) return
    const members = buildMembers(users)
    await addFireDoc(collectionName, { members } )
}

function setUserChats(doc){
    const index = chatsStore.userChats.findIndex(item=>item.id === doc.id)
    if(index !== -1) {
        chatsStore.userChats[index] = doc
        chatsStore.userChats = [...chatsStore.userChats]
    } else {
        const chats = chatsStore.userChats
        chatsStore.userChats = [...chatsStore.userChats, doc]
    }
}

export function setupUserChatsSnapshot(func){
    if(!getUserId()) return

    const unsubscribe = getFireSnapshot(collectionName,[['members.' + getUserId(), '==', true]],{
        add(doc){
            setUserChats(doc)
            const members = Object.keys(doc.members).filter(item=>item !== getUserId())
            loadProfilesByIds(members)
        },
        modified(doc){
            setUserChats(doc)
        }
    })
    return unsubscribe
}

const chatsListeners = {}

export function setupChatSnapshot(chatId){
    if(!chatsStore.messagesByChat[chatId]) {
        if(chatsListeners[chatId]) return
        chatsStore.messagesByChat[chatId] = []
        chatsListeners[chatId] = getFireSnapshot('messages',  [['chat', '==', chatId]], { 
            add: (data)=> {
                chatsStore.messagesByChat[chatId].push(buildName(data))
            } 
        })
    } 
}


