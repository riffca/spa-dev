const definedComponents = {}

import { getTargetComponent } from './interface.js'


export function initCustomElement({
	name,
	componentId,
	attrs = [],
	classes,
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

			onRender(attrName, newValue = null){
				const getParams


				attrName && this.listen(attrName, newValue ? newValue : this.getAttribute(attrName))
				setupLists(this, attrName ? this.getJSON(attrName, newValue) : this.proxy)
				updateTemplates(this, attrName ? this.getJSON(attrName, newValue) : this.proxy)
				updateDatasetAttrs(this, attrName ? this.getJSON(attrName, newValue) : this.proxy)
				updateHidden(this, attrName ? this.getJSON(attrName, newValue) : this.proxy)
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

				}, { capture: true})

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

				$spa.watch(this.componentId, 'onUpdate', ()=>{
					this.onRender()
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