const definedStores = {}
export function createStore(name){
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
	}
	const store = new Proxy(app, {
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
			if(store.handlers[prop]) {
				store.handlers[prop].forEach(item=>{
					item.proxy[item.bindKey] = value
				})
			}

			return true
			//return Reflect.set(target, prop, value, receiver)

		},
	});

	definedStores[name] = store 

	Object.keys(store).forEach(key=>{
		reactValue(key, store[key])
	})

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