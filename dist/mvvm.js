(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.MVVM = factory());
}(this, (function () { 'use strict';

  /* dep.js 发布订阅 */

  const Dep = function() {
    this.subs = [];
  };

  Dep.prototype = {
    constructor: Dep,
    addSub: function(sub) {
      this.subs.push(sub);
    },
    removeSub: function(sub) {
      this.subs.forEach((item, index) => {
        if (item === sub) {
          this.subs.splice(index, 1);
        }
      });
    },
    notify: function() {
      this.subs.forEach(sub => {
        sub.update();
      });
    }
  };

  /* observer.js 数据劫持 */

  const Observer = function(data) {
    this.observer(data);
  };

  Observer.prototype = {
    constructor: Observer,
    observer: function(data) {
      if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
          this.defineReactive(data, key, data[key]);
          this.observer(data[key]);  // 递归劫持
        });
      }
    },
    defineReactive: function(obj, key, value) {
      let that = this;
      let dep = new Dep();
      Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get() {
          Dep.target && dep.addSub(Dep.target);
          return value
        },
        set(newValue) {
          if (newValue !== value) {
            that.observer(newValue);
            value = newValue;
            dep.notify();
          }
        }
      });
    }
  };

  /* watcher.js 数据监听 */

  const Watcher = function(vm, exp, callback) {
    this.vm = vm;
    this.exp = exp;
    this.callback = callback;
    this.value = this.get();
  };

  Watcher.prototype = {
    constructor: Watcher,
    getVal: function(vm, exp) {
      exp = exp.split('.');
      return exp.reduce((prev, next) => {
        return prev[next]
      }, vm.$data)
    },
    get: function() {
      Dep.target = this;
      let value = this.getVal(this.vm, this.exp);
      Dep.target = null;
      return value
    },
    update: function() {
      let newValue = this.getVal(this.vm, this.exp);
      let oldValue = this.value;
      if (newValue !== oldValue) {
        this.callback(newValue);
      }
    }
  };

  /* compile.js 模板编译 */

  const Compile = function(el, vm) {
    this.el = this.isElementNode(el) ? el : document.querySelector(el);
    this.vm = vm;
    if (this.el) {
      this.fragment = this.node2fragment(this.el);
      this.compile(this.fragment);
      this.el.appendChild(this.fragment);
    }
  };

  Compile.prototype = {
    constructor: Compile,
    compile(fragment) {
      const child = fragment.childNodes;
      Array.from(child).forEach(node => {
        if (this.isElementNode(node)) {
          this.compileElement(node);
          if (node.childNodes) {
            this.compile(node);
          }
        } else if (this.isTextNode(node)) {
          this.compileText(node);
        }
      });
    },
    compileElement: function(node) {
      const attrs = node.attributes;
      Array.from(attrs).forEach(attr => {
        const name = attr.name;
        if (this.isDirective(name)) {
          const exp = attr.value;
          if (this.isEvent(name)) {
            CompileUtil.event(node, this.vm, exp);
          } else {
            const type = name.split('-')[1];
            CompileUtil[type](node, this.vm, exp);
          }
        }
      });
    },
    compileText: function(node) {
      let exp = node.textContent;
      let reg = /\{\{(.*)\}\}/;
      if (reg.test(exp)) {
        CompileUtil.text(node, this.vm, RegExp.$1.trim());
      }
    },
    node2fragment: function(el) {
      let child, fragment = document.createDocumentFragment();
      while (child = el.firstChild) {
        fragment.appendChild(child);
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
  };

  const CompileUtil = {
    getVal(vm, exp) {
      exp = exp.split('.');
      return exp.reduce((prev, next) => {
        return prev[next]
      }, vm.$data)
    },
    setVal(vm, exp, value) {
      exp = exp.split('.');
      return exp.reduce((prev, next, index) => {
        if (index === exp.length - 1) {
          return prev[next] = value
        }
        return prev[next]
      }, vm.$data)
    },
    text: function(node, vm, exp) {
      this.bind(node, vm, exp, 'text');
    },
    html: function(node, vm, exp) {
      this.bind(node, vm, exp, 'html');
    },
    class: function(node, vm, exp) {
      this.bind(node, vm, exp, 'class');
    },
    model: function(node, vm, exp) {
      this.bind(node, vm, exp, 'model');
      node.addEventListener('input', event => {
        const value = event.target.value;
        if (value !== this.getVal(vm, exp)) {
          this.setVal(vm, exp, value);
        }
      });
    },
    bind: function(node, vm, exp, type) {
      const update = this.updater[type + 'Updater'];
      new Watcher(vm, exp, (newValue, oldValue) => {
        update && update(node, newValue, oldValue);
      });
      update && update(node, this.getVal(vm, exp));
    },
    event: function(node, vm, exp, type) {
      const evnetType = type.split(':')[1];
      const fn = vm.$methods && vm.$methods[exp];
      if (evnetType && fn) {
        node.addEventListener(evnetType, fn.bind(vm));
      }
    },
    updater: {
      textUpdater: (node, value) => {
        node.textContent = typeof value === 'undefined' ? '' : value;
      },
      htmlUpdater: (node, value) => {
        node.innerHTML = typeof value === 'undefined' ? '' : value;
      },
      classUpdater: (node, newValue, oldValue) => {
        const className = node.className.replace(oldValue, '').replace(/\s$/, '');
        const space = className && String(newValue) ? ' ' : '';
        node.className = className + space + newValue;
      },
      modelUpdater: (node, value) => {
        node.value = typeof value === 'undefined' ? '' : value;
      }
    }
  };

  /* main.js 入口函数 */

  const MVVM = function(options) {
    this.$el = options.el;
    this.$data = options.data;
    this.$methods = options.methods;
    if (this.$el) {
      new Observer(this.$data);
      this.proxyData(this.$data);
      new Compile(this.$el, this);
    }
  };

  MVVM.prototype.proxyData = function(data) {
    Object.keys(data).forEach(key => {
      Object.defineProperty(this, key, {
        get() {
          return data[key]
        },
        set(newValue) {
          data[key] = newValue;
        }
      });
    });
  };

  return MVVM;

})));
