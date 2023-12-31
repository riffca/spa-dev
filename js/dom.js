
import { getUUID } from './utils.js'

const definedComponentsAttrs = {}
const fetchedComponents = {}
const fetchedPages = {}
const initedSlots = new Map()
const scriptsLoaded = new Set()

function getCustomComponents(target){
	const outer = target || document.body
	return outer.querySelectorAll(":not(p,div,span,a,h1,h2,script, header, input,label,button, img, amino-inspect)")
}

async function loopCustomComponents(cb,target=null){
	const components = getCustomComponents(target)
	for(const component of components) {
		if(component.tagName.includes('APP')) {
			await cb(component)
		}
	}
}

// async function loadCustomComponent(){
// 	const path = location.hash.slice(1)
// 	const { innerHtml, script } = await getComponent(path, 'pages')
// 	const component = document.querySelector('[data-view]')
// 	if(!innerHtml || !component) return
// 	await parsePage(innerHtml);

// 	await insertTemplates(innerHtml)
// 	if(script) {
// 		await loadjs(script.textContent, getDataAttr(innerHtml))
// 	}

// 	await setupComponents(innerHtml)

// }

async function initCustomComponents(target=null){
	loopCustomComponents(async (component)=>{
		const path = component.tagName.split('-').slice(1).join('-')
		const name = path.toLowerCase()
		const { innerHtml, script } = await getComponent(name)
		const componentId = getUUID()
		if(!getDataAttr(component)) {
			component.setAttribute('data-init', componentId)
		}

		innerHtml.setAttribute('id', 'template-app-' + name)
		innerHtml.hidden = true

		if(innerHtml) {
			document.body.appendChild(innerHtml)
		}

		if(script) { 
			script.setAttribute('id', componentId)
			loadjs(script.textContent, componentId)
		}

		insertSlot(component)
	}, target)
}

function loadjs(script, id) {
	//if(scriptsLoaded.has(script)) return
	scriptsLoaded.add(script)
  var js = document.createElement("script");
  js.setAttribute('id', id)
  js.textContent = `{${script}}`;

  document.head.appendChild(js);
}


function getInner(node){
	return [...node.querySelectorAll('[data-component]')]
}

function hasDataAttrs(node) {
	return [].filter.call(node.attributes, at => /^data-/.test(at.name)).length;
}

function checkParent(element, currentName){
	if(!element.parentElement) return
	const parentName = element.parentElement.getAttribute(`data-component`)
	if(parentName) return parentName === currentName
	return checkParent(element.parentElement,currentName)
}

const slotGet = (element)=>{
	return initedSlots.get(element.getAttribute('data-init'))
}

const slotSet = (element, value)=>{
	initedSlots.set(element.getAttribute('data-init'), value)
}
function collectSlot(elTarget){
	const clone = elTarget.cloneNode(true)
	const slotContent = clone.children

	if(slotContent.length) {
		if(slotGet(elTarget)) return
		slotSet(elTarget, slotContent)
	}
}

function insertSlot(elTarget){
	const slots = elTarget.querySelectorAll('[data-slot]');
	const name = elTarget.getAttribute('data-component')
	let slotTarget 
	[...slots].forEach(item=>{
		if(checkParent(item, elTarget.getAttribute('data-component'))){
			slotTarget = item
		}
	})

	if(!slotTarget) return
	if(slotTarget.children.length) return

	const slotContent = slotGet(elTarget)
	if(!slotContent) return

	if(slotContent.length) {
		[...slotContent].forEach((item)=>{
			slotContent && slotTarget.replaceChildren(item.cloneNode(true))
		})
	} else {
		slotContent && slotTarget.replaceChildren(slotContent.cloneNode(true))
	} 
}

const componentsTemplates = {}

async function loopDataComponents(callback, target){
	const wrapper = target ? target : document
	const empties = wrapper.querySelectorAll('[data-component]');
	for(const element of empties){
		await callback(element)
	}
}

export async function parsePage(target=null){
	await loopDataComponents(async element=>{
		element.setAttribute('data-init', getUUID())
		const name = element.getAttribute('data-component')

		collectSlot(element)

		if(componentsTemplates[name]) return
		const { innerHtml: component, script } = await getComponent(name)
		componentsTemplates[name] = {
			template: component,
			script
		}
		if(component.querySelectorAll('[data-component]').length){
			await parsePage(component)
		}
	}, target)
}

function getDataAttr(element, attr='data-init') {
	return element.getAttribute(attr)
}


export async function insertTemplates(target=null, parentName=null){
	await loopDataComponents(async element=>{
		const name = element.getAttribute('data-component')
		if(!componentsTemplates[name]) return

		if(parentName === name) return
		const { template, script } = componentsTemplates[name]

		const clone = template.cloneNode(true)

		element.replaceChildren(clone)

		if(template.querySelectorAll('[data-component]').length){
			await insertTemplates(clone, name)
		}
		if(script) { 
			loadjs(script.textContent, getDataAttr(element))
		}

	}, target)
}


export async function setupComponents() {
	await loopDataComponents(async element=>{
		const name = element.getAttribute('data-component')
		insertSlot(element)

		setupComponent({
			name, node: element
		})

	})
}

export async function runApp(components){
	await parsePage();
	await insertTemplates();

	initDomApp(components)
	await setupComponents();
	await initCustomComponents()

	window.addEventListener('hashchange',async ()=>{
		loadPage()
	})
}

async function loadPage(){
	const path = location.hash.slice(1)
	const { innerHtml, script } = await getComponent(path, 'pages')
	const component = document.querySelector('[data-view]')
	if(!innerHtml || !component) return
	await parsePage(innerHtml);
	component.replaceChildren(innerHtml)

	await insertTemplates(innerHtml)
	if(script) {
		await loadjs(script.textContent, getDataAttr(innerHtml))
	}

	await setupComponents(innerHtml)

	await initCustomComponents(innerHtml)
}	

export function initComponents(){
	return setupComponents()
}


export function initDomApp(components){
	if(components) {
		components.forEach(item=>{
			initComponent(item)
		})
	}
	initComponent({
		name: 'layout',
		attrs(key, value, target){
			if(key === 'data-layout') {
				target.classList.add(value)
			}
		},
	})
	initComponent({
		name: 'list',
		attrs(key, value, target){
			if(key === 'data-list') {
				const list = value.split(',')
				const children = []
				list.forEach(item=>{
					const li = document.createElement('li')
					li.textContent = item
					children.push(li)
				})

				const ul = document.createElement('ul')
				ul.replaceChildren(...children)
				target.replaceChildren(ul)
			}
		},
	})

	// initComponent({
	// 	name: 'button',
	// 	attrs(key, value, target){
	// 		if(key === 'data-text') {
	// 			const doc = target.querySelector('[data-text]')
	// 			if(doc) {
	// 				doc.textContent = value
	// 			} else {
	// 				target.textContent = value
	// 			}
	// 		}
	// 	},
	// })

	initComponent({
		name: 'images',
		attrs(key, value, target, wrapper){
			if(key === 'data-images') {
				const list = value.split(',')
				const children = []
				list.forEach(item=>{
					const img = document.createElement('img')
					img.setAttribute('src', item)
					children.push(img)
				})

				target.replaceChildren(...children)
			}
		}
	})

	//initComponents()
	loadPage()
}



const fetchedStyles = {}


function getTemplate(template, path){
	const componentDoc = template ? 
		new DOMParser().parseFromString(template, "text/html") : null

	const innerHtml = componentDoc ? 
		componentDoc.documentElement.querySelector('body > :first-child') :
		document.createElement('div') 

	const script = componentDoc ? componentDoc.documentElement.querySelector('script') : null
	const style = componentDoc ? componentDoc.documentElement.querySelector('style') : null

	loadStyle(style, path)

	return { innerHtml, script }
}

function loadStyle(style, path){

	if(fetchedStyles[path]) return	
	if(style) {
		const insertStyle = document.createElement('style')
		insertStyle.textContent = style.textContent
		document.head.appendChild(insertStyle)
		fetchedStyles[path] = true
	}
}


async function getComponent(componentName, folder='components'){
	let path = `../${folder}/${componentName}.html`
	let template = null

	if(fetchedComponents[path]) {
		template = fetchedComponents[path]
	}

	if(!template) {
		template = await fetch(path)
			.then(res=>res.text()).then((res)=>res)
		const noResponse = template.includes('Not Found');
		if(!noResponse && template) {
		 	fetchedComponents[path] = template
		} 

		if(noResponse) {
			template = null
		}

		fetchedComponents[path] = template

	}


	return getTemplate(template, path)
}




function setupComponent({
	name,
	attrs,
	node,
}){
	// if(node.getAttribute('data-init')) { 
	// 	return node
	// }
	//node.setAttribute('data-init', getUUID())
	if(!node) return

	const initAttributes = {}

	let initAttrs = [].filter.call(node.attributes, at => /^data-/.test(at.name));
	initAttrs.forEach(item=>{
		initAttributes[item.name] = {
			target: node,
			value: item.value
		}
	})


	if(!definedComponentsAttrs[name] && attrs) {
		definedComponentsAttrs[name] = attrs
	} 

	if(!attrs) {
		attrs = definedComponentsAttrs[name]
	}

	if(!attrs) return node

	Object.keys(initAttributes).forEach(key=>{
		const { value, target } = initAttributes[key]
		if(!target) return

		attrs(key, provideValue(value), target, node)
	})

	let observer = new MutationObserver(mutationRecords => {
	  	for (const mutation of mutationRecords) {
		    if (mutation.type === "attributes") {
		    	if(!mutation.attributeName.includes('data')) return 
		    	const value = mutation.target.attributes[mutation.attributeName].value
		    	attrs(mutation.attributeName, provideValue(value), mutation.target, node)
		      	//console.log(`The ${mutation.attributeName} attribute was modified.`);
		    }
		 }
	});

	observer.observe(node, {
		attributeOldValue: true,
	  	attributes: true
	});

	return node
}

const checkIsValidJson = (str) => {
  let parsedJson;
  try {
    parsedJson = JSON.parse(str);
    /** parsed JSON will not be undefined if it is parsed successfully because undefined is not a valid JSON */
    return parsedJson;
  } catch (e) {
    /** returning undefined because null, boolean, string, array or object is a valid JSON whereas undefined is invalid JSON  */
    return undefined;
  }
};

function provideValue(value){
	return checkIsValidJson(value) || value
}


export async function initComponent({
	name,
	attrs,
	node,
}, setup=false){

	if(attrs && !definedComponentsAttrs[name]) {
		definedComponentsAttrs[name] = attrs
	}

	if(setup) {
		setupComponent({
			name,
			attrs,
			node
		})
	}

}




