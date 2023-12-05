
import { initCustomComponents } from './dom.js'
import { checkIsValidJson, checkParent } from './utils.js'


const listeners = new Map()
const definedComponents = {}
const definedSlots = {}


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
				this.componentId = this.getAttribute('data-init')
			}

			setupHtml() {
				let template = document.getElementById("template-" + componentName);
				const html = template.cloneNode(true)
				html.setAttribute('id', '')
				html.hidden = false

				if (definedSlots[this.componentId]) {
					const slot = html.querySelector('[data-slot]')
					if (slot) {
						slot.replaceChildren(...definedSlots[this.componentId].cloneNode(true).children)
					}

				}
				this.replaceChildren(html);

				attrs.forEach(attr=>{
					if(this.getAttribute(attr)) {
						change(this, attr, this.getAttribute(attr))
						updateTemplates(this, { [attr]: this.getAttribute(attr) })
					}
				})



				initCustomComponents(this)

			}

			listen(attrName, value) {
				change && change(this, attrName, checkIsValidJson(value))
			}

			connectedCallback() {
				if (!this.rendered) {
					definedSlots[this.componentId] = this.cloneNode(true)

					this.setupHtml()
					this.rendered = true;
				}
			}

			static get observedAttributes() {
				return attrs;
			}

			attributeChangedCallback(name, oldValue, newValue) {
				this.listen(name, newValue)

				updateTemplates(this, { [name]: newValue })
			}
		},
	);

	const element = getTargetComponent(componentId)
	return element

}

export function bindCustomComponent(selector, extend, options) {
	return bindProxy(selector, extend, options, false)
}

export function bindProxy(selector, extend, options) {

	const { init } = extend

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
		const content = comp.textContent.slice()
		const tagName = target.tagName.toLowerCase()

		if(content.match(/{(.*?)}/g)) {
			if(!checkParent(comp, tagName)) {
				//if(target.tagName.toLowerCase() === 'app-button') {
				console.log(123,object.name)
					comp.textContent = content.template(object)
				//}
			}
			//comp.textContent = content.template({text:1})
		}
	})
}