	export const getRootParent = (proxy, value, key)=> {
		if(!proxy.parent) return { parent: proxy, value, key }
		const prop = proxy.parentProp

		const nextValue = { [prop]: value }
		return getRootParent(proxy.parent, nextValue, prop)
	}	

export function createProxy(selector, extender, options) {

	const handler = {
		get(target, prop, receiver) {
			const value = target[prop];

			if(Array.isArray(target)) return target[prop]

			if (value instanceof Function) {
				return function(...args) {
					return value.apply(this === receiver ? target : this, args);
				};
			}

			if(value !== null && typeof value === 'object' || Array.isArray(value)) {
				return new Proxy(target[prop], { ...handler, parent: this, parentProp: prop })
			}

			return value;

			//return  Reflect.get(...arguments)
			//return Reflect.get(target, prop).bind(target);
		},
		set(target, prop, value) {
			target[prop] = value

			if(this.parent) {
				const { parent, value, key } = getRootParent(this, target, prop)
				parent.watch(key, value[key])
				return true
			} 
				
			this.watch(prop, value)
			return true
			//return Reflect.set(target, prop, value, receiver)

		},
		watch(prop, value){
			const action = watchers[currentElement.dataset.init][prop]
			if(Array.isArray(action)) {
				action.forEach(fn=>{
					fn(value)
				})
			} 
		},
	}

	const wrap = new Proxy(app, handler)

	return wrap
}
