
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


export async function initCustomComponents(target=null){
	await loopCustomComponents(async (component)=>{
		const path = component.tagName.split('-').slice(1).join('-')
		const name = path.toLowerCase()
		const { innerHtml, script } = await getComponent(name)

		let componentId  = getUUID()
		// if(getDataAttr(component)) {
		// 	componentId = getDataAttr(component)
		// } else {
		// 	componentId = getUUID()
		// }
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
			document.body.appendChild(innerHtml)
		}

		if(script) { 
			script.setAttribute('id', componentId)
			loadjs(script.textContent, componentId)
		}
	}, target)
}

function loadjs(script, id) {
	if(!id) return
	//if(scriptsLoaded.has(script)) return
	scriptsLoaded.add(script)
  var js = document.createElement("script");
  js.setAttribute('id', id)
  js.textContent = `{ ${script} }`;
  //js.textContent = `{ try{ ${script} } catch(err) { console.log(err) }`;

  document.head.appendChild(js);
}


export async function runApp(components){
	//load layout
	await initCustomComponents()
	loadPage()

	window.addEventListener('hashchange',async ()=>{
		loadPage()
	})
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

export function initComponents(){
	return setupComponents()
}


export function initDomApp(components){
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




