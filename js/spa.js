import { bindElement, addEventListener, initCustomElement, bindCustomComponent, definedComponentsProxies, definedCustomComponents, definedHandlers } from './interface.js'
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
	},
	getComponentProxy(id){
		return definedComponentsProxies[id]
	},
	getCustomElement(id){
		return definedCustomComponents[id]
	},
	getRoots(id, options){
		const element = this.getCustomElement(id)
		options?.click && this.addEventListener(element, 'click',(event)=>{
			options.click(event)
		})
		return {
			element,
			proxy: this.getComponentProxy(id)
		}
	},
	collectHandlers(id, handlers){
		if(!id) return
		if(!definedHandlers[id]) {
			definedHandlers[id] = {}
		}
		Object.keys(handlers).forEach(key=>{
			definedHandlers[id][key] = handlers[key]
		})
	}
}

String.prototype.template = function (d) {
    return this.replace(/\{([^\}]+)\}/g, function (m, n) {
        var o = d, p = n.split('|')[0].split('.');
        for (var i = 0; i < p.length; i++) {
            o = typeof o[p[i]] === "function" ? o[p[i]]() : o[p[i]];
            if (typeof o === "undefined" || o === null) return ''// n.indexOf('|') !== -1 ? n.split('|')[1] : m;
        }
        return o;
    });
};
