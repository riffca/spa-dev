export function getUUID(){
    return crypto.getRandomValues(new Uint32Array(4)).join('');
}

export function checkParent(element, currentName, attributeName){
    if(!element.parentElement) return
    const parentName = element.parentElement.getAttribute(`data-component`)
    if(parentName) return parentName === currentName
    return checkParent(element.parentElement,currentName)
}
export function checkParentHasAttribute(element, attributeName){
    if(element.hasAttribute(attributeName)) return true
    if(!element.parentElement) return false
    const hasAttribute = element.parentElement.hasAttribute(attributeName)
    if(hasAttribute) return true
    return checkParentHasAttribute(element.parentElement,attributeName)
}

// let observer = new MutationObserver(mutationRecords => {
//  for (const mutation of mutationRecords) {
//      if (mutation.type === "childList") {
//          for(let index = 0; index < mutation.addedNodes.length; index++) {
//              const node = mutation.addedNodes[index]
//              if(node.name !== '#text' && node.getAttribute) {
    
//              }   
//          }
//      }
//  }
// });

// observer.observe(document.body, {
//      childList: true, 
//      subtree: true, 
// });