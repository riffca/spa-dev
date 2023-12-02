import { initDomApp, initComponents, initComponent} from './dom.js'
import { bindElement, addEventListener } from './interface.js'
import { getUUID } from './utils.js'

window.$spa = {
	initDomApp,
	initComponents,
	initComponent,
	bindElement,
	addEventListener,
	getUUID
}

export function initSpa(prop, value){
	window.$spa[prop] = value
}