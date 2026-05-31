import { useState, useEffect, useCallback, useMemo } from 'react'

// Auto-import all images
const allModules = import.meta.glob('./assets/**/*.{jpeg,jpg,png,webp}', { eager: true })

// Function to extract timestamp from filename
// Adjust this regex based on your actual filename format
function getImageTimestamp(filename) {
  // Try multiple date patterns (add more as needed)
  
  // Pattern 1: YYYYMMDD_HHMMSS (e.g., 20260531_174214.jpg)
  let match = filename.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/)
  if (match) {
    const [_, year, month, day, hour, minute, second] = match
    return new Date(year, month - 1, day, hour, minute, second).getTime()
  }
  
  // Pattern 2: YYYY-MM-DD_HH-MM-SS
  match = filename.match(/(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})/)
  if (match) {
    const [_, year, month, day, hour, minute, second] = match
    return new Date(year, month - 1, day, hour, minute, second).getTime()
  }
  
  // Pattern 3: Just YYYYMMDD (e.g., 20260531.jpg)
  match = filename.match(/(\d{4})(\d{2})(\d{2})/)
  if (match) {
    const [_, year, month, day] = match
    return new Date(year, month - 1, day).getTime()
  }
  
  // Pattern 4: Timestamp from Windows screenshot (Screenshot 2026-05-31 174214.png)
  match = filename.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2})(\d{2})(\d{2})/)
  if (match) {
    const [_, year, month, day, hour, minute, second] = match
    return new Date(year, month - 1, day, hour, minute, second).getTime()
  }
  
  // If no date pattern found, return 0 (will be sorted to the end)
  console.warn(`No date pattern found in: ${filename}`)
  return 0
}

// Function to get sorted images for a folder
function getSortedImages(folder) {
  const images = Object.entries(allModules)
    .filter(([path]) => path.includes(`/assets/${folder}/`))
    .map(([path, mod]) => {
      const filename = path.split('/').pop()
      const imageUrl = typeof mod === 'string' ? mod : mod.default
      const timestamp = getImageTimestamp(filename)
      
      return {
        url: imageUrl,
        filename,
        timestamp
      }
    })
    .filter(img => img.url)
    // Sort by timestamp descending (newest first)
    .sort((a, b) => b.timestamp - a.timestamp)
    .map(img => img.url)
  
  return images
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

  // Load and sort images on component mount
  useEffect(() => {
    // Small delay to ensure smooth loading
    setTimeout(() => {
      const sevenDays = getSortedImages('7days')
      const month = getSortedImages('this-month')
      
      setSevenDaysImages(sevenDays)
      setMonthImages(month)
      setLoading(false)
      
      // Debug logging to verify sorting
      console.log('7days images sorted:', sevenDays.slice(0, 3).map((_, i) => {
        const filename = Object.keys(allModules).find(path => 
          allModules[path].default === sevenDays[i] || allModules[path] === sevenDays[i]
        )?.split('/').pop()
        return filename
      }))
    }, 100)
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
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading images...</p>
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