/* dep.js 发布订阅 */

const Dep = function() {
  this.subs = []
}

Dep.prototype = {
  constructor: Dep,
  addSub: function(sub) {
    this.subs.push(sub)
  },
  removeSub: function(sub) {
    this.subs.forEach((item, index) => {
      if (item === sub) {
        this.subs.splice(index, 1)
      }
    })
  },
  notify: function() {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}

export default Dep
