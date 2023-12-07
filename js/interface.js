
import { initCustomComponents } from './dom.js'
import { checkIsValidJson, checkParent } from './utils.js'


const listeners = new Map()
const definedComponents = {}
const definedSlots = {}
const definedCopmonentsIds = {}


export function addEventListener(target, event, handler) {
	if (!target) return
	target.addEventListener(event, handler)
	listeners.set(handler, target)
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
			}
			setupHtml() {
				let template = document.getElementById("template-" + componentName);
				const html = template.cloneNode(true)
				html.setAttribute('id', '')
				html.hidden = false

				const slot = html.querySelector('[data-slot]')
				if (slot && this.slotTemplate) {
					const slotClone = this.slotTemplate.cloneNode(true)
					const children = slotClone.querySelectorAll('*');
					[...children].forEach(item=>{
						item.setAttribute('data-in-slot', this.componentId)
					})
					slot.replaceChildren(...slotClone.children)
				}

				const children = html.querySelectorAll('*');
				const self = this;

				[...children].forEach(item=>{
					html.setAttribute('data-parent', this.componentId)
					item.setAttribute('data-parent', this.componentId)
				})

				this.replaceChildren(html);

				attrs.forEach(attr=>{
					if(this.getAttribute(attr)) {
						change && change(this, attr, this.getAttribute(attr))
						updateTemplates(this, { [attr]: this.getAttribute(attr) })
						updateHidden(this, { [attr]: this.getAttribute(attr) })
					}
				})

				initCustomComponents(this)

			}

			listen(attrName, value) {
				change && change(this, attrName, checkIsValidJson(value))
			}

			connectedCallback() {
				// if (!this.rendered) {
				// 	this.rendered = true;

				// 	if(this.hasAttribute('data-init')) {
				// 		this.componentId = this.getAttribute('data-init')
				// 	}
				// }
			}

			static get observedAttributes() {
				return [...attrs, 'data-init'];
			}

			async attributeChangedCallback(name, oldValue, newValue) {
				if(name === 'data-init') {
					if(this.inited) return 
					this.componentId = this.getAttribute('data-init')
					if(this.children.length) {
						const slotTemplate = document.createElement('div')
						slotTemplate.replaceChildren(...this.children)
						this.slotTemplate = slotTemplate.cloneNode(true)	
					}
					this.setupHtml()
					this.inited = true
				}
				if(this.hasAttribute('data-init')) {
					this.listen(name, newValue)
					updateTemplates(this, { [name]: newValue })
					updateHidden(this, { [name]: newValue })
				}

			}
		},
	);

	const element = getTargetComponent(componentId)

	return element

}

export function bindCustomComponent(selector, extend, options) {
	return bindProxy(selector, extend, options, false)
}

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


	const wrap = new Proxy(app, {
		get(target, prop, receiver) {
			const value = target[prop];
			if (value instanceof Function) {
				return function(...args) {
					return value.apply(this === receiver ? target : this, args);
				};
			}

			return value;

			//return  Reflect.get(...arguments)
			//return Reflect.get(target, prop).bind(target);
		},
		set(target, prop, value) {
			target[prop] = value

			if (typeof value === 'object') {
				app.lib.setAttribute(prop, JSON.stringify(value))
			} else {
				app.lib.setAttribute(prop, value)
			}

			update && update(prop, value, app.lib.target)
			return true
			//return Reflect.set(target, prop, value, receiver)

		}
	});

	init && init(wrap)

	return wrap
}


function updateTemplates(target, object){
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
		  				currentNode.textContent = renderText.template(object)
		  			}
		  		})
		  	}
		  } else if (currentNode.nodeType == 3) {
		  	const value = currentNode.textContent.slice()
		  	if(value.match(/{(.*?)}/g)) {
		  		const parent = currentNode.parentElement
				if(target.getAttribute('data-init') === parent.getAttribute('data-parent')) {
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

function updateHidden(target, object) {
	const components = target.querySelectorAll('[data-show]');
	[...components].forEach(comp=>{
		const key = comp.getAttribute('data-show').toLowerCase()
		console.log(123,target.getAttribute(key))
		console.log(comp)
		console.log(object)
		if(target.hasAttribute(key)) {
			comp.hidden = target.getAttribute(key)
		}
	})
}