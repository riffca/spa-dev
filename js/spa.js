import { initDomApp, initComponents, initComponent} from './dom.js'
import { bindElement, addEventListener } from './interface.js'

window.$spa = {
	initDomApp,
	initComponents,
	initComponent,
	bindElement,
	addEventListener
}

export function initSpa(prop, value){
	window.$spa[prop] = value
}