import './spa.js' 
import { createStore } from './store.js'
import { runApp } from './dom.js'


const authStore = createStore('auth')
    
    
async function createApp(){
    await runApp()

    authStore.profile = 'well'
    setTimeout(()=>{
        authStore.profile = 'pleasure'
        authStore.profile = 'pleasure'
        
    },3000)

    setTimeout(()=>{
        authStore.profile = 'riffca'
    },3000)
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