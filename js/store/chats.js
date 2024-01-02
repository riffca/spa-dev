import { createStore } from '../store.js'
import { usersStore, loadProfilesByIds } from './users.js'
import { addFireDoc, getUser, getFireSnapshot, getUserId, getFireDocs, useSnapshotListner  } from '../firestore/lib.js'

const collectionName = 'chats'
const messagesCollectionName = 'messages'


const { setSnapshotListnerSorted } = useSnapshotListner('snap-chats')

export const chatsStore = createStore(collectionName)

export function init(){
    chatsStore.userChats = []
    chatsStore.messagesByChat = {}
    chatsStore.currentChat = {}
    chatsStore.currentChatMessages = []
}


export function setCurrentChat(val){
    if(!val) return
    chatsStore.currentChat = val

    chatsStore.currentChat.messages = chatsStore.messagesByChat[val.id]
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

export async function loadChatMessages(chatId){
    const docs = await getFireDocs(messagesCollectionName, ['chat', '==', chatId])
    if(!chatsStore.messagesByChat[chatId]) {
        chatsStore.messagesByChat[chatId] = []
    }
    chatsStore.messagesByChat[chatId] = [...docs]
}





export async function loadChatMessagesSorted(chatId){

    function run(messages){
        chatsStore.messagesByChat[chatId].push(...messages)
        //chatsStore.setValue('currentChatMessages', messages)
        chatsStore.currentChatMessages = [...chatsStore.currentChatMessages, ...messages]
    }

    setSnapshotListnerSorted(messagesCollectionName, { 
        query: [
            ['chat', '==', chatId],
            //['created','>', new Date(Date.now() + 10000)],
        ],
        targetMapSetter: {
            add:(messages)=>run(messages),
            update:(messages)=>run(messages),
            delete:(messages)=>run(messages)
        },
        targetMap: chatsStore.messagesByChat,
        mapKey: chatId,
    })
}


