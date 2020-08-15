/* mvvm.js 入口函数 */

import Observer from './modules/observer'
import Compile from './modules/compile'

const MVVM = function(options) {
  this.$el = options.el
  this.$data = options.data
  this.$methods = options.methods
  if (this.$el) {
    new Observer(this.$data)
    this.proxyData(this.$data)
    new Compile(this.$el, this)
  }
}

MVVM.prototype.proxyData = function(data) {
  Object.keys(data).forEach(key => {
    Object.defineProperty(this, key, {
      get() {
        return data[key]
      },
      set(newValue) {
        data[key] = newValue
      }
    })
  })
}

export default MVVM
