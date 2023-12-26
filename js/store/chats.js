import { createStore } from '../store.js'
import { addFireDoc, getUser, getFireSnapshot } from '../firestore/lib.js'

const collectionName = 'chats'
const store = createStore(collectionName)


export function init(){
    const currentUser = getUser()
    store.chats = 'well'
    store.sendMessage = sendMessage
    store.setupSnapshot = setupSnapshot
    store.userChats = []
}


function sendMessage({
    message= '',
    to= ''
}){
    const user = getUser()
    const userId = user.uid
    addFireDoc(collectionName, {
        message,
        chat: to
    })
}


function setupSnapshot(){
    const unsubscribe = getFireSnapshot(collectionName,[],{
        add(doc){

        }
    })
    return unsubscribe
}