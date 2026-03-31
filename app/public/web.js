// How many thumbnails to load per "page" fetched from Immich
const PER_PAGE = 50

class LGallery {
  items
  lightGallery
  element
  columns = []
  columnIndex = 0
  index = PER_PAGE

  /**
   * Return the desired column count for the current viewport width,
   * matching the CSS breakpoints used for the column containers.
   */
  getColumnCount () {
    const w = window.innerWidth
    if (w >= 1400) return 5
    if (w >= 1000) return 4
    if (w >= 600) return 3
    return 2
  }

  /**
   * Create fresh column <div> containers inside the gallery element.
   */
  createColumns (count) {
    this.columns = []
    this.columnIndex = 0
    for (let i = 0; i < count; i++) {
      const col = document.createElement('div')
      col.className = 'gallery-column'
      this.element.appendChild(col)
      this.columns.push(col)
    }
  }

  /**
   * Append an HTML string to the next column in round-robin order.
   */
  appendItem (html) {
    this.columns[this.columnIndex % this.columns.length].insertAdjacentHTML('beforeend', html + '\n')
    this.columnIndex++
  }

  /**
   * Create a lightGallery instance and populate it with the first page of gallery items
   */
  init (params = {}) {
    this.element = document.getElementById('lightgallery')
    this.items = params.items

    // Collect items already server-rendered into the container before we restructure it
    const existingItems = Array.from(this.element.querySelectorAll(':scope > a'))

    // Create column containers, then move the server-rendered items into them
    this.createColumns(this.getColumnCount())
    existingItems.forEach(item => {
      this.columns[this.columnIndex % this.columns.length].appendChild(item)
      this.columnIndex++
    })

    // Create the lightGallery instance.
    // selector:'a' is required because lightGallery defaults to el.children (direct children),
    // which would only see the column <div>s instead of the nested <a> items.
    this.lightGallery = lightGallery(this.element, Object.assign({
      plugins: [lgZoom, lgThumbnail, lgVideo, lgFullscreen, lgHash],
      speed: 500,
      selector: 'a',
      /*
      This license key was graciously provided by LightGallery under their
      GPLv3 open-source project license:
      */
      licenseKey: '8FFA6495-676C4D30-8BFC54B6-4D0A6CEC'
      /*
      Please do not take it and use it for other projects, as it was provided
      specifically for Immich Public Proxy.

      For your own projects you can use the default license key of
      0000-0000-000-0000 as per their docs:

      https://www.lightgalleryjs.com/docs/settings/#licenseKey
      */
    }, params.lgConfig))

    const spinner = document.getElementById('loading-spinner')
    if (spinner) {
      const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          lgallery.loadMoreItems(observer, spinner)
        }
      }, { rootMargin: '200px' })
      observer.observe(spinner)
    }
  }

  /**
   * Load more gallery items as per lightGallery docs
   * https://www.lightgalleryjs.com/demos/infinite-scrolling/
   */
  loadMoreItems (observer, spinner) {
    if (this.index < this.items.length) {
      // Append new thumbnails, distributing them across columns in round-robin order.
      // Using independent column containers means existing items in other columns are
      // never reflowed when a new batch is added.
      this.items
        .slice(this.index, this.index + PER_PAGE)
        .forEach(item => this.appendItem(item.html))
      this.index += PER_PAGE
      this.lightGallery.refresh()
    } else {
      // Remove the loading spinner and stop observing once all items are loaded
      observer.disconnect()
      spinner.remove()
    }
  }
}
const lgallery = new LGallery()

// ── Mobile hide/show header on scroll direction ──
;(function () {
  const DESKTOP_MIN_WIDTH = 768
  let lastScrollY = window.scrollY
  window.addEventListener('scroll', function () {
    if (window.innerWidth >= DESKTOP_MIN_WIDTH) return
    const header = document.getElementById('header')
    if (!header) return
    const currentScrollY = window.scrollY
    if (currentScrollY > lastScrollY && currentScrollY > 50) {
      // Scrolling down — hide the header
      header.classList.add('header-hidden')
    } else if (currentScrollY < lastScrollY) {
      // Scrolling up — show the header
      header.classList.remove('header-hidden')
    }
    lastScrollY = currentScrollY
  }, { passive: true })
})()
