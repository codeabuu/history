import { useState, useEffect, useCallback } from 'react'

// Auto-import all images
const allModules = import.meta.glob('./assets/**/*.{jpeg,jpg,png,webp}', { eager: true })

// Image cache to prevent reloading
const imageCache = new Map()

function preloadImage(src) {
  if (!imageCache.has(src)) {
    const img = new Image()
    img.src = src
    imageCache.set(src, img)
  }
}

function extractDate(filename) {
  // Matches "WhatsApp Image 2026-06-02 at 18.21.04"
  const match = filename.match(/(\d{4}-\d{2}-\d{2}) at (\d{2})\.(\d{2})\.(\d{2})/)
  if (match) {
    const [, date, hh, mm, ss] = match
    return new Date(`${date}T${hh}:${mm}:${ss}`).getTime()
  }
  return 0 // non-WhatsApp files go to end
}

function getImagesByFolder(folder) {
  return Object.entries(allModules)
    .filter(([path]) => path.includes(`/assets/${folder}/`))
    .map(([path, mod]) => ({
      url: mod.default || mod,
      filename: path.split('/').pop()
    }))
    .sort((a, b) => extractDate(b.filename) - extractDate(a.filename))
    .map(item => item.url)
}

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
  const [failedImages, setFailedImages] = useState(new Set())

  useEffect(() => {
    const sevenDays = getImagesByFolder('7days')
    const month = getImagesByFolder('this-month')

    setSevenDaysImages(sevenDays)
    setMonthImages(month)

    sevenDays.slice(0, 5).forEach(preloadImage)
    month.slice(0, 5).forEach(preloadImage)

    setLoading(false)
  }, [])

  const openLightbox = useCallback((src, array, index) => {
    setCurrentArray(array)
    setCurrentIndex(index)
    setLightboxImage(src)
    window.history.pushState({ lightbox: true }, '')
    if (array[index + 1]) preloadImage(array[index + 1])
    if (array[index - 1]) preloadImage(array[index - 1])
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
    const nextNextIndex = (nextIndex + 1) % currentArray.length
    if (currentArray[nextNextIndex]) preloadImage(currentArray[nextNextIndex])
  }, [currentArray, currentIndex])

  const goToPrev = useCallback(() => {
    if (currentArray.length === 0) return
    const prevIndex = currentIndex === 0 ? currentArray.length - 1 : currentIndex - 1
    setCurrentIndex(prevIndex)
    setLightboxImage(currentArray[prevIndex])
    const prevPrevIndex = prevIndex === 0 ? currentArray.length - 1 : prevIndex - 1
    if (currentArray[prevPrevIndex]) preloadImage(currentArray[prevPrevIndex])
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

  const handleImageError = useCallback((imageSrc) => {
    setFailedImages(prev => new Set(prev).add(imageSrc))
  }, [])

  const currentImages = activeSection === '7days' ? sevenDaysImages : monthImages
  const showAll = activeSection === '7days' ? showAll7Days : showAllMonth
  const setShowAll = activeSection === '7days' ? setShowAll7Days : setShowAllMonth

  if (loading) {
    return (
      <div className="history-container">
        <div style={{
          textAlign: 'center',
          padding: '50px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div>Loading images...</div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="history-container">
      {/* Lightbox */}
      {lightboxImage && !failedImages.has(lightboxImage) && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            className="nav-btn nav-left"
            onClick={(e) => { e.stopPropagation(); goToPrev() }}
            aria-label="Previous image"
          >
            ‹
          </button>

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox} aria-label="Close">
              ✕
            </button>
            <div className="image-counter">
              {currentIndex + 1} / {currentArray.length}
            </div>
            <img
              src={lightboxImage}
              alt={`Full view ${currentIndex + 1}`}
              className="lightbox-img"
              loading="eager"
              onError={(e) => {
                e.target.style.display = 'none'
                handleImageError(lightboxImage)
              }}
            />
          </div>

          <button
            className="nav-btn nav-right"
            onClick={(e) => { e.stopPropagation(); goToNext() }}
            aria-label="Next image"
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
            {currentImages[0] && !failedImages.has(currentImages[0]) && (
              <div
                className="featured-card"
                onClick={() => openLightbox(currentImages[0], currentImages, 0)}
              >
                <img
                  src={currentImages[0]}
                  alt="Latest"
                  className="featured-img"
                  loading="eager"
                  fetchPriority="high"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    handleImageError(currentImages[0])
                    e.target.parentElement.classList.add('no-image-featured')
                  }}
                />
                <div className="featured-badge">LATEST</div>
              </div>
            )}

            {/* Grid for remaining images */}
            {currentImages.length > 1 && (
              <div className="image-grid">
                {currentImages.slice(1, showAll ? currentImages.length : 5)
                  .filter(src => !failedImages.has(src))
                  .map((src, index) => (
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
                        fetchPriority="low"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          handleImageError(src)
                          e.target.parentElement.classList.add('no-image-grid')
                        }}
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* See More */}
            {currentImages.length > 5 && (
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
                    <span>View All ({currentImages.length - 5} more)</span>
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