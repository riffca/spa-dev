import { createStore } from '../store.js'
import { register, setFireDoc } from '../firestore/lib.js'


export function init(){

    const authStore = createStore('auth')

    authStore.profile = 'well'
    authStore.creds = {
        admin: true,
        reporter: false,
    }


    setTimeout(()=>{
        authStore.profile = 'pleasure'
    },3000)

    setTimeout(()=>{
        authStore.profile = 'riffca'
        const creds = authStore.creds
        authStore.creds = { ...creds, admin: false }
    },3000)
}
export async function registerUser({email, password}){
    const result  = await register({
        email,
        password,
    })

    if(result.errors) return result.errors

    console.log(233, result)
    setFireDoc('profile', result.user.uid, { email })
}