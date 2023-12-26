```
	$spa.watch('mountedComponent', ()=> {

	})
```

```
	$spa.initCustomElement({
		name: 'name',
		attrs: ['attr-name'],
	}); // use ; to get auto import $proxy and $element

	//or

	const { element, proxy } = $spa.getRoots($componentId)

```