import { bindElement, addEventListener, initCustomElement, bindCustomComponent } from './interface.js'
import { getUUID, checkParentHasAttribute, createList } from './utils.js'



window.$spa = {
	bindElement,
	addEventListener,
	getUUID,
	checkParentHasAttribute,
	initCustomElement,
	bindCustomComponent,
	getScriptSelector(id){
		let currentId = null 
		if(!id) {	
			currentId = document.currentScript.id 
		} else {
			currentId = id
		}
		return  `[data-init=${CSS.escape(currentId)}]`
	},
	getEscapedScriptId(id){
		let currentId = null 
		if(!id) {	
			currentId = document.currentScript.id 
		} else {
			currentId = id
		}
		return CSS.escape(currentId)
	}
}
