import { bindElement, 
addEventListener, 
initCustomElement, 
bindCustomComponent, 
definedComponentsProxies, 
definedCustomComponents, 
definedHandlers,
watchers } from './interface.js'
import { getUUID, checkParentHasAttribute, createList } from './utils.js'

import { getStore } from './store.js'

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
	},
	bindStore(componentId, proxy, name, object){
		const store = getStore(name)
		console.log(store)
		if(!store) return
		Object.keys(object).forEach(key=>{
			store.setHandler(componentId, proxy, object[key], key )
		})

		store.reactValues()

		return store
	},
	watch(componentId, prop, func, immediate=false){
		if(!watchers[componentId][prop]) {
			watchers[componentId][prop]=[]
		}
		watchers[componentId][prop].push(func)


		if(!immediate) return
		let { proxy } = this.getRoots(componentId)
		if(proxy[prop]) {
			proxy[prop] = proxy[prop]
			console.log(444,prop, proxy[prop])
		}
		///func(proxy[prop])
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

String.prototype.splice = function(idx, rem, str) {
    return this.slice(0, idx) + str + this.slice(idx + Math.abs(rem));
};

