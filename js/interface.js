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
	return document.querySelector(`[data-init=${CSS.escape(id)}]`)
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

				if (definedSlots[componentId]) {
					const slot = html.querySelector('[data-slot]')
					if (slot) {
						slot.replaceChildren(...definedSlots[this.componentId].cloneNode(true).children)
					}

				}
				this.replaceChildren(html);

			}

			listen(attrName, value) {
				change && change(this, attrName, value)
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
			}
		},
	);

	const element = getTargetComponent(componentId)
	return element

}

export function bindCustomComponent(selector, extend, options) {
	return bindProxy(selector, extend, options, false)
}

export function bindProxy(selector, extend, options, hasDataPrefix = true) {
	const {
		init,
		update
	} = options ? options : {}

	const app = {
		lib: {
			target: typeof selector === 'string' ? document.querySelector(selector) : selector,
			setAttribute(attr, val) {
				const prefix = hasDataPrefix ? 'data-' : ''
				this.target.setAttribute(prefix + attr, val)
			}
		},
		...extend
	}

	if (extend.click) {
		addEventListener(app.lib.target, 'click', extend.click)
	}

	init && init()

	const wrap = new Proxy(app, {
		get(target, prop, receiver) {
			const value = target[prop];
			if (value instanceof Function) {
				return function(...args) {
					return value.apply(this === receiver ? target : this, args);
				};
			}
			return value;
			// return Reflect.get(target, key).bind(target);
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

	return wrap
}