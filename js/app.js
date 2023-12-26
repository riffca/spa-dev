import './spa.js' 
import { watchAuth } from './firestore/lib.js'

import { runApp } from './dom.js'

async function loadStores() {
    for (const value  of [ 'auth', 'chats']) {
        const store = await import(`./store/${value}.js`)
        store.init()
    }
}

async function createApp(){
    await loadStores()

    watchAuth((value)=>{
        console.log('auth watch',value)
    })

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