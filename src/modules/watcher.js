/* watcher.js 数据监听 */

import Dep from './dep'

const Watcher = function(vm, exp, callback) {
  this.vm = vm
  this.exp = exp
  this.callback = callback
  this.value = this.get()
}

Watcher.prototype = {
  constructor: Watcher,
  getVal: function(vm, exp) {
    exp = exp.split('.')
    return exp.reduce((prev, next) => {
      return prev[next]
    }, vm.$data)
  },
  get: function() {
    Dep.target = this
    let value = this.getVal(this.vm, this.exp)
    Dep.target = null
    return value
  },
  update: function() {
    let newValue = this.getVal(this.vm, this.exp)
    let oldValue = this.value
    if (newValue !== oldValue) {
      this.callback(newValue)
    }
  }
}

export default Watcher
