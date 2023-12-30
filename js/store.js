import { getRootParent } from './proxy.js'
const definedStores = {}

export function createStore(name){
	const watchers = {}
	const app = {
		setHandler(componentId, proxy, storeKey, bindKey){	
			if(!this.handlers[storeKey]) {
				this.handlers[storeKey] = []
			}	
			this.handlers[storeKey].push({
				componentId,
				bindKey,
				proxy
			})

		},
		handlers: {},
		reactValues,
		watch(prop, func){
			if(!watchers[prop]) {
				watchers[prop] = []
			}

			watchers[prop].push(func)
		},
		
		get(target, prop, receiver) {
			const value = target[prop];
			if (value instanceof Function) {
				return function(...args) {
					return value.apply(this === receiver ? target : this, args);
				};
			}

			if(Array.isArray(target)) return target[prop]

			if (value instanceof Function) {
				return function(...args) {
					return value.apply(this === receiver ? target : this, args);
				};
			}

			if(value !== null && typeof value === 'object' || Array.isArray(value)) {
				return new Proxy(target[prop], { ...app, parent: this, parentProp: prop })
			}

			return value;

			//return  Reflect.get(...arguments)
			//return Reflect.get(target, prop).bind(target);
		},
		set(target, prop, value) {
			target[prop] = value
			reactValue(prop, value)
			reactWatchers(prop, value)

			if(this.parent) {
				const { parent, value, key } = getRootParent(this, target, prop)
				reactWatchers(key, value[key])
				return true
			} 

			return true
			//return Reflect.set(target, prop, value, receiver)

		},
	}
	const store = new Proxy(app, app);

	definedStores[name] = store 

	function reactWatchers(prop, value){
		watchers[prop]?.forEach(action=>{
			action(value)
		})
	}

	function reactValues(){
		Object.keys(store).forEach(key=>{
			reactValue(key, store[key])
		})
	}


	function reactValue(prop, value){
		if(store.handlers[prop]) {
			store.handlers[prop].forEach(item=>{
				item.proxy[item.bindKey] = value
			})
		}
	}

	return store
}


export function getStore(name) {
	return definedStores[name]
}