// !(function (n, a) {
//     "object" == typeof exports && "object" == typeof module
//       ? (module.exports = a())
//       : "function" == typeof define && define.amd
//         ? define([], a)
//         : "object" == typeof exports
//           ? (exports["page-manager-component"] = a())
//           : (n["page-manager-component"] = a());
//   })(
//     "undefined" != typeof globalThis
//       ? globalThis
//       : "undefined" != typeof window
//         ? window
//         : this,
//     () =>
//       (() => {
//         "use strict";
//         var n = {
//           d: (a, e) => {
//             for (var t in e)
//               n.o(e, t) &&
//                 !n.o(a, t) &&
//                 Object.defineProperty(a, t, { enumerable: !0, get: e[t] });
//           },
//           o: (n, a) => Object.prototype.hasOwnProperty.call(n, a),
//           r: (n) => {
//             "undefined" != typeof Symbol &&
//               Symbol.toStringTag &&
//               Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }),
//               Object.defineProperty(n, "__esModule", { value: !0 });
//           },
//         },
//           a = {};
//         n.r(a), n.d(a, { default: () => PageManager });
  
//         /**
//          * Page Manager Plugin
//          * Handles page management including adding, removing, and switching pages
//          */
//         const PageManager = function (editor, opts = {}) {
//           const pm = editor.PageManager;
//           const domc = editor.DomComponents;
//           const config = {
//             category: "Pages",
//             ...opts,
//           };
  
//           // Function to create a new page
//           const createPage = (title = "New Page") => {
//             const page = pm.add(title);
//             editor.select(page);
//             return page;
//           };
  
//           // Function to remove a page
//           const removePage = (pageId) => {
//             const page = pm.get(pageId);
//             if (page) pm.remove(pageId);
//           };
  
//           // Function to switch between pages
//           const switchPage = (pageId) => {
//             const page = pm.get(pageId);
//             if (page) editor.select(page);
//           };
  
//           // Registering basic page functionalities
//           pm.addType("page", {
//             model: {
//               defaults: {
//                 title: "Page",
//                 components: [],
//                 styles: [],
//               },
//             },
//           });
  
//           // Add default pages if required
//           if (config.defaultPages) {
//             config.defaultPages.forEach((page) => createPage(page));
//           }
  
//           // Expose methods
//           return {
//             createPage,
//             removePage,
//             switchPage,
//           };
//         };
  
//         return a;
//       })()
//   );
  