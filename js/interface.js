const listeners = new Map()

export function addEventListener(target, event, handler){
	target.addEventListener(event, handler)
	listeners.set(handler, target)
}

export function bindElement(selector, extend, options){

	const { init, update } = options ? options : {}
	const app = {
		lib: {
			target: typeof selector === 'string' ?  document.querySelector(selector) : selector,
			setAttribute(attr, val){
				this.target.setAttribute('data-'+ attr, val)
			}
		},
		...extend
	}

	if(extend.click) {
		addEventListener(app.lib.target,'click',extend.click)
	}

	init && init()

	const wrap = new Proxy(app, {
	  get(target, prop, receiver) {
	    const value = target[prop];
	    if (value instanceof Function) {
	      return function (...args) {
	        return value.apply(this === receiver ? target : this, args);
	      };
	    }
	    return value;
	    // return Reflect.get(target, key).bind(target);
	  },
	  set(target, prop, value) {
		target[prop] = value

		if(typeof value === 'object') {
			app.lib.setAttribute(prop, JSON.stringify(value))
		} else {
			app.lib.setAttribute(prop, value)
		}

		update && update(prop, value)
		return true
		//return Reflect.set(target, prop, value, receiver)

	  }
	});




	return wrap
}

