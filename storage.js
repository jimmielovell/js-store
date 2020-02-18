'use strict';

const toString = Object.prototype.toString;

const extend = (o, p)=>{
	for (let prop in p) {
		o[prop] = toString.call(o[prop]) == '[object Object]' ? extend(o[prop], p[prop]) : p[prop];
	}

	return o;
}

const removeKey = (o, key)=>{
	if (typeof key != 'string') {
		throw TypeError('removeKey expects a string as key');
	}

	const keys = key.split('.');

	if (Object.hasOwnProperty.call(o, keys[0])) {
		if (keys.length > 1) {
			if (toString.call(o[keys[0]]) == '[object Object]') {
				let k = keys[0];
				keys.shift();
				removeKey(o[k], keys.join('.'));
			}
		} else {
			delete o[keys[0]];
		}
	}
}

class Storage {
	static get(...keys) {
		return new Promise((resolve, reject)=>{
			const getOne = key=>{
				const _keys = key.split('.');
				let val = this.stw.get(this)[_keys[0]];

				this.stw.get(this)[_keys[0]]
				typeof val == 'string' && val.startsWith("{") ? val = JSON.parse(val) : 0;

				if (_keys.length > 1) {	
					for (let i = 1; i < _keys.length; i++) { val = val[_keys[i]] }
				}

				return val;
			}

			if (keys.length > 1) {
				resolve(keys.map(key=>getOne(key)));
			} else {
				resolve(getOne(keys[0]));
			}
		});
	}

	static add(key, value) {
		return new Promise((resolve, reject)=>{
			const keys = key.split('.');

			this.get(keys[0]).then(oldVals=>{
				for (let i = keys.length - 1; i > 0; i--) {
					value = {[keys[i]]: value};
				}

				if (toString.call(value) == '[object Object]') {
					if (toString.call(oldVals) == '[object Object]') { value = extend(oldVals, value) }
					value = JSON.stringify(value);
				}
				
				this.stw.get(this)[keys[0]] = value;
				resolve(undefined);
			}).catch(err=>reject(err));
		});
	}

	static clear() {
		return Promise.resolve(this.stw.get(this).clear());
	}

	static remove(key) {
		return new Promise((resolve, reject)=>{
			const keys = key.split('.');

			if (keys.length == 1) {
				this.stw.get(this).removeItem(key);
			} else if (keys.length > 1) {
				this.get(keys[0]).then(oldVals=>{
					removeKey(oldVals, keys);
					this.stw.get(this)[keys[0]] = oldVals;
				});
			}

			resolve(undefined);
		});
	}
}

Storage.stw = WeakMap.prototype.set.call(new WeakMap(), Storage, window.localStorage);

class Session extends Storage {}

Session.stw = WeakMap.prototype.set.call(new WeakMap(), Session, window.sessionStorage);

export {Storage, Session};
