/* observer.js 数据劫持 */

import Dep from './dep'

const Observer = function(data) {
  this.observer(data)
}

Observer.prototype = {
  constructor: Observer,
  observer: function(data) {
    if (data && typeof data === 'object') {
      Object.keys(data).forEach(key => {
        this.defineReactive(data, key, data[key])
        this.observer(data[key])  // 递归劫持
      })
    }
  },
  defineReactive: function(obj, key, value) {
    let that = this
    let dep = new Dep()
    Object.defineProperty(obj, key, {
      enumerable: true,
      configurable: true,
      get() {
        Dep.target && dep.addSub(Dep.target)
        return value
      },
      set(newValue) {
        if (newValue !== value) {
          that.observer(newValue)
          value = newValue
          dep.notify()
        }
      }
    })
  }
}

export default Observer
