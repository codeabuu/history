import { useState, useEffect, useCallback } from 'react'

// Auto-import all images
const allModules = import.meta.glob('./assets/**/*.{jpeg,jpg,png,webp}', { eager: true })

export default function History() {
  const [sevenDaysImages, setSevenDaysImages] = useState([])
  const [monthImages, setMonthImages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAll7Days, setShowAll7Days] = useState(false)
  const [showAllMonth, setShowAllMonth] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentArray, setCurrentArray] = useState([])
  const [touchStart, setTouchStart] = useState(null)
  const [activeSection, setActiveSection] = useState('7days')

  // Load manifest and images when component mounts
  useEffect(() => {
    async function loadImages() {
      try {
        // Load the manifest dynamically
        const manifestModule = await import('./assets/manifest.json')
        const manifest = manifestModule.default
        
        // Helper function to get images in manifest order
        const getOrderedImages = (folder) => {
          const key = folder === '7days' ? '7days' : 'this-month'
          const orderedFilenames = manifest[key] || []
          
          if (orderedFilenames.length > 0) {
            // Return images in the exact order from manifest (newest first)
            return orderedFilenames
              .map(filename => {
                const modKey = `./assets/${folder}/${filename}`
                const mod = allModules[modKey]
                return mod ? (mod.default || mod) : null
              })
              .filter(Boolean)
          }
          
          // Fallback: return unsorted images
          return Object.entries(allModules)
            .filter(([path]) => path.includes(`/assets/${folder}/`))
            .map(([, mod]) => (typeof mod === 'string' ? mod : mod.default))
            .filter(Boolean)
        }
        
        const sevenDays = getOrderedImages('7days')
        const month = getOrderedImages('this-month')
        
        setSevenDaysImages(sevenDays)
        setMonthImages(month)
        
        // Debug: Log the first few images to verify order
        console.log('7days images loaded:', sevenDays.length)
        console.log('First 7days image:', sevenDays[0])
        console.log('Month images loaded:', month.length)
        
      } catch (error) {
        console.error('Error loading manifest:', error)
        // Fallback: load images without manifest
        const sevenDays = Object.entries(allModules)
          .filter(([path]) => path.includes('/assets/7days/'))
          .map(([, mod]) => (typeof mod === 'string' ? mod : mod.default))
          .filter(Boolean)
        
        const month = Object.entries(allModules)
          .filter(([path]) => path.includes('/assets/this-month/'))
          .map(([, mod]) => (typeof mod === 'string' ? mod : mod.default))
          .filter(Boolean)
        
        setSevenDaysImages(sevenDays)
        setMonthImages(month)
      } finally {
        setLoading(false)
      }
    }
    
    loadImages()
  }, [])

  const openLightbox = useCallback((src, array, index) => {
    setCurrentArray(array)
    setCurrentIndex(index)
    setLightboxImage(src)
    window.history.pushState({ lightbox: true }, '')
  }, [])

  const closeLightbox = useCallback(() => {
    setLightboxImage(null)
    setCurrentArray([])
    setCurrentIndex(0)
    if (window.history.state?.lightbox) {
      window.history.back()
    }
  }, [])

  const goToNext = useCallback(() => {
    if (currentArray.length === 0) return
    const nextIndex = (currentIndex + 1) % currentArray.length
    setCurrentIndex(nextIndex)
    setLightboxImage(currentArray[nextIndex])
  }, [currentArray, currentIndex])

  const goToPrev = useCallback(() => {
    if (currentArray.length === 0) return
    const prevIndex = currentIndex === 0 ? currentArray.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    setLightboxImage(currentArray[prevIndex])
  }, [currentArray, currentIndex])

  useEffect(() => {
    const handlePopState = () => {
      if (lightboxImage) {
        setLightboxImage(null)
        setCurrentArray([])
        setCurrentIndex(0)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [lightboxImage])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxImage) return
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowRight') goToNext()
      if (e.key === 'ArrowLeft') goToPrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxImage, closeLightbox, goToNext, goToPrev])

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX)

  const handleTouchEnd = (e) => {
    if (!touchStart) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNext() : goToPrev()
    }
    setTouchStart(null)
  }

  const currentImages = activeSection === '7days' ? sevenDaysImages : monthImages
  const showAll = activeSection === '7days' ? showAll7Days : showAllMonth
  const setShowAll = activeSection === '7days' ? setShowAll7Days : setShowAllMonth

  if (loading) {
    return (
      <div className="history-container">
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <div>Loading images...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="nav-btn nav-left"
            onClick={(e) => { e.stopPropagation(); goToPrev() }}
          >
            ‹
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>✕</button>
            <div className="image-counter">
              {currentIndex + 1} / {currentArray.length}
            </div>
            <img src={lightboxImage} alt="Full view" className="lightbox-img" />
          </div>

          <button
            className="nav-btn nav-right"
            onClick={(e) => { e.stopPropagation(); goToNext() }}
          >
            ›
          </button>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="tab-container">
        <button
          className={`tab-btn ${activeSection === '7days' ? 'active' : ''}`}
          onClick={() => setActiveSection('7days')}
        >
          <span className="tab-icon">🔥</span>
          <span className="tab-text">This Week</span>
          <span className="tab-count">{sevenDaysImages.length}</span>
        </button>
        <button
          className={`tab-btn ${activeSection === 'month' ? 'active' : ''}`}
          onClick={() => setActiveSection('month')}
        >
          <span className="tab-icon">⌛</span>
          <span className="tab-text">This Month</span>
          <span className="tab-count">{monthImages.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="content-area">
        {currentImages.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <p>No images yet</p>
          </div>
        ) : (
          <>
            {/* Featured Image (latest) */}
            <div
              className="featured-card"
              onClick={() => openLightbox(currentImages[0], currentImages, 0)}
            >
              <img
                src={currentImages[0]}
                alt="Latest"
                className="featured-img"
                loading="eager"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.parentElement.classList.add('no-image-featured')
                }}
              />
              <div className="featured-badge">LATEST</div>
            </div>

            {/* Grid for remaining images */}
            {currentImages.length > 1 && (
              <div className="image-grid">
                {currentImages.slice(1, showAll ? currentImages.length : 4).map((src, index) => (
                  <div
                    key={index + 1}
                    className="grid-item"
                    onClick={() => openLightbox(src, currentImages, index + 1)}
                  >
                    <img
                      src={src}
                      alt={`Result ${index + 2}`}
                      className="grid-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('no-image-grid')
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* See More */}
            {currentImages.length > 4 && (
              <button
                className="see-more-btn"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? (
                  <>
                    <span>Show Less</span>
                    <span className="arrow up">▲</span>
                  </>
                ) : (
                  <>
                    <span>View All ({currentImages.length - 4} more)</span>
                    <span className="arrow">▼</span>
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}