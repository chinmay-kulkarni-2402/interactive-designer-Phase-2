!(function (n, t) {
  "object" == typeof exports && "object" == typeof module
    ? (module.exports = t())
    : "function" == typeof define && define.amd
    ? define([], t)
    : "object" == typeof exports
    ? (exports["navbar-component"] = t())
    : (n["navbar-component"] = t());
})(
  "undefined" != typeof globalThis
    ? globalThis
    : "undefined" != typeof window
    ? window
    : this,
  () =>
    (() => {
      "use strict";
      var n = {
          d: (t, e) => {
            for (var a in e)
              n.o(e, a) &&
                !n.o(t, a) &&
                Object.defineProperty(t, a, { enumerable: !0, get: e[a] });
          },
          o: (n, t) => Object.prototype.hasOwnProperty.call(n, t),
          r: (n) => {
            "undefined" != typeof Symbol &&
              Symbol.toStringTag &&
              Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }),
              Object.defineProperty(n, "__esModule", { value: !0 });
          },
        },
        t = {};
      n.r(t), n.d(t, { default: () => i });
      var e =
        (void 0 && (void 0).__assign) ||
        function () {
          return (
            (e =
              Object.assign ||
              function (n) {
                for (var t, e = 1, a = arguments.length; e < a; e++)
                  for (var o in (t = arguments[e]))
                    Object.prototype.hasOwnProperty.call(t, o) && (n[o] = t[o]);
                return n;
              }),
            e.apply(this, arguments)
          );
        };
      const a = function (n, t) {
        var e = n.Components,
          a = t.id,
          o = t.label,
          i = t.classPrefix,
          r = "".concat(a, "-container"),
          l = "".concat(a, "-nav-menu"),
          c = "".concat(a, "-nav-menu-link"),
          s = "".concat(a, "-burger-menu"),
          d = "".concat(a, "-burger-menu-line");
        e.addType(a, {
          model: {
            defaults: {
              droppable: !1,
              name: o,
              attributes: { class: i },
              components: { type: r },
              styles:
                (t.style ||
                  "\n          ."
                    .concat(
                      i,
                      " {\n            background-color: #222;\n            color: #ddd;\n            min-height: 50px;\n            width: 100%;\n          }\n\n          ."
                    )
                    .concat(
                      i,
                      "-container {\n            max-width: 950px;\n            margin: 0 auto;\n            width: 95%;\n          }\n\n          ."
                    )
                    .concat(
                      i,
                      "-items-c {\n            display: inline-block;\n            float: right;\n          }\n\n          ."
                    )
                    .concat(
                      i,
                      '-container::after {\n            content: "";\n            clear: both;\n            display: block;\n          }\n\n          .'
                    )
                    .concat(
                      i,
                      "-brand {\n            vertical-align: top;\n            display: inline-block;\n            padding: 5px;\n            min-height: 50px;\n            min-width: 50px;\n            color: inherit;\n            text-decoration: none;\n          }\n\n          ."
                    )
                    .concat(
                      i,
                      "-menu {\n            padding: 10px 0;\n            display: block;\n            float: right;\n            margin: 0;\n          }\n\n          ."
                    )
                    .concat(
                      i,
                      "-menu-link {\n            margin: ;\n            color: inherit;\n            text-decoration: none;\n            display: inline-block;\n            padding: 10px 15px;\n          }\n\n          ."
                    )
                    .concat(
                      i,
                      "-burger {\n            margin: 0px 0;\n            width: 45px;\n            padding: 5px 10px;\n            display: none;\n            float: right;\n            cursor: pointer;\n          }\n\n          ."
                    )
                    .concat(
                      i,
                      "-burger-line {\n            padding: 1px;\n            background-color: white;\n            margin: 5px 0;\n          }\n\n          @media (max-width: 768px) {\n            ."
                    )
                    .concat(
                      i,
                      "-items-c {\n              display: none;\n              width: 100%;\n            }\n\n            ."
                    )
                    .concat(
                      i,
                      "-burger {\n              display: block;\n            }\n\n            ."
                    )
                    .concat(
                      i,
                      "-menu {\n              width: 100%;\n            }\n\n            ."
                    )
                    .concat(
                      i,
                      "-menu-link {\n              display: block;\n            }\n          }\n        "
                    )) + t.styleAdditional,
            },
          },
        }),
          e.addType(r, {
            model: {
              defaults: {
                attributes: {
                  class: "".concat(i, "-container"),
                  "data-i_designer": "navbar",
                },
                name: "Navbar Container",
                droppable: !1,
                draggable: !1,
                removable: !1,
                copyable: !1,
                highlightable: !1,
                components: [
                  {
                    type: "link",
                    attributes: { class: "".concat(i, "-brand"), href: "/" },
                  },
                  { type: s },
                  {
                    attributes: {
                      class: "".concat(i, "-items-c"),
                      "data-i_designer": "navbar-items",
                    },
                    components: { type: l },
                  },
                ],
              },
            },
          }),
          e.addType(l, {
            model: {
              defaults: {
                name: "Navbar Menu",
                tagName: "nav",
                attributes: { class: "".concat(i, "-menu") },
                components: [
                  { type: c, components: "Home" },
                  { type: c, components: "About" },
                  { type: c, components: "Contact" },
                ],
              },
            },
          }),
          e.addType(c, {
            extend: "link",
            model: {
              defaults: {
                name: "Menu link",
                draggable: '[data-i_designer-type="'.concat(l, '"]'),
                attributes: { class: "".concat(i, "-menu-link") },
              },
            },
          }),
          e.addType(s, {
            model: {
              defaults: {
                name: "Burger",
                draggable: !1,
                droppable: !1,
                copyable: !1,
                removable: !1,
                script: function () {
                  var n,
                    t = this,
                    e = "i_designer-collapse",
                    a = "max-height",
                    o = 0,
                    i = (function () {
                      var n = document.createElement("void"),
                        t = {
                          transition: "transitionend",
                          OTransition: "oTransitionEnd",
                          MozTransition: "transitionend",
                          WebkitTransition: "webkitTransitionEnd",
                        };
                      for (var e in t) if (void 0 !== n.style[e]) return t[e];
                    })(),
                    r = function (n) {
                      o = 1;
                      var t = (function (n) {
                          var t = window.getComputedStyle(n),
                            e = t.display,
                            o = parseInt(t[a]);
                          if ("none" !== e && 0 !== o) return n.offsetHeight;
                          (n.style.height = "auto"),
                            (n.style.display = "block"),
                            (n.style.position = "absolute"),
                            (n.style.visibility = "hidden");
                          var i = n.offsetHeight;
                          return (
                            (n.style.height = ""),
                            (n.style.display = ""),
                            (n.style.position = ""),
                            (n.style.visibility = ""),
                            i
                          );
                        })(n),
                        e = n.style;
                      (e.display = "block"),
                        (e.transition = "".concat(a, " 0.25s ease-in-out")),
                        (e.overflowY = "hidden"),
                        "" == e[a] && (e[a] = 0),
                        0 == parseInt(e[a])
                          ? ((e[a] = "0"),
                            setTimeout(function () {
                              e[a] = t + "px";
                            }, 10))
                          : (e[a] = "0");
                    };
                  e in t ||
                    t.addEventListener("click", function (e) {
                      if ((e.preventDefault(), !o)) {
                        var l = t.closest("[data-i_designer=navbar]"),
                          c =
                            null == l
                              ? void 0
                              : l.querySelector("[data-i_designer=navbar-items]");
                        c && r(c),
                          n ||
                            (null == c ||
                              c.addEventListener(i, function () {
                                o = 0;
                                var n = c.style;
                                0 == parseInt(n[a]) &&
                                  ((n.display = ""), (n[a] = ""));
                              }),
                            (n = 1));
                      }
                    }),
                    (t[e] = 1);
                },
                attributes: { class: "".concat(i, "-burger") },
                components: [{ type: d }, { type: d }, { type: d }],
              },
            },
          }),
          e.addType(d, {
            model: {
              defaults: {
                name: "Burger Line",
                droppable: !1,
                draggable: !1,
                highlightable: !1,
                attributes: { class: "".concat(i, "-burger-line") },
              },
            },
          });
      };
      var o =
        (void 0 && (void 0).__assign) ||
        function () {
          return (
            (o =
              Object.assign ||
              function (n) {
                for (var t, e = 1, a = arguments.length; e < a; e++)
                  for (var o in (t = arguments[e]))
                    Object.prototype.hasOwnProperty.call(t, o) && (n[o] = t[o]);
                return n;
              }),
            o.apply(this, arguments)
          );
        };
      const i = function (n, t) {
        void 0 === t && (t = {});
        var i = o(
          {
            id: "navbar",
            label: "Navbar",
            block: {},
            style: "",
            styleAdditional: "",
            classPrefix: "navbar",
          },
          t
        );
        !(function (n, t) {
          var a = t.block,
            o = t.label,
            i = t.id;
          a &&
            n.Blocks.add(
              i,
              e(
                {
                  media:
                    '<svg viewBox="0 0 24 24">\n        <path d="M22 9c0-.6-.5-1-1.25-1H3.25C2.5 8 2 8.4 2 9v6c0 .6.5 1 1.25 1h17.5c.75 0 1.25-.4 1.25-1V9Zm-1 6H3V9h18v6Z"/><path d="M15 10h5v1h-5zM15 13h5v1h-5zM15 11.5h5v1h-5z"/>\n      </svg>',
                  label: o,
                  category: "Extra",
                  select: !0,
                  content: { type: i },
                },
                a
              )
            );
        })(n, i),
          a(n, i);
      };
      return t;
    })()
);
