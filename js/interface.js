
import { initCustomComponents } from './dom.js'
import { checkIsValidJson, checkParent, kebabize } from './utils.js'


const listeners = new Map()
const listenersByHandlers = new Map()
const definedComponents = {}
const definedSlots = {}
export const definedComponentsProxies = {}
export const definedCustomComponents = {}
export const definedHandlers = {}


export function addEventListener(target, event, handler, options) {
	if(listenersByHandlers.get(handler)) return
	if(listeners.get(target) === event) return
 
	if (!target) return


	target.addEventListener(event, handler, options)

	listeners.set(target, event)
	listenersByHandlers.set(handler, target)

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
			async setupHtml() {
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
						this.onRender(attr)
					}
				})

				//find embed uninited components
				await initCustomComponents(this)

				this.proxy.mountedComponent = true
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
					this.onRender(name, newValue)
				}

			}

			clickHandler(event, root=null){
				runHandler(this.componentId, event, root)
			}

			onRender(...args){
				//setTimeout(()=>{
					this.onRenderBasic(...args)
				//})
			}


			onRenderBasic(attrName, newValue = null, oldValue=null){
				const getParams = ()=> attrName ? this.getJSON(attrName, newValue) : this.proxy

				attrName && this.listen(attrName, newValue ? newValue : this.getAttribute(attrName))

				setupLists(this, getParams())
				//updateTemplates({ target: this, object: getParams()})
				updateDatasetAttrs(this, getParams())
				updateHidden(this, getParams())
			}
			onInit(){
				this.componentId = this.getAttribute('data-init')
				this.initEnvents()
				this.initSlots()
				this.setupHtml()
				this.initLists()
				this.initProxy()
				setRenderAttributes(this)

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
				}, { capture: false } )

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

				$spa.watch(this.componentId, 'onUpdate', (propName, val, proxy, oldValue)=>{
					setPropHolder(this, propName, proxy)
					//this.onRender(val, oldValue)
				},true)
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

			setAttr(name, value) {
				this.setAttribute(name, checkIsValidJson(value))
			}

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

	const updateBindAttributes = (value, attribute)=>{
		if(typeof value === 'function') return

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
			//const old = JSON.parse(JSON.stringify(target))
			target[prop] = value

			const updateObject = {}

			Object.keys(this).forEach(key=>{
				if(typeof this[key] === 'function'){
					updateObject[key] = this[key]
				} 
			})

			updateObject[prop] = value

			setTimeout(this.onUpdate(prop, updateObject))


			// if (value instanceof Function) {
			// 	return true
			// }

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

		onUpdate(propName, proxy, oldValue){
			const value = proxy[propName]
			const updateWatcher = watchers[currentElement.dataset.init]['onUpdate']
			if(updateWatcher) {
				const actions = updateWatcher
				if(Array.isArray(actions)) {
					actions.forEach(fn=>{
						fn(propName, value, proxy)
					})
				} 		
			}
		}
	}

	const wrap = new Proxy(app, handler)

	init && init(wrap)

	return wrap
}

export function getTemplateValue(text, object, index=null, proxy=null, targetNode){


	if(!text.template) return
	let insertText = text.template(object, index)
	if(!insertText) {
		insertText = text.template(proxy, index)
	}
	return insertText
}


export function setPropHolder(node, prop, object){
	const listIndex = node.dataset.listIndex
	//console.log(listIndex, prop)
	//prop = prop.split('.')[0]
	//const nodes = node.querySelectorAll(CSS.escape(`[data-render={${prop}}]`));
	const nodes = node.querySelectorAll(`[data-render]`);
	[...nodes].forEach(element => {
		//if(checkHasParentList(element)) return
		if(!element.dataset.render.toLowerCase().includes(prop.toLowerCase())) return
		const renderProp = element.dataset.render
		console.log(renderProp, object);
		element.textContent = getTemplateValue(renderProp, object, parseInt(listIndex))
	})
}


export function setPropListHolder({ virtualKey, node, listKey, object, index, listName }){
	const listIndex = node.dataset.listIndex
	const nodes = node.querySelectorAll(CSS.escape(`[data-render={${listKey}}]`));

	const textProp = listKey.replaceAll('}','').replaceAll('{','');
	console.log(123,CSS.escape(`[data-render={${textProp}}]`))
	console.log(nodes);
	//const nodes = node.querySelectorAll(`[data-render]`);
	//console.log(nodes, listIndex, prop);

	[...nodes].forEach(element => {
		const renderProp = element.dataset.render

		if(!renderProp) return
		const textProp = renderProp.replaceAll('}','').replaceAll('{','');

		if(textProp.includes(listName)) {
			const value = object[listKey][index]
			console.log( 2222, renderProp, { [listName]: value } )
			console.log(value)

			const passObject = { [listName]: value }
			const newText = getTemplateValue(renderProp, passObject)

			console.log(444,object)
			console.log(newText)
			element.textContent = newText
			console.log(111)
			return
		}

		if(!object[textProp]) {
			return
		}

		if(typeof object[textProp] === 'function') {
			element.textContent = getTemplateValue(renderProp, object, parseInt(listIndex))
		}

	})
}

export function renderNodes(
	components, action, elements=true
){
	[...components].forEach(comp=>{
		const textContent = comp.textContent.slice()
		const childNodes = comp.childNodes;
		for (let i = 0; i < childNodes.length; i++) {
			const currentNode = childNodes[i]
			action(currentNode)
		}
	})
}

export function setRenderAttributes(target){
	const elems = target.querySelectorAll('*')
	renderNodes(elems, (currentNode)=>{
		if (currentNode.nodeType == 3) {
		  	const value = currentNode.textContent.slice()
		  	if(value.match(/{(.*?)}/g)) {
		  		const parent = currentNode.parentElement
				if(!target.hasAttribute('data-init') || target.getAttribute('data-init') === parent.getAttribute('data-parent')) {
		  			if(!parent.hasAttribute('data-render')) {
		  				parent.setAttribute('data-render', parent.textContent.slice())
		  			}
				}	
		  	}
		  
		}	
	})
}



export function updateTemplates({
	target, object, index=null, proxy=null,
	list=false
}){
	proxy = target.proxy || proxy

	const currentIndex = typeof index === 'number' ? index : target.dataset.listindex 

	Object.keys(object).forEach(key=>{
		if(['null', 'undefined'].includes(object[key])){
			object[key] = ''
		}
	})

	const query = list ? '*' : ':not([data-list-index])'


	const components = target.querySelectorAll(query);
	const div = document.createElement('div')
	const items = div.querySelectorAll('[data-list-index]')
	div.replaceChildren(components);

	console.log(items);

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
		  				//currentNode.textContent = renderText.template(object, currentIndex)
		  				const newValue = getTemplateValue(renderText, object, currentIndex, proxy,currentNode)	
		  				const oldValue = currentNode.textContent
		  				if(newValue !== oldValue) {
		  					currentNode.textContent = newValue
		  				}
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
		  			//parent.textContent = value.template(object, currentIndex)
		  			//if(!value) return

		  			const newValue = getTemplateValue(value, object, currentIndex, proxy, parent)	
		  			const oldValue = parent.textContent
		  			if(newValue !== oldValue) {
		  				parent.textContent = newValue
		  			}
	
				}	
		  	}
		  }
		}	
	})
}


let prevObject = {}

export function getStructure(proxy, prevList){
	const elems = {}
	Object.keys(proxy).forEach(key=>{

	})
}


export function setupLists(target, object) {
	if(JSON.stringify(prevObject) === JSON.stringify(object)) return

	const components = target.querySelectorAll('[data-list]');
	[...components].forEach(comp=>{
		const listKey = comp.dataset.list
		if(!object[listKey]) return
		Object.keys(object).forEach(async key=>{
			const listUniqKey = comp.dataset.key

			if(key === listKey) {
				const list = object[key]
				const renderList = typeof list === 'function' ? list() : list
				//console.log(233,prevObject, object)
				prevObject = renderList
				if(!Array.isArray(renderList)) return
				const tempWrap = []
				renderList.forEach(async (item, index)=>{
					const template = target.listTemplates[listKey].cloneNode(true);
					template.setAttribute('data-list-index', index);

						const childNodes = template.querySelectorAll('*');
						[...childNodes].forEach((child)=>{
							child.setAttribute('data-list-index', index);

							updateAttrsTemplates(child, item, target.proxy)

							//updateTemplates({ target: child, object: item, index, proxy: target.proxy, list: true });

							if(child.dataset.click) {
								const handler = (event)=>{
									definedHandlers[target.dataset.init][child.dataset.click](event, item)
								}
								addEventListener(child, 'click', handler)
							}	
						});

					tempWrap.push(template)
				})

				tempWrap.length && await initCustomComponents(tempWrap[0]).then(()=>{
					tempWrap.forEach((item, index)=>{
						setRenderAttributes(item)
						const listName = comp.dataset.listName
						setPropListHolder({ virtualKey: key, node: item, listKey, object: target.proxy, index, listName })			
					})
				})

				comp.replaceChildren(...tempWrap)
			}
		})
	})
}

export function updateHidden(target, object) {
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

		if(!target.proxy) return

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

export function updateDatasetAttrs(component, object) {
	const attributes = ['class', 'src', 'href', 'value','label'].map(item=>`[data-${item}]`).join(',')
	interateBySelector(component, attributes, (element)=>{
		//element.dataset.class && element.dataset.class && console.log('index', element, element.dataset.listIndex)
		updateAttrsTemplates(element, object, component.proxy, element.dataset.listIndex) 
	})
}

export function loopKeys(){
	Object.keys(object).forEach(key=>{ 
		cb(key, object[key])
	})
}

export function setValue(proxy, prop, value){
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

export function getValue(proxy, prop){
	const inner = prop.split('.')
	if(inner.length > 1) {
		return proxy[inner[0]][inner[1]]
	}
	return proxy[prop]
}


export function setInnerProp(target, prop, value){
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

export function getInnerProp(target, prop){
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

export function hasInnerProp(target, prop){
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



export function initDataModel(component, proxy){
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

export function updateAttrsTemplates(component, object, proxy=null, index=null) {
	Object.keys(object).forEach(prop=>{
		if(component.dataset) {
			const dataset = {...component.dataset }
			Object.keys(dataset).forEach(key=>{ 
				if(dataset[key].split('.')[0] === prop) {
					component.setAttribute(key, `{${dataset[key]}}`.template(object, index))
				}
			})
		}
	})

	if(proxy) {
		const dataset = {...component.dataset }
		Object.keys(dataset).forEach(key=>{ 
			const attr = dataset[key].split('.')[0]
			if(proxy[attr]) {
				component.setAttribute(key, `{${dataset[key]}}`.template(proxy, index))
			}
		})
	}
}

export function interateBySelector(component, selector, cb){
	const components = component.querySelectorAll(selector);
	[...components].forEach(item=>{
		cb(item)
	})
}

// function runHandlers(target) {
// 	const components = target.querySelectorAll('*');
// 	const componentId = target.dataset.init;
// 	[...components].forEach(component=>{
// 		if(component.dataset.click) {
// 			definedHandlers[componentId][component.dataset.click]()
// 		}
// 	})
// }

export function checkHasParentList(component){
	if(!component.parentElement) return false
	if(component.parentElement.dataset.list) return true
	return checkHasParentList(component.parentElement)

}

export const getParentNodeWithClick = (node)=>{
	if(!node.parentElement) return false
	if(node.dataset.click && node.parentElement.dataset.parent === node.dataset.parent) return node
	return getParentNodeWithClick(node.parentElement)
}

export function runHandler(componentId, event, root=null) {
	let component = event.target

	if(checkHasParentList(component)) return

	// if(getParentNodeWithClick(component)) {
	// 	component = getParentNodeWithClick(component)
	// }

	if(root) {
		componentId = root.parentElement.dataset.parent || root.parentElement.dataset.init
		component = root
	}

	if(component.dataset.click) {
		definedHandlers[componentId][component.dataset.click](event)
	}
}


export const makeCamelCase = str => { 
	if(typeof str.split !== 'function') return ''
	return str.split('-').map((e,i) => i ? e.charAt(0).toUpperCase() + e.slice(1).toLowerCase() : e.toLowerCase()).join('')
}
export function getJSON(key, value=null, target){
	const camelCase = makeCamelCase(key)
	return {
		[makeCamelCase(key)]: value ? checkIsValidJson(value) : checkIsValidJson(target.getAttribute(key))
	}
}