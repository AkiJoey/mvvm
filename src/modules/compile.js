/* compile.js 模板编译 */

import Watcher from './watcher'

const Compile = function(el, vm) {
  this.el = this.isElementNode(el) ? el : document.querySelector(el)
  this.vm = vm
  if (this.el) {
    this.fragment = this.node2fragment(this.el)
    this.compile(this.fragment)
    this.el.appendChild(this.fragment)
  }
}

Compile.prototype = {
  constructor: Compile,
  compile(fragment) {
    const child = fragment.childNodes
    Array.from(child).forEach(node => {
      if (this.isElementNode(node)) {
        this.compileElement(node)
        if (node.childNodes) {
          this.compile(node)
        }
      } else if (this.isTextNode(node)) {
        this.compileText(node)
      }
    })
  },
  compileElement: function(node) {
    const attrs = node.attributes
    Array.from(attrs).forEach(attr => {
      const name = attr.name
      if (this.isDirective(name)) {
        const exp = attr.value
        if (this.isEvent(name)) {
          CompileUtil.event(node, this.vm, exp)
        } else {
          const type = name.split('-')[1]
          CompileUtil[type](node, this.vm, exp)
        }
      }
    })
  },
  compileText: function(node) {
    let exp = node.textContent
    let reg = /\{\{(.*)\}\}/
    if (reg.test(exp)) {
      CompileUtil.text(node, this.vm, RegExp.$1.trim())
    }
  },
  node2fragment: function(el) {
    let child, fragment = document.createDocumentFragment()
    while (child = el.firstChild) {
      fragment.appendChild(child)
    }
    return fragment
  },
  isElementNode: function(node) {
    return node.nodeType === 1
  },
  isTextNode: function(node) {
    return node.nodeType === 3
  },
  isDirective: function(name) {
    return name.includes('v-')
  },
  isEvent: function(name) {
    return name.includes('on')
  }
}

const CompileUtil = {
  getVal(vm, exp) {
    exp = exp.split('.')
    return exp.reduce((prev, next) => {
      return prev[next]
    }, vm.$data)
  },
  setVal(vm, exp, value) {
    exp = exp.split('.')
    return exp.reduce((prev, next, index) => {
      if (index === exp.length - 1) {
        return prev[next] = value
      }
      return prev[next]
    }, vm.$data)
  },
  text: function(node, vm, exp) {
    this.bind(node, vm, exp, 'text')
  },
  html: function(node, vm, exp) {
    this.bind(node, vm, exp, 'html')
  },
  class: function(node, vm, exp) {
    this.bind(node, vm, exp, 'class')
  },
  model: function(node, vm, exp) {
    this.bind(node, vm, exp, 'model')
    node.addEventListener('input', event => {
      const value = event.target.value
      if (value !== this.getVal(vm, exp)) {
        this.setVal(vm, exp, value)
      }
    })
  },
  bind: function(node, vm, exp, type) {
    const update = this.updater[type + 'Updater']
    new Watcher(vm, exp, (newValue, oldValue) => {
      update && update(node, newValue, oldValue)
    })
    update && update(node, this.getVal(vm, exp))
  },
  event: function(node, vm, exp, type) {
    const evnetType = type.split(':')[1]
    const fn = vm.$methods && vm.$methods[exp]
    if (evnetType && fn) {
      node.addEventListener(evnetType, fn.bind(vm))
    }
  },
  updater: {
    textUpdater: (node, value) => {
      node.textContent = typeof value === 'undefined' ? '' : value
    },
    htmlUpdater: (node, value) => {
      node.innerHTML = typeof value === 'undefined' ? '' : value
    },
    classUpdater: (node, newValue, oldValue) => {
      const className = node.className.replace(oldValue, '').replace(/\s$/, '')
      const space = className && String(newValue) ? ' ' : ''
      node.className = className + space + newValue
    },
    modelUpdater: (node, value) => {
      node.value = typeof value === 'undefined' ? '' : value
    }
  }
}

export default Compile
