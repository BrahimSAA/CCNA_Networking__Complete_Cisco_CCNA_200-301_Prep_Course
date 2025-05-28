// Global variables
const titleContent = document.title;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
  loadCompletedSections();
  setupEventListeners();
  setupNavigation();
  setupFAB();
  updateCharacterCounters();
});

function setupEventListeners() {
  // Export/Import buttons
  const exportButton = document.getElementById("exportButton");
  const importButton = document.getElementById("importButton");
  const importDataButton = document.getElementById("importDataButton");

  if (exportButton) {
    exportButton.addEventListener("click", exportData);
  }

  if (importDataButton) {
    importDataButton.addEventListener("click", () => importButton?.click());
  }

  if (importButton) {
    importButton.addEventListener("change", handleFileImport);
  }

  // Setup all functionality
  setupSectionListeners();
  setupNotesTools();
}

function setupSectionListeners() {
  const pagePath = window.location.pathname;

  document.querySelectorAll(".video-section").forEach((section) => {
    const completeButton = section.querySelector(".complete-btn");
    const unmarkButton = section.querySelector(".unmark-btn");
    const notesTextArea = section.querySelector(".notes-input");

    if (completeButton) {
      completeButton.addEventListener("click", () => {
        try {
          localStorage.setItem(`${pagePath}-${section.id}`, "completed");
        } catch (error) {
          console.warn('LocalStorage not available');
          section.dataset.completed = "true";
        }
        updateSectionStyle(section, true);
      });
    }

    if (unmarkButton) {
      unmarkButton.addEventListener("click", () => {
        try {
          localStorage.removeItem(`${pagePath}-${section.id}`);
        } catch (error) {
          console.warn('LocalStorage not available');
          delete section.dataset.completed;
        }
        updateSectionStyle(section, false);
      });
    }

    if (notesTextArea) {
      notesTextArea.addEventListener("input", (e) => {
        updateCharacterCounter(e.target);
        try {
          localStorage.setItem(`${pagePath}-notes-${section.id}`, e.target.value);
        } catch (error) {
          console.warn('LocalStorage not available');
        }
      });
    }
  });
}

function setupNavigation() {
  const navCarousel = document.getElementById("navCarousel");
  const leftScroll = document.getElementById("leftScroll");
  const rightScroll = document.getElementById("rightScroll");

  if (!navCarousel || !leftScroll || !rightScroll) return;

  // Auto-scroll to active item on page load
  const activeItem = navCarousel.querySelector('.nav-item.active');
  if (activeItem) {
    activeItem.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center'
    });
  }

  // Function to update scroll button states
  function updateScrollButtons() {
    const scrollLeft = navCarousel.scrollLeft;
    const scrollWidth = navCarousel.scrollWidth;
    const clientWidth = navCarousel.clientWidth;

    leftScroll.disabled = scrollLeft <= 0;
    rightScroll.disabled = scrollLeft >= scrollWidth - clientWidth - 1;
  }

  // Scroll functions
  function scrollLeftNav() {
    if (!leftScroll.disabled) {
      navCarousel.scrollBy({ left: -200, behavior: "smooth" });
    }
  }

  function scrollRightNav() {
    if (!rightScroll.disabled) {
      navCarousel.scrollBy({ left: 200, behavior: "smooth" });
    }
  }

  // Event listeners
  leftScroll.addEventListener("click", scrollLeftNav);
  rightScroll.addEventListener("click", scrollRightNav);
  navCarousel.addEventListener('scroll', updateScrollButtons);
  window.addEventListener('resize', updateScrollButtons);

  // Update buttons when navigation items are clicked
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
      });
      e.target.closest('.nav-item').classList.add('active');
      setTimeout(updateScrollButtons, 100);
    });
  });

  updateScrollButtons();
}

function setupFAB() {
  const mainFab = document.getElementById("mainFab");
  const fabMenu = document.querySelector(".fab-menu");

  if (mainFab && fabMenu) {
    mainFab.addEventListener("click", () => {
      fabMenu.classList.toggle("active");
    });

    // Close FAB menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!fabMenu.contains(e.target)) {
        fabMenu.classList.remove("active");
      }
    });
  }
}

function updateCharacterCounters() {
  document.querySelectorAll(".notes-input").forEach(textarea => {
    updateCharacterCounter(textarea);
  });
}

function updateCharacterCounter(textarea) {
  const section = textarea.closest(".video-section");
  const counter = section?.querySelector(".char-count");
  if (counter) {
    counter.textContent = textarea.value.length;
  }
}

function exportData() {
  const pagePath = window.location.pathname;
  const localStorageData = {};

  try {
    // Export all localStorage data for current page
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(pagePath)) {
        localStorageData[key] = localStorage.getItem(key);
      }
    }
  } catch (error) {
    console.warn('LocalStorage not available for export');
    alert('Export functionality requires localStorage support');
    return;
  }

  const blob = new Blob([JSON.stringify(localStorageData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${titleContent.replace(/[^a-z0-9]/gi, '_')}_backup.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const pagePath = window.location.pathname;
  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const jsonData = JSON.parse(e.target.result);

      // Import all data for current page
      Object.entries(jsonData).forEach(([key, value]) => {
        if (key.startsWith(pagePath)) {
          try {
            localStorage.setItem(
              key,
              typeof value === "string" ? value.replace(/\\n/g, "\n") : value
            );
          } catch (error) {
            console.warn('LocalStorage not available for import');
          }
        }
      });

      alert("Data imported successfully!");
      location.reload(); // Reload to apply imported data
    } catch (error) {
      console.error("Import error:", error);
      alert("Error importing data. Please check the file format.");
    }
  };
  reader.readAsText(file);
}

function loadCompletedSections() {
  const pagePath = window.location.pathname;

  document.querySelectorAll(".video-section").forEach((section) => {
    const sectionId = section.id;

    try {
      // Load completion status
      if (localStorage.getItem(`${pagePath}-${sectionId}`)) {
        updateSectionStyle(section, true);
      }

      // Load notes
      const notes = localStorage.getItem(`${pagePath}-notes-${sectionId}`);
      const notesTextArea = section.querySelector(".notes-input");
      if (notes && notesTextArea) {
        notesTextArea.value = notes;
        updateCharacterCounter(notesTextArea);
      }
    } catch (error) {
      console.warn('LocalStorage not available for loading');
      // Fallback to dataset attributes
      if (section.dataset.completed) {
        updateSectionStyle(section, true);
      }
    }
  });
}

function updateSectionStyle(section, isComplete) {
  if (isComplete) {
    section.classList.add("completed");
    const statusDot = section.querySelector(".status-dot");
    const statusText = section.querySelector(".status-text");
    if (statusDot && statusText) {
      statusDot.style.background = "var(--success-color)";
      statusText.textContent = "Completed";
    }
  } else {
    section.classList.remove("completed");
    const statusDot = section.querySelector(".status-dot");
    const statusText = section.querySelector(".status-text");
    if (statusDot && statusText) {
      statusDot.style.background = "var(--accent-color)";
      statusText.textContent = "Ready to watch";
    }
  }
}

function navigateToSection(direction, currentIndex) {
  const sections = document.querySelectorAll('.video-section');
  let targetIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

  if (targetIndex >= 0 && targetIndex < sections.length) {
    const headerHeight = document.querySelector('header')?.offsetHeight || 0;
    const targetSection = sections[targetIndex];
    const elementPosition = targetSection.getBoundingClientRect().top;
    const sectionHeight = targetSection.offsetHeight;
    const viewportHeight = window.innerHeight;

    // Calculate position to center the section in viewport
    const centerOffset = (viewportHeight - sectionHeight) / 2;
    const offsetPosition = elementPosition + window.pageYOffset - headerHeight - centerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    });
  } else if (direction === 'next' && targetIndex >= sections.length) {
    // Try to navigate to next page
    const nextPageBtn = document.querySelector('.right-nav');
    if (nextPageBtn && !nextPageBtn.style.display.includes('none')) {
      nextPageBtn.click();
    } else {
      alert('You are at the last video!');
    }
  } else {
    alert('You are at the first video!');
  }
}

function navigate(targetPage) {
  // Show loading overlay
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.classList.add("active");
  }

  // Navigate after short delay to show loading
  setTimeout(() => {
    window.location.href = targetPage;
  }, 300);
}

// Smooth scrolling for anchor links
document.addEventListener('click', function (e) {
  if (e.target.closest('a[href^="#"]')) {
    e.preventDefault();
    const link = e.target.closest('a[href^="#"]');
    const targetId = link.getAttribute('href').slice(1);
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      const headerHeight = document.querySelector('header')?.offsetHeight || 0;
      const elementPosition = targetElement.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight - 20;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
});

// Keyboard navigation
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey || e.metaKey) {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        document.querySelector('.left-nav')?.click();
        break;
      case 'ArrowRight':
        e.preventDefault();
        document.querySelector('.right-nav')?.click();
        break;
      case 's':
        e.preventDefault();
        document.getElementById('exportButton')?.click();
        break;
    }
  }
});

// Notes Tools Functionality
function setupNotesTools() {
  document.querySelectorAll('.notes-container').forEach(container => {
    const notesInput = container.querySelector('.notes-input');
    const boldBtn = container.querySelector('[id^="bold-"]');
    const italicBtn = container.querySelector('[id^="italic-"]');
    const clearBtn = container.querySelector('[id^="clear-"]');

    if (boldBtn && notesInput) {
      boldBtn.addEventListener('click', () => {
        const start = notesInput.selectionStart;
        const end = notesInput.selectionEnd;
        const selectedText = notesInput.value.substring(start, end);

        if (selectedText) {
          const beforeText = notesInput.value.substring(0, start);
          const afterText = notesInput.value.substring(end);
          notesInput.value = beforeText + '**' + selectedText + '**' + afterText;
          notesInput.focus();
          notesInput.setSelectionRange(start + 2, end + 2);
        }
        updateCharacterCounter(notesInput);

        // Save to localStorage
        const section = notesInput.closest('.video-section');
        const pagePath = window.location.pathname;
        try {
          localStorage.setItem(`${pagePath}-notes-${section.id}`, notesInput.value);
        } catch (error) {
          console.warn('LocalStorage not available');
        }
      });
    }

    if (italicBtn && notesInput) {
      italicBtn.addEventListener('click', () => {
        const start = notesInput.selectionStart;
        const end = notesInput.selectionEnd;
        const selectedText = notesInput.value.substring(start, end);

        if (selectedText) {
          const beforeText = notesInput.value.substring(0, start);
          const afterText = notesInput.value.substring(end);
          notesInput.value = beforeText + '*' + selectedText + '*' + afterText;
          notesInput.focus();
          notesInput.setSelectionRange(start + 1, end + 1);
        }
        updateCharacterCounter(notesInput);

        // Save to localStorage
        const section = notesInput.closest('.video-section');
        const pagePath = window.location.pathname;
        try {
          localStorage.setItem(`${pagePath}-notes-${section.id}`, notesInput.value);
        } catch (error) {
          console.warn('LocalStorage not available');
        }
      });
    }

    if (clearBtn && notesInput) {
      clearBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all notes for this video?')) {
          notesInput.value = '';
          updateCharacterCounter(notesInput);

          // Remove from localStorage
          const section = notesInput.closest('.video-section');
          const pagePath = window.location.pathname;
          try {
            localStorage.removeItem(`${pagePath}-notes-${section.id}`);
          } catch (error) {
            console.warn('LocalStorage not available');
          }

          notesInput.focus();
        }
      });
    }
  });
}
