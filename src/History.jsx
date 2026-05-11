import { useState, useEffect, useCallback } from 'react'

// Auto-import all images from src/assets/ at BUILD TIME
const sevenDaysModules = import.meta.glob('./assets/7days/*.{jpeg,jpg,png,webp}', { eager: true, as: 'url' })
const monthModules = import.meta.glob('./assets/this-month/*.{jpeg,jpg,png,webp}', { eager: true, as: 'url' })

// Extract URLs - Vite handles paths automatically
const sevenDaysImages = Object.values(sevenDaysModules)
const monthImages = Object.values(monthModules)

export default function History() {
  const [showAll7Days, setShowAll7Days] = useState(false)
  const [showAllMonth, setShowAllMonth] = useState(false)
  const [lightboxImage, setLightboxImage] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentArray, setCurrentArray] = useState([])
  const [touchStart, setTouchStart] = useState(null)

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

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (!touchStart) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNext() : goToPrev()
    }
    setTouchStart(null)
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

      {/* Past 7 Days */}
      <div className="sticky-section">
        <div className="sticky-header">
          <span>🔥 Past 7 Days ({sevenDaysImages.length})</span>
        </div>

        <div className="section-content">
          {sevenDaysImages.length === 0 ? (
            <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>No images yet</p>
          ) : (
            <>
              <div className="horizontal-scroll">
                {sevenDaysImages.slice(0, 3).map((src, index) => (
                  <div 
                    key={index} 
                    className="image-card-small" 
                    onClick={() => openLightbox(src, sevenDaysImages, index)}
                  >
                    <img
                      src={src}
                      alt={`Prediction ${index + 1}`}
                      className="img-small"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('no-image')
                      }}
                    />
                  </div>
                ))}
              </div>

              {sevenDaysImages.length > 3 && (
                <button
                  className="see-more-btn"
                  onClick={() => setShowAll7Days(!showAll7Days)}
                >
                  {showAll7Days ? 'Show Less' : 'See More'} ({sevenDaysImages.length - 3} more)
                  <span className={`arrow ${showAll7Days ? 'up' : ''}`}>▼</span>
                </button>
              )}

              {showAll7Days && (
                <div className="vertical-list">
                  {sevenDaysImages.slice(3).map((src, index) => (
                    <div 
                      key={index + 3} 
                      className="image-card-large" 
                      onClick={() => openLightbox(src, sevenDaysImages, index + 3)}
                    >
                      <img
                        src={src}
                        alt={`Prediction ${index + 4}`}
                        className="img-large"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.classList.add('no-image-large')
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="divider" />

      {/* This Month */}
      <div className="sticky-section">
        <div className="sticky-header">
          <span>📅 This Month ({monthImages.length})</span>
        </div>

        <div className="section-content">
          {monthImages.length === 0 ? (
            <p style={{color: '#666', textAlign: 'center', padding: '20px'}}>No images yet</p>
          ) : (
            <>
              <div className="horizontal-scroll">
                {monthImages.slice(0, 3).map((src, index) => (
                  <div 
                    key={index} 
                    className="image-card-small" 
                    onClick={() => openLightbox(src, monthImages, index)}
                  >
                    <img
                      src={src}
                      alt={`Result ${index + 1}`}
                      className="img-small"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.parentElement.classList.add('no-image')
                      }}
                    />
                  </div>
                ))}
              </div>

              {monthImages.length > 3 && (
                <button
                  className="see-more-btn"
                  onClick={() => setShowAllMonth(!showAllMonth)}
                >
                  {showAllMonth ? 'Show Less' : 'See More'} ({monthImages.length - 3} more)
                  <span className={`arrow ${showAllMonth ? 'up' : ''}`}>▼</span>
                </button>
              )}

              {showAllMonth && (
                <div className="vertical-list">
                  {monthImages.slice(3).map((src, index) => (
                    <div 
                      key={index + 3} 
                      className="image-card-large" 
                      onClick={() => openLightbox(src, monthImages, index + 3)}
                    >
                      <img
                        src={src}
                        alt={`Result ${index + 4}`}
                        className="img-large"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.parentElement.classList.add('no-image-large')
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}