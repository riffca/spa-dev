
		const definedComponentsAttrs = {}
		const fetchedComponents = {}
		const fetchedPages = {}


		let observer = new MutationObserver(mutationRecords => {
			for (const mutation of mutationRecords) {
				if (mutation.type === "childList") {
					for(let index = 0; index < mutation.addedNodes.length; index++) {
						const node = mutation.addedNodes[index]
						if(node.name !== '#text' && node.getAttribute) {
			
						}	
					}
			   	}
			}
		});

		observer.observe(document.body, {
		  	childList: true, 
		  	subtree: true, 
		});


		function getInner(node){
			return [...node.querySelectorAll('[data-component]')]
		}


		export function initApp(components){
			if(components) {
				components.forEach(item=>{
					initComponent(item)
				})
			}
			initComponent({
				name: 'layout',
				attrs(key, value, target){
					if(key === 'data-layout') {
						window.qqq = target
						target.className = value
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

			initComponent({
				name: 'button',
				attrs(key, value, target){
					if(key === 'data-text') {
						const doc = target.querySelector('[data-text]')
						if(doc) {
							doc.textContent = value
						} else {
							target.textContent = value
						}
					}
				},
			})

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

			initComponents()
			loadPage()
		}

		function initComponents() {
			const empties = document.querySelectorAll('[data-component]');
			console.log([...empties].filter(item=>!item.getAttribute('data-init')));

			[...empties].forEach(async elTarget=>{
				if(elTarget.getAttribute('data-init')) return
				const componentName = elTarget.getAttribute('data-component')
				const component = await getComponent(componentName)
				const elTargetAttributes = [].filter.call(elTarget.attributes, at => /^data-/.test(at.name));

				const inner = getInner(component)

				if(inner.length) {
					elTarget.replaceChildren(component)

					const name = elTarget.getAttribute('data-component')
					
					let attrsFunc = null
					if(definedComponentsAttrs[name]){
						attrsFunc = definedComponentsAttrs[name]
					}	

					setupComponent({ node: elTarget, attrs: attrsFunc, name })


					const components = []
					for (const item of inner) {
						if(item.getAttribute('data-init')) return 

						const name = item.getAttribute('data-component')
						const params = {
							name,
							node: item,
						}
						if(definedComponentsAttrs[name]){
							params.attrs = definedComponentsAttrs[name]
						}	

						const dataAttrs = [].filter.call(item.attributes, at => /^data-/.test(at.name));
						params.dataAttrs = dataAttrs


						elTargetAttributes.forEach((item)=>{
							const current = dataAttrs.find(at=>at.name === item.name)
							if(current) {
								if(current.value === item.name) {
									current.value = item.value	
								}
							}
						})

						await setupComponent(params)
					
					}
				

					//const div = createElement('div')
					//elTarget.replaceChildren(component)
				} else {
					const result = await setupComponent({
						name: componentName,
						node: elTarget,
						attrs: definedComponentsAttrs[componentName],

						dataAttrs: elTargetAttributes
					})

					if(result[Symbol.iterator]) {
						elTarget.replaceChildren(...result)
					} else {
						elTarget.replaceChildren(result)
					}


				}

			})

		}

		async function getPage(componentName){
			let path = `../pages/${componentName}.html`
			let template = null

			if(fetchedPages[componentName]) {
				template = fetchedPages[componentName]
			}

			if(!template) {
				template = await fetch(path)
					.then(res=>res.text()).then((res)=>res)
				const noResponse = template.includes('Not Found');
				if(!noResponse && template) {
				 	fetchedPages[componentName] = template
				} 
				if(noResponse) {
					template = null
				}
				fetchedPages[componentName] = template
			}

			return template
		}


		const fetchedStyles = {}

		async function loadPage(){
			const path = location.hash.slice(1)
			const template = await getPage(path)
			const component = document.querySelector('[data-view]')
			console.log(template)

			const componentDoc = template ? 
				new DOMParser().parseFromString(template, "text/html") : null

			const innerHtml = componentDoc ? 
				componentDoc.documentElement.querySelector('body > :first-child') :
				document.createElement('div') 

			const script = componentDoc ? componentDoc.documentElement.querySelector('script') : null
			const style = componentDoc ? componentDoc.documentElement.querySelector('style') : null
	
			// const inserScript = document.createElement('script')
			// inserScript.innerHtml = script.textContent
			// console.log(inserScript.innerHtml)
			// document.body.appendChild(inserScript)

			component.replaceChildren(innerHtml)
			script && eval(script.textContent)
			initComponents()
			
			if(fetchedStyles[path]) return	
			if(style) {
				const insertStyle = document.createElement('style')
				insertStyle.textContent = style.textContent
				console.log(insertStyle.innerHtml)
				document.head.appendChild(insertStyle)
				fetchedStyles[path] = true
			}
		}		

		window.addEventListener('hashchange',async ()=>{
			loadPage()
		})


		async function getComponent(componentName){

			let path = `../components/${componentName}.html`
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


			const componentDoc = template ? 
				new DOMParser().parseFromString(template, "text/html") : null



			const component = componentDoc ? 
				componentDoc.documentElement.querySelector('body > :first-child') :
				document.createElement('div') 

			return component
		}


		function hasDataAttrs(node) {
			return [].filter.call(node.attributes, at => /^data-/.test(at.name)).length;
		}

		async function setupComponent({
			name,
			attrs,
			node,
			dataAttrs
		}){
			if(!node) {
				node = await getComponent(name)
			}

			if(node.getAttribute('data-init')) return node
			node.setAttribute('data-init', true)

			const initAttributes = {}

			let initAttrs = dataAttrs || [].filter.call(node.attributes, at => /^data-/.test(at.name));
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

				attrs(key, value, target, node)
			})

			let observer = new MutationObserver(mutationRecords => {
			  	for (const mutation of mutationRecords) {
				    if (mutation.type === "attributes") {
				    	if(!mutation.attributeName.includes('data')) return 
				    	const value = mutation.target.attributes[mutation.attributeName].value
				    	value && attrs(mutation.attributeName, value, mutation.target, node)
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


		async function initComponent({
			name,
			attrs,
		}){

			if(attrs && !definedComponentsAttrs[name]) {
				definedComponentsAttrs[name] = attrs
			}

		}

