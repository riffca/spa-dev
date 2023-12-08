import './spa.js' 

import { runApp } from './dom.js'

runApp()




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