import { createStore } from '../store.js'
import { register, getFireDocById, getUserId } from '../firestore/lib.js'

import { watchAuth } from '../firestore/lib.js'

let authStore

export function init(){

    authStore = createStore('auth')
    authStore.profile  = {}

    watchAuth((value)=>{
        authStore.profile.email = value.email
        getUserId() && loadProfile(getUserId())
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