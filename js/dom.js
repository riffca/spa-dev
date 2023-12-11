
import { getUUID, getDataAttr } from './utils.js'

const fetchedComponents = {}
const fetchedPages = {}
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


export async function initCustomComponents(target=null,folder="components"){
	await loopCustomComponents(async (component)=>{
		const path = component.tagName.split('-').slice(1).join('-')
		const name = path.toLowerCase()
		const { innerHtml, script } = await getComponent(name, folder)

		let componentId  = getUUID()

		if(getDataAttr(component)) return
		if(!getDataAttr(component)) {
			component.setAttribute('data-init', componentId)
		}

		componentId = component.getAttribute('data-init')

		const templateName = 'template-app-' + name
		const existingTemplate = document.body.querySelector(`#${templateName}`)

		if(!existingTemplate) {
			innerHtml.setAttribute('id', templateName)
			innerHtml.hidden = true

			const templates = document.getElementById('templates')
			templates.appendChild(innerHtml)
		}

		if(script) { 
			script.setAttribute('id', componentId)
			loadjs(script.textContent, componentId, name)
		}
	}, target)
}

function getScriptString(script, id, componentName){
  const handlerNames = []
  const template = document.getElementById('template-app-'+componentName)
  if(template) {
  	{
  		const comps = template.querySelectorAll('[data-click]');
		  [...comps].forEach(comp=>{
		  	handlerNames.push(comp.dataset.click)
		  })
  	}
  	{
  		const comps = template.querySelectorAll('[data-on-input]');
		  [...comps].forEach(comp=>{
		  	handlerNames.push(comp.dataset.onInput)
		  })		
  	}
  }

  const handlersString = handlerNames.length ? `
  	$spa.collectHandlers($componentId, {
		${handlerNames.join(',')}
	})
  ` : ''

  const storeString = `
	$spa.bindStore($componentId, proxy, 'auth', {
		profile: 'profile'
	})
  `

  const storeStrIndex = script.indexOf('$spa.bindStore(')
  if(storeStrIndex !== -1) {
  	script = script.splice(storeStrIndex, '$spa.bindStore('.length, '$spa.bindStore($componentId, proxy, ')
  }

  const watcherStrIndex = script.indexOf('$spa.watch(')
  if(watcherStrIndex !== -1) {
  	script = script.replaceAll('$spa.watch(', '$spa.watch($componentId, ')
  }


  return `{ 
  	const $componentId = '${id}'; 
  	${script} 
  	${handlersString}
  }`; 
}

function loadjs(script, id, componentName) {
	if(!id) return
	//if(scriptsLoaded.has(script)) return
	scriptsLoaded.add(script)
  var js = document.createElement("script");
  js.setAttribute('id', id)

  js.textContent = getScriptString(script, id, componentName)
  document.head.appendChild(js);
}


export async function runApp(components){
	//load layout
	await initCustomComponents()
	await runPage()

	window.addEventListener('hashchange',async ()=>{
		runPage()
	})
}

const definedPages = {}

async function runPage(){
	const path = location.hash.slice(1)
	const viewContainer = document.querySelector('[data-view]')

	const pageName = 'app-page-'+path
	if(definedPages[pageName]) {
		viewContainer.replaceChildren(definedPages[pageName])
		return
	}

	const page = document.createElement(pageName)
	viewContainer.replaceChildren(page)
	await initCustomComponents(viewContainer, 'pages')
	definedPages[pageName] = page

}	

async function loadPage(){
	const path = location.hash.slice(1)
	const { innerHtml, script } = await getComponent(path, 'pages')
	const viewContainer = document.querySelector('[data-view]')
	if(!innerHtml || !viewContainer) return
	viewContainer.replaceChildren(innerHtml)

	if(script) {
		await loadjs(script.textContent, getDataAttr(innerHtml))
	}

	await initCustomComponents(viewContainer)
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
	if(componentName.includes('page')) {
		componentName = componentName.split('-')[1]
	}

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

function getPath(folder, componentName){
	return `../${folder}/${componentName}.html`
}

async function fetchTemplate(folder, componentName){
	let path = getPath(folder, componentName)
	let { noResponse, template } = await fetchPath(path)
	if(noResponse) {
		const path = componentName+'/index'
		const { noResponse: noRes, template: temp} = await fetchPath(path)
		template = temp
		noResponse = noRes
		if(noRes) {
			const path = componentName.split('-').join('/')
			const { noResponse: nr, template: tp } = await fetchPath(path)
			if(nr) {
				template = tp
				noResponse = ns
			}
		}

	}
	return { template, noResponse, path }
}

async function fetchPath(path){
		const template = await fetch(path)
			.then(res=>res.text()).then((res)=>res)
		const noResponse = template.includes('Not Found');

		return {
			noResponse,
			template
		}
}




