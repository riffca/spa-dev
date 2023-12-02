export function getUUID(){
    return crypto.getRandomValues(new Uint32Array(4)).join('');
}

export function checkParent(element, currentName, attributeName){
    if(!element.parentElement) return
    const parentName = element.parentElement.getAttribute(`data-component`)
    if(parentName) return parentName === currentName
    return checkParent(element.parentElement,currentName)
}