
import { initCustomComponents } from './dom.js'
import { checkIsValidJson, checkParent, kebabize } from './utils.js'


const listeners = new Map()
const definedComponents = {}
const definedSlots = {}
export const definedComponentsProxies = {}
export const definedCustomComponents = {}
export const definedHandlers = {}


export function addEventListener(target, event, handler) {
	if(listeners.get(target) === event) return
 
	if (!target) return


	target.addEventListener(event, handler)

	listeners.set(target, event)	
	// if(!listeners.get(target)) {
	// 	listeners.set(target, [])
	// }
	// listeners.set(target, [...listeners.get(target), handler])
	// console.log(9999, listeners)
}

export function bindElement(selector, extend, options) {
	const wrap = bindProxy(selector, extend, options)
	return wrap
}

function getTargetComponent(id) {
	return document.body.querySelector(`[data-init=${CSS.escape(id)}]`)
}

export function initCustomElement({
	name,
	change,
	componentId,
	attrs = [],
	classes,
	proxy,
	events
}) {
	const componentName = "app-" + name

	if (definedComponents[componentName]) {
		return getTargetComponent(componentId)
	}

	definedComponents[componentName] = true

	customElements.define(
		componentName,
		class extends HTMLElement {
			constructor() {
				super()
				this.listTemplates = {}
				this.events = {}
				this.classList.add(classes)
				if(componentName.includes('page')) {
					this.classList.add('h-full')
					this.classList.add('block') 
					this.classList.add('[&>div]:h-full')
				}
			}
			setupHtml() {
				//get component template
				let template = document.getElementById("template-" + componentName);
				const html = template.cloneNode(true)
				html.setAttribute('id', '')
				html.hidden = false

				//update slots
				const slot = html.querySelector('[data-slot]')

				if (slot && this.slotTemplate) {
					const slotClone = this.slotTemplate.cloneNode(true)
					const children = slotClone.querySelectorAll('*');
					[...children].forEach(item=>{
						item.setAttribute('data-in-slot', this.componentId)
					})


					slot.replaceChildren(...slotClone.childNodes)
				}

				//add parent ids
				const children = html.querySelectorAll('*');
				[...children].forEach(item=>{
					html.setAttribute('data-parent', this.componentId)
					!item.hasAttribute('data-parent') && item.setAttribute('data-parent', this.componentId)
				})

				//insert defined html
				this.replaceChildren(html);

				//update temlate with defined attributes
				attrs.forEach(attr=>{
					if(this.getAttribute(attr)) {
						this.listen(attr, this.getAttribute(attr))
						setupLists(this, this.getJSON(attr))
						updateDatasetAttrs(this, this.getJSON(attr))
						updateTemplates(this, this.getJSON(attr))
						updateHidden(this, this.getJSON(attr))
					}
				})

				//find embed uninited components
				initCustomComponents(this)

			}

			listen(attrName, value) {
				change && change(this, attrName, checkIsValidJson(value))
			}

			getJSON(key, value=null){
				return getJSON(key, value, this)
			}

			connectedCallback() {
			}

			static get observedAttributes() {
				return [...attrs, 'data-init'];
			}

			async attributeChangedCallback(name, oldValue, newValue) {
				if(name === 'data-init') {
					if(this.inited) return 
					this.inited = true

					this.onInit()
				}


				if(this.hasAttribute('data-init')) {
					this.listen(name, newValue)
					setupLists(this, this.getJSON(name, newValue))
					updateTemplates(this, this.getJSON(name, newValue))
					updateDatasetAttrs(this, this.getJSON(name, newValue))
					updateHidden(this, this.getJSON(name, newValue))
				}

			}

			clickHandler(event, root=null){
				runHandler(this.componentId, event, root)
			}

			onInit(){
				this.componentId = this.getAttribute('data-init')
				this.initEnvents()
				this.initSlots()
				this.setupHtml()
				this.initLists()
				this.initProxy()
				definedCustomComponents[this.componentId] = this

				setTimeout(()=>{
					if(definedHandlers[this.componentId] || this.dataset.click) {
						addEventListener(this, 'click', ()=>{
							if(this.dataset.click) {
								this.clickHandler(event, this)
							} else  {
								this.clickHandler(event)
							}
						})
						this.initInputEvents()
					}
				})

			}

			initSlots(){
				if(this.childNodes.length) {
					const slotTemplate = document.createElement('div')
					slotTemplate.replaceChildren(...this.childNodes)
					//slotTemplate.setAttribute('data-parent', this.dataset.init)
					this.slotTemplate = slotTemplate.cloneNode(true)
				}
			}

			initLists(){
				const components = this.querySelectorAll('[data-list]');
				[...components].forEach(comp=>{
					const key = comp.dataset.list
					this.listTemplates[key] = comp.cloneNode(true)
				})

			}
			initProxy(){
				this.proxy = bindProxy(this, {})
				definedComponentsProxies[this.componentId] = this.proxy

				initDataModel(this, this.proxy)
			}

			initEnvents(){
				events && events.forEach(event=>{
					this.events[event] = new CustomEvent(event, {
					  bubbles: true,
					  cancelable: false,
					  composed: true
					});	
				})
			}

			// createEvent(name, data) {
			// 	return new CustomEvent(event, {
			// 		  bubbles: true,
			// 		  cancelable: false,
			// 		  composed: true,
			// 		  detail: data
			// 	});	
			// }

			emit(event, value){
				if(this.events[event]){
					this.events[event].value = value
					this.dispatchEvent(this.events[event])
				}
			}

			initInputEvents(){
				interateBySelector(this, '[data-on-input]', (element)=>{
					const handler =	definedHandlers[this.dataset.init]?.[element.dataset.onInput]
					if(!handler) return
					addEventListener(element, 'input',(event)=>{
						event.stopPropagation()
						handler(event)
					})
				})
			}
		},
	);

	const element = getTargetComponent(componentId)

	return element

}

export function bindCustomComponent(selector, extend, options) {
	return bindProxy(selector, extend, options)
}


export const watchers = {}

export function bindProxy(selector, extender, options) {
	if(typeof extender === 'function') {
		var { init, ...extend } = extender(extender)
	} else {
		var { init, ...extend }= extender
	}


	const currentElement = typeof selector === 'string' ? document.querySelector(selector) : selector
	const {
		update,
		} = options ? options : {}

	const app = {
		lib: {
			target: currentElement,
			setAttribute(attr, val) {
				this.target.setAttribute(attr, val)
			}
		},
		...extend
	}

	if(!app.lib.target) return

	if (extend.click) {
		addEventListener(app.lib.target, 'click', extend.click)
	}

	watchers[currentElement.dataset.init] = {}

	const  updateBindAttributes = (value, attribute)=>{
		if (typeof value === 'object') {
			currentElement.setAttribute(attribute, JSON.stringify(value))
		} else {
			currentElement.setAttribute(attribute, value)
		}
	}

	const getRootParent = (proxy, value, key)=> {
		if(!proxy.parent) return { parent: proxy, value, key }
		const prop = proxy.parentProp

		const nextValue = { [prop]: value }
		return getRootParent(proxy.parent, nextValue, prop)
	}	

	const handler = {
		get(target, prop, receiver) {
			const value = target[prop];

			if(Array.isArray(target)) return target[prop]

			if (value instanceof Function) {
				return function(...args) {
					return value.apply(this === receiver ? target : this, args);
				};
			}

			if(value !== null && typeof value === 'object' || Array.isArray(value)) {
				return new Proxy(target[prop], { ...handler, parent: this, parentProp: prop })
			}

			return value;

			//return  Reflect.get(...arguments)
			//return Reflect.get(target, prop).bind(target);
		},
		set(target, prop, value) {
			target[prop] = value

			if(this.parent) {
				const { parent, value, key } = getRootParent(this, target, prop)
				parent.watch(key, value[key])
				const attrCase = kebabize(key)
				updateBindAttributes(value[key], attrCase)
				update && update(prop, value[key], currentElement)
				return true
			} 
				
			this.watch(prop, value)
			const attrCase = kebabize(prop)
			updateBindAttributes(value, attrCase)
			update && update(prop, value, app.lib.target)
			return true
			//return Reflect.set(target, prop, value, receiver)

		},
		watch(prop, value){
			const action = watchers[currentElement.dataset.init][prop]
			if(Array.isArray(action)) {
				action.forEach(fn=>{
					fn(value)
				})
			} 
		},
	}

	const wrap = new Proxy(app, handler)

	init && init(wrap)

	return wrap
}


function updateTemplates(target, object){
	Object.keys(object).forEach(key=>{
		if(['null', 'undefined'].includes(object[key])){
			object[key] = ''
		}
	})
	const components = target.querySelectorAll('*');
	[...components].forEach(comp=>{
		const textContent = comp.textContent.slice()
		const childNodes = comp.childNodes;
		for (let i = 0; i < childNodes.length; i++) {
		const currentNode = childNodes[i]
		  if (currentNode.nodeType == 1) {
		  	if(target.getAttribute('data-init') !== currentNode.getAttribute('data-parent')) return
		  	const renderText = currentNode.getAttribute('data-render')
		  	if(renderText) {
		  		Object.keys(object).forEach(key=>{
		  			if(renderText.includes(key)) {
		  				if(object[key] === undefined) return
		  				if(object[key] === null) return
		  				currentNode.textContent = renderText.template(object)
		  			}
		  		})
		  	}
		  } else if (currentNode.nodeType == 3) {
		  	const value = currentNode.textContent.slice()
		  	if(value.match(/{(.*?)}/g)) {
		  		if(Object.values(object).some(value=>Array.isArray(value))) return
		  		const parent = currentNode.parentElement
				if(!target.hasAttribute('data-init') || target.getAttribute('data-init') === parent.getAttribute('data-parent')) {
		  			if(!parent.hasAttribute('data-render')) {
		  				parent.setAttribute('data-render', parent.textContent.slice())
		  			}
		  			parent.textContent = value.template(object)
	
				}	
		  	}
		  }
		}	
	})
}

function setupLists(target, object) {
	const components = target.querySelectorAll('[data-list]');
	[...components].forEach(comp=>{
		const listKey = comp.dataset.list
		if(!object[listKey]) return
		Object.keys(object).forEach(key=>{
			if(key === listKey) {
				const list = object[key]
				const tempWrap = []
				list.forEach(item=>{
					const template = target.listTemplates[listKey].cloneNode(true)
					updateTemplates(template, item);
					[...template.children].forEach(child=>{
						updateAttrsTemplates(child, item)
					})

					tempWrap.push(template)
				})
				comp.replaceChildren(...tempWrap)
			}
		})
	})
}

function updateHidden(target, object) {
	const components = target.querySelectorAll('[data-show]');
	[...components].forEach(comp=>{
		const path = comp.dataset.show
		const key = path.split('.')[0]
		//if(!Object.hasOwn(object, key)) return
		const kebabCase = kebabize(key)

		const run = cond=> {
			if(cond) {
		 		comp.classList.remove('hidden')
		 	} else {
		 		comp.classList.add('hidden')
		 	}
		}
		
		if(target.proxy[key] && path.includes('.')) {
			const shown =  Boolean(getInnerProp(target.proxy,path))
			run(shown)
			return
		}

		if(typeof target.proxy[key] === 'function') {
			run(Boolean(target.proxy[key]()))
		 	return
		}

		run(Boolean(object[key]))
	})
}

function updateDatasetAttrs(component, object) {
	interateBySelector(component, '[data-class], [data-src], [data-value]', (element)=>{
		updateAttrsTemplates(element, object) 
	})
	// interateBySelector(component, '[data-src]', (element)=>{
	// 	updateAttrsTemplates(element, object) 
	// })
	// interateBySelector(component, '[data-value]', (element)=>{
	// 	updateAttrsTemplates(element, { value: object.model}) 
	// })
}

function loopKeys(){
	Object.keys(object).forEach(key=>{ 
		cb(key, object[key])
	})
}

function setValue(proxy, prop, value){
	if(Array.isArray(proxy[prop])) {
		proxy[prop] = [...proxy[prop], value]
		return
	}

	const inner = prop.split('.')

	if(inner.length > 1) {
		proxy[inner[0]][inner[1]] = value
		const newObject = { ...proxy[inner[0]] }
		proxy[inner[0]] = { ...proxy[inner[0]] }
		return
	}

	proxy[prop] = value
}

function getValue(proxy, prop){
	const inner = prop.split('.')
	if(inner.length > 1) {
		return proxy[inner[0]][inner[1]]
	}
	return proxy[prop]
}


function setInnerProp(target, prop, value){
	let result
	const keys = prop.split('.')
	keys.forEach((item,index)=>{
		if(!result) {
			result = target[item]
			return
		} 
		if(index < keys.length - 1) {
			result = result[item]
		}
	})
	result[keys.at(-1)] = value
}

function getInnerProp(target, prop){
	let result
	const keys = prop.split('.')
	keys.forEach((item,index)=>{
		if(!result) {
			result = target[item]
			return
		} 
		result = result[item]
	})
	return result
}

function hasInnerProp(target, prop){
	let result
	const keys = prop.split('.')
	keys.forEach((item,index)=>{
		if(!result) {
			result = target[item]
			return
		} 
		if(index < keys.length - 1) {
			result = result[item]
		}
	})
	if(!result) return false
	return Object.hasOwn(result, keys.at(-1))
}



function initDataModel(component, proxy){
	interateBySelector(component, '[data-model], [data-value]', (element)=>{
		const prop = element.dataset.model || element.dataset.value

		const handler = (event)=>{
			//event.stopPropagation() double emit iinput in dom so not working

			const value = event.value || event.target.value

			if(prop.includes('.')){
				setInnerProp(proxy, prop, value)
				return
			} 

			proxy[prop] = value
			//setValue(proxy, prop, event.value || event.target.value)
		}

		addEventListener(element, 'input', handler)

		const propWatched = prop.split('.')[0]
		$spa.watch(component.dataset.init, propWatched, (value)=>{
			//element.value = getValue(proxy, prop)
			element.setAttribute('value',getValue(proxy, prop)) 
		})

		// if(element.tagName.includes('APP')) {
		// 	element.setAttribute('value', 123)
		// }
	})
}

function updateAttrsTemplates(component, object) {
	Object.keys(object).forEach(prop=>{
		if(component.dataset) {
			const dataset = {...component.dataset }
			Object.keys(dataset).forEach(key=>{ 
				if(dataset[key].split('.')[0] === prop) {
					component.setAttribute(key, `{${dataset[key]}}`.template(object))
				}
			})
		}
	})
}

function interateBySelector(component, selector, cb){
	const components = component.querySelectorAll(selector);
	[...components].forEach(item=>{
		cb(item)
	})
}

function runHandlers(target) {
	const components = target.querySelectorAll('*');
	const componentId = target.dataset.init;
	[...components].forEach(component=>{
		if(component.dataset.click) {
			definedHandlers[componentId][component.dataset.click]()
		}
	})
}

function runHandler(componentId, event, root=null) {
	let component = event.target

	if(root) {
		componentId = root.parentElement.dataset.parent || root.parentElement.dataset.init
		component = root
	}

	if(component.dataset.click) {
		definedHandlers[componentId][component.dataset.click](event)
	}
}


const makeCamelCase = str => str.split('-').map((e,i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('')
function getJSON(key, value=null, target){
	const camelCase = makeCamelCase(key)
	return {
		[makeCamelCase(key)]: value ? checkIsValidJson(value) : checkIsValidJson(target.getAttribute(key))
	}
}