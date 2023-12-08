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
