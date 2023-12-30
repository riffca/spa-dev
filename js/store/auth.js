import { createStore } from '../store.js'
import { register, getFireDocById, getUserId } from '../firestore/lib.js'
import { loadFriends } from './users.js'
import { watchAuth } from '../firestore/lib.js'

export const authStore = createStore('auth')

export function init(){

    authStore.profile  = {}
    authStore.getUserId = ()=> getUserId()

    watchAuth((value)=>{
        authStore.profile = value
        getUserId() && loadProfile(getUserId()) && loadFriends(getUserId())
        console.log('auth watch', value)
    })
}

export async function loadProfile(id){
    const doc = await getFireDocById('profile',id)
    authStore.profile = doc
}

export async function registerUser({email, password}){
    const result  = await register({
        email,
        password,
    })

    if(result.errors) return result.errors

    // console.log(233, result)
    setFireDoc('profile', result.user.uid, { email })
}