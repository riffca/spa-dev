export function getUUID(){
    return crypto.getRandomValues(new Uint32Array(4)).join('');
}

export function getInner(node){
    return [...node.querySelectorAll('[data-component]')]
}

export function hasDataAttrs(node) {
    return [].filter.call(node.attributes, at => /^data-/.test(at.name)).length;
}

export function checkParent(element, currentName){
    if(!element.parentElement) return
    const parentName = element.parentElement.tagName.toLowerCase()
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

export const checkIsValidJson = (str) => {
  let parsedJson;
  try {
    parsedJson = JSON.parse(str);
    /** parsed JSON will not be undefined if it is parsed successfully because undefined is not a valid JSON */
    return parsedJson;
  } catch (e) {
    /** returning undefined because null, boolean, string, array or object is a valid JSON whereas undefined is invalid JSON  */
    return str;
  }
};

export function getDataAttr(element, attr='data-init') {
    return element.getAttribute(attr)
}


export function createList({ list, isUl=false, cb }) {
    const append = []
    list.forEach(item=>{
        const div = document.createElement('div')
        if(cb) {
            cb(div)
        } else {
            div.textContent = item
        }
        append.push(div)
    })
    const div = document.createElement('div')
    div.replaceChildren(...list)
    return div
}


export function insertSlot(elTarget){
    const slots = elTarget.querySelectorAll('[data-slot]');
    const name = elTarget.tagName.toLowerCase()
    let slotTarget = null;
    [...slots].forEach(item=>{
        if(checkParent(item, name)){
            slotTarget = item
        }
    })

    if(!slotTarget) return
    if(slotTarget.children.length) return

    const slotContent = slotGet(elTarget)
    if(!slotContent) return

    if(slotContent.length) {
        [...slotContent].forEach((item)=>{
            slotContent && slotTarget.replaceChildren(item.cloneNode(true))
        })
    } else {
        slotContent && slotTarget.replaceChildren(slotContent.cloneNode(true))
    } 
}

