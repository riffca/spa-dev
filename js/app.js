import './spa.js' 


String.prototype.template = function (d) {
    return this.replace(/\{([^\}]+)\}/g, function (m, n) {
        var o = d, p = n.split('|')[0].split('.');
        for (var i = 0; i < p.length; i++) {
            o = typeof o[p[i]] === "function" ? o[p[i]]() : o[p[i]];
            if (typeof o === "undefined" || o === null) return n.indexOf('|') !== -1 ? n.split('|')[1] : m;
        }
        return o;
    });
};

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