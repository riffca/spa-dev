import './spa.js' 
import { createStore } from './store.js'
import { runApp } from './dom.js'

import './firestore/lib.js'


function initAuthStore(){

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
    
async function createApp(){
    initAuthStore()
    runApp()
}

createApp()



// import { initCustomComponents } from './dom.js'

// let observer = new MutationObserver(mutationRecords => {
//  for (const mutation of mutationRecords) {
//      if (mutation.type === "childList") {
//      	//console.log(222, mutation.target)
//          for(let index = 0; index < mutation.addedNodes.length; index++) {
//              const node = mutation.addedNodes[index]
//              if(node.name !== '#text') {
//     			//initCustomComponents(node)
//              }   
//          }
//      }
//  }
// });

// observer.observe(document.body, {
//      childList: true, 
//      subtree: true, 
// });