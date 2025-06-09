!(function (n, a) {
    "object" == typeof exports && "object" == typeof module
      ? (module.exports = a())
      : "function" == typeof define && define.amd
        ? define([], a)
        : "object" == typeof exports
          ? (exports["page-manager-component"] = a())
          : (n["page-manager-component"] = a());
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
          d: (a, e) => {
            for (var t in e)
              n.o(e, t) &&
                !n.o(a, t) &&
                Object.defineProperty(a, t, { enumerable: !0, get: e[t] });
          },
          o: (n, a) => Object.prototype.hasOwnProperty.call(n, a),
          r: (n) => {
            "undefined" != typeof Symbol &&
              Symbol.toStringTag &&
              Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }),
              Object.defineProperty(n, "__esModule", { value: !0 });
          },
        },
          a = {};
        n.r(a), n.d(a, { default: () => PageManager });
  
        /**
         * Page Manager Plugin for GrapesJS
         * Creates a custom page management system using localStorage
         */
        const PageManager = function (editor, opts = {}) {
          const config = {
            category: "Pages",
            storageKey: "grapesjs-pages",
            defaultPageName: "Home",
            ...opts,
          };

          // Storage helper functions
          const storage = {
            getPages: () => {
              try {
                const pages = localStorage.getItem(config.storageKey);
                return pages ? JSON.parse(pages) : [];
              } catch (e) {
                console.error('Error reading pages from storage:', e);
                return [];
              }
            },
            
            setPages: (pages) => {
              try {
                localStorage.setItem(config.storageKey, JSON.stringify(pages));
              } catch (e) {
                console.error('Error saving pages to storage:', e);
              }
            },
            
            getCurrentPageId: () => {
              return localStorage.getItem(config.storageKey + '-current') || 'home';
            },
            
            setCurrentPageId: (id) => {
              localStorage.setItem(config.storageKey + '-current', id);
            }
          };

          // Initialize default page if none exist
          const initializePages = () => {
            const pages = storage.getPages();
            if (pages.length === 0) {
              const defaultPage = {
                id: 'home',
                name: config.defaultPageName,
                components: [],
                styles: [],
                html: '',
                css: '',
                created: new Date().toISOString()
              };
              storage.setPages([defaultPage]);
              storage.setCurrentPageId('home');
            }
          };

          // Page management functions
          const pageManager = {
            // Get all pages
            getAllPages: () => {
              return storage.getPages();
            },

            // Get current page
            getCurrentPage: () => {
              const pages = storage.getPages();
              const currentId = storage.getCurrentPageId();
              return pages.find(page => page.id === currentId) || pages[0];
            },

            // Create a new page
            createPage: (name = "New Page") => {
              const pages = storage.getPages();
              const pageId = 'page-' + Date.now();
              
              const newPage = {
                id: pageId,
                name: name,
                components: [],
                styles: [],
                html: '',
                css: '',
                created: new Date().toISOString()
              };
              
              pages.push(newPage);
              storage.setPages(pages);
              
              return newPage;
            },

            // Switch to a page
            switchToPage: (pageId) => {
              const pages = storage.getPages();
              const targetPage = pages.find(page => page.id === pageId);
              
              if (!targetPage) {
                console.error('Page not found:', pageId);
                return false;
              }

              // Save current page state before switching
              pageManager.saveCurrentPage();
              
              // Set new current page
              storage.setCurrentPageId(pageId);
              
              // Load the target page
              pageManager.loadPage(targetPage);
              
              return true;
            },

            // Remove a page
            removePage: (pageId) => {
              const pages = storage.getPages();
              
              if (pages.length <= 1) {
                console.warn('Cannot remove the last page');
                return false;
              }
              
              const pageIndex = pages.findIndex(page => page.id === pageId);
              if (pageIndex === -1) {
                console.error('Page not found:', pageId);
                return false;
              }
              
              pages.splice(pageIndex, 1);
              storage.setPages(pages);
              
              // If we removed the current page, switch to the first available page
              if (storage.getCurrentPageId() === pageId) {
                storage.setCurrentPageId(pages[0].id);
                pageManager.loadPage(pages[0]);
              }
              
              return true;
            },

            // Save current page state
            saveCurrentPage: () => {
              const pages = storage.getPages();
              const currentId = storage.getCurrentPageId();
              const currentPageIndex = pages.findIndex(page => page.id === currentId);
              
              if (currentPageIndex !== -1) {
                pages[currentPageIndex].components = editor.getComponents().toJSON();
                pages[currentPageIndex].styles = editor.getCss();
                pages[currentPageIndex].html = editor.getHtml();
                pages[currentPageIndex].css = editor.getCss();
                pages[currentPageIndex].updated = new Date().toISOString();
                storage.setPages(pages);
              }
            },

            // Load a page
            loadPage: (page) => {
              try {
                if (page.components && page.components.length > 0) {
                  editor.setComponents(page.components);
                } else if (page.html) {
                  editor.setComponents(page.html);
                } else {
                  editor.setComponents('');
                }
                
                if (page.styles) {
                  editor.setStyle(page.styles);
                } else if (page.css) {
                  editor.setStyle(page.css);
                }
                
                // Trigger editor refresh
                editor.refresh();
              } catch (e) {
                console.error('Error loading page:', e);
              }
            },

            // Rename a page
            renamePage: (pageId, newName) => {
              const pages = storage.getPages();
              const pageIndex = pages.findIndex(page => page.id === pageId);
              
              if (pageIndex !== -1) {
                pages[pageIndex].name = newName;
                pages[pageIndex].updated = new Date().toISOString();
                storage.setPages(pages);
                return true;
              }
              
              return false;
            },

            // Duplicate a page
            duplicatePage: (pageId) => {
              const pages = storage.getPages();
              const sourcePage = pages.find(page => page.id === pageId);
              
              if (!sourcePage) {
                return false;
              }
              
              const newPageId = 'page-' + Date.now();
              const duplicatedPage = {
                ...sourcePage,
                id: newPageId,
                name: sourcePage.name + ' (Copy)',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
              };
              
              pages.push(duplicatedPage);
              storage.setPages(pages);
              
              return duplicatedPage;
            }
          };

          // Initialize on plugin load
          editor.on('load', () => {
            initializePages();
            
            // Load the current page
            const currentPage = pageManager.getCurrentPage();
            if (currentPage) {
              pageManager.loadPage(currentPage);
            }
          });

          // Save page state before editor actions
          editor.on('component:add component:remove component:update style:update', () => {
            // Debounce saving to avoid too frequent saves
            clearTimeout(pageManager._saveTimeout);
            pageManager._saveTimeout = setTimeout(() => {
              pageManager.saveCurrentPage();
            }, 1000);
          });

          // Save page state before page unload
          window.addEventListener('beforeunload', () => {
            pageManager.saveCurrentPage();
          });

          // Expose the page manager API
          return pageManager;
        };

        return a;
      })()
  );