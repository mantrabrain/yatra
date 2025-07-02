// trip.js - Yatra Itinerary Builder Logic
// Assumes globalActivities is defined in the page before this script loads

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab functionality
    initTabs();
    
    // Initialize itinerary functionality
    initItinerary();
    
    // Form submission
    const form = document.getElementById('trip-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    
    // Auto-save functionality
    const inputs = document.querySelectorAll('.form-input, .form-select, .form-textarea');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            // Add auto-save indicator
            console.log('Auto-saving...', this.value);
        });
    });

    // Initialize SortableJS for itinerary days
    var itineraryDays = document.getElementById('itinerary-days');
    if (itineraryDays && typeof Sortable !== 'undefined') {
        new Sortable(itineraryDays, {
            animation: 150,
            handle: '.day-header',
            onEnd: function () {
                updateDayNumbers();
            }
        });
    }

    // Expand All / Collapse All functionality
    const toggleExpandCollapseLink = document.getElementById('toggle-expand-collapse-link');
    const expandCollapseText = document.getElementById('expand-collapse-text');
    const expandCollapseIcon = document.getElementById('expand-collapse-icon');
    
    function updateToggleLinkText() {
        const allContents = document.querySelectorAll('.itinerary-day .day-content');
        const anyOpen = Array.from(allContents).some(content => content.classList.contains('active'));
        if (expandCollapseText) {
            expandCollapseText.textContent = anyOpen ? 'Collapse All' : 'Expand All';
        }
        if (expandCollapseIcon) {
            expandCollapseIcon.innerHTML = anyOpen
                ? '<svg id="collapse-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 15L12 9L18 15" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                : '<svg id="expand-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        }
    }
    
    if (toggleExpandCollapseLink) {
        toggleExpandCollapseLink.addEventListener('click', function(e) {
            e.preventDefault();
            const allContents = document.querySelectorAll('.itinerary-day .day-content');
            const allArrows = document.querySelectorAll('.itinerary-day .toggle-arrow');
            const anyOpen = Array.from(allContents).some(content => content.classList.contains('active'));
            if (anyOpen) {
                allContents.forEach(content => content.classList.remove('active'));
                allArrows.forEach(arrow => arrow.classList.remove('rotated'));
            } else {
                allContents.forEach(content => content.classList.add('active'));
                allArrows.forEach(arrow => arrow.classList.add('rotated'));
            }
            updateToggleLinkText();
        });
    }
    
    // Update link text on page load and after adding/removing days
    updateToggleLinkText();
    
    // Also call updateToggleLinkText after addItineraryDay and removeItineraryDay
    const origAddItineraryDay = window.addItineraryDay;
    window.addItineraryDay = function() {
        origAddItineraryDay.apply(this, arguments);
        updateToggleLinkText();
    };
    
    const origRemoveItineraryDay = window.removeItineraryDay;
    window.removeItineraryDay = function() {
        origRemoveItineraryDay.apply(this, arguments);
        updateToggleLinkText();
    };
    
    // Add first day button functionality
    var firstDayBtn = document.getElementById('add-first-itinerary-day-btn');
    if (firstDayBtn) {
        firstDayBtn.addEventListener('click', function() {
            addItineraryDay();
        });
    }
    
    // Tab accessibility: update aria-selected on tab switch
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            tabButtons.forEach(b => b.setAttribute('aria-selected', 'false'));
            this.setAttribute('aria-selected', 'true');
            document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            tabButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Inline validation feedback
    const tripForm = document.getElementById('trip-form');
    if (tripForm) {
        tripForm.addEventListener('submit', function(e) {
            let valid = true;
            this.querySelectorAll('[required]').forEach(function(input) {
                if (!input.value.trim()) {
                    valid = false;
                    input.classList.add('is-invalid');
                    if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('form-error')) {
                        const error = document.createElement('div');
                        error.className = 'form-error';
                        error.textContent = 'This field is required';
                        input.parentNode.appendChild(error);
                    }
                } else {
                    input.classList.remove('is-invalid');
                    if (input.nextElementSibling && input.nextElementSibling.classList.contains('form-error')) {
                        input.nextElementSibling.remove();
                    }
                }
            });
            if (!valid) e.preventDefault();
        });
    }

    // Add this at the top or after DOMContentLoaded
    if (!document.getElementById('activity-modal')) {
        const modal = document.createElement('div');
        modal.id = 'activity-modal';
        modal.className = 'activity-modal';
        modal.innerHTML = `
            <div class="activity-modal-backdrop"></div>
            <div class="activity-modal-content">
                <h3>Select Activities</h3>
                <div class="activity-list" id="activity-list-modal"></div>
                <div class="activity-modal-actions">
                    <button type="button" class="btn btn-secondary" id="activity-modal-cancel">Cancel</button>
                    <button type="button" class="btn btn-primary" id="activity-modal-save">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    let currentActivityDay = null;

    function openActivitySelector(dayNumber) {
        currentActivityDay = dayNumber;
        const modal = document.getElementById('activity-modal');
        console.log('openActivitySelector called, modal:', modal);
        if (!modal) {
            console.error('Modal not found in DOM!');
            return;
        }
        // Populate activities
        const activityList = document.getElementById('activity-list-modal');
        activityList.innerHTML = '';
        if (window.yatraActivities && Array.isArray(window.yatraActivities)) {
            window.yatraActivities.forEach(activity => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.value = activity.id;
                checkbox.id = `modal-activity-${activity.id}`;
                // Pre-check if already selected
                const hiddenInput = document.getElementById(`activity-ids-${dayNumber}`);
                if (hiddenInput && hiddenInput.value.split(',').includes(String(activity.id))) {
                    checkbox.checked = true;
                }
                const label = document.createElement('label');
                label.htmlFor = checkbox.id;
                label.textContent = activity.title;
                const wrapper = document.createElement('div');
                wrapper.className = 'activity-modal-item';
                wrapper.appendChild(checkbox);
                wrapper.appendChild(label);
                activityList.appendChild(wrapper);
            });
        } else {
            activityList.innerHTML = '<div>No activities found.</div>';
        }
        modal.style.display = 'flex';
        console.log('Modal display set to:', modal.style.display);
    }
    window.openActivitySelector = openActivitySelector;

    document.addEventListener('DOMContentLoaded', function() {
        const modal = document.getElementById('activity-modal');
        if (!modal) return;
        // Cancel button
        document.getElementById('activity-modal-cancel').onclick = function() {
            modal.style.display = 'none';
        };
        // Save button
        document.getElementById('activity-modal-save').onclick = function() {
            if (currentActivityDay) {
                const checked = modal.querySelectorAll('.activity-modal-item input:checked');
                const ids = Array.from(checked).map(cb => cb.value);
                // Update hidden input
                const hiddenInput = document.getElementById(`activity-ids-${currentActivityDay}`);
                if (hiddenInput) hiddenInput.value = ids.join(',');
                // Update visible list (optional: render activity titles)
                const activitiesList = document.getElementById(`activities-list-${currentActivityDay}`);
                if (activitiesList) {
                    activitiesList.innerHTML = '';
                    ids.forEach(id => {
                        const activity = window.yatraActivities.find(a => String(a.id) === String(id));
                        if (activity) {
                            const div = document.createElement('div');
                            div.className = 'selected-activity';
                            div.textContent = activity.title;
                            activitiesList.appendChild(div);
                        }
                    });
                }
            }
            modal.style.display = 'none';
        };
        // Close modal on backdrop click
        modal.querySelector('.activity-modal-backdrop').onclick = function() {
            modal.style.display = 'none';
        };
    });

    // Add event delegation for .add-activity-btn to #itinerary-days:
    if (itineraryDays) {
        itineraryDays.addEventListener('click', function(e) {
            const btn = e.target.closest('.add-activity-btn');
            if (btn && btn.id && btn.id.startsWith('add-activity-btn-')) {
                const dayNum = btn.id.replace('add-activity-btn-', '');
                console.log('Delegated: Add Activity button clicked for day', dayNum);
                openActivitySelector(dayNum);
            }
        });
    }
});

function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked button
    const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

function initItinerary() {
    const addDayBtn = document.getElementById('add-day-btn');
    const itineraryDays = document.getElementById('itinerary-days');
    
    if (addDayBtn && itineraryDays) {
        addDayBtn.addEventListener('click', addItineraryDay);
        
        // Load existing itinerary if editing
        // Note: This will be handled by PHP data passed to the page
        // const existingItinerary = window.existingItinerary || null;
        // if (existingItinerary && Array.isArray(existingItinerary)) {
        //     existingItinerary.forEach((day, index) => {
        //         addItineraryDay(day, index + 1);
        //     });
        // }
    }
}

function addItineraryDay(dayData = null, dayNumber = null) {
    const itineraryDays = document.getElementById('itinerary-days');
    const itineraryEmpty = document.getElementById('itinerary-empty');
    const dayCount = itineraryDays.children.length + 1;
    const dayNum = dayNumber || dayCount;
    if (itineraryEmpty) {
        itineraryEmpty.style.display = 'none';
    }
    const dayElement = document.createElement('div');
    dayElement.className = 'itinerary-day';
    dayElement.dataset.day = dayNum;
    dayElement.innerHTML = `
        <div class="day-header" onclick="toggleDay(${dayNum})">
            <span class="drag-handle" title="Drag to reorder">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="5" cy="5" r="1.5" fill="#94a3b8"/>
                    <circle cx="5" cy="10" r="1.5" fill="#94a3b8"/>
                    <circle cx="5" cy="15" r="1.5" fill="#94a3b8"/>
                    <circle cx="10" cy="5" r="1.5" fill="#94a3b8"/>
                    <circle cx="10" cy="10" r="1.5" fill="#94a3b8"/>
                    <circle cx="10" cy="15" r="1.5" fill="#94a3b8"/>
                </svg>
            </span>
            <div class="day-info">
                <div class="day-number">Day ${dayNum}</div>
                <div class="day-title">${dayData ? dayData.title || 'New Day' : 'New Day'}</div>
                <div class="day-summary">
                    <span class="location">${dayData && dayData.location ? dayData.location : 'Location TBD'}</span>
                </div>
            </div>
            <div class="day-actions">
                <button type="button" class="action-btn edit-btn" onclick="editDay(${dayNum})" title="Edit Day">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M18.5 2.50023C18.8978 2.10297 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10297 21.5 2.50023C21.8971 2.89792 22.1212 3.43767 22.1212 4.00023C22.1212 4.56279 21.8971 5.10254 21.5 5.50023L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <button type="button" class="action-btn remove-btn" onclick="removeItineraryDay(${dayNum})" title="Remove Day">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M10 11V17M14 11V17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
                <span class="toggle-arrow">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </span>
            </div>
        </div>
        <div class="day-content">
            <div class="form-section-header">
                <h5>Day ${dayNum} Details</h5>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="day-title-${dayNum}">Day Title</label>
                    <input type="text" class="form-input" id="day-title-${dayNum}" name="itinerary[${dayNum}][title]" value="${dayData ? dayData.title || '' : ''}" placeholder="Enter day title">
                </div>
                <div class="form-group">
                    <label class="form-label" for="day-location-${dayNum}">Location</label>
                    <input type="text" class="form-input" id="day-location-${dayNum}" name="itinerary[${dayNum}][location]" value="${dayData ? dayData.location || '' : ''}" placeholder="Enter location">
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="day-description-${dayNum}">Description</label>
                    <textarea class="form-textarea" id="day-description-${dayNum}" name="itinerary[${dayNum}][description]" placeholder="Describe what happens on this day">${dayData ? dayData.description || '' : ''}</textarea>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="day-accommodation-${dayNum}">Accommodation</label>
                    <input type="text" class="form-input" id="day-accommodation-${dayNum}" name="itinerary[${dayNum}][accommodation]" value="${dayData ? dayData.accommodation || '' : ''}" placeholder="Hotel or accommodation details">
                </div>
                <div class="form-group">
                    <label class="form-label" for="day-meals-${dayNum}">Meals Included</label>
                    <div class="meals-tag-container" data-day="${dayNum}">
                        <div class="meals-tag-input" onclick="toggleMealsDropdown(${dayNum})">
                            <div class="meals-tags" id="meals-tags-${dayNum}">
                                ${getMealsTags(dayData ? dayData.meals : [], dayNum)}
                            </div>
                            <span class="meals-placeholder">Select meals...</span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </div>
                        <div class="meals-dropdown" id="meals-dropdown-${dayNum}">
                            <div class="meal-option" data-value="breakfast" onclick="toggleMealTag(${dayNum}, 'breakfast')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                                Breakfast
                            </div>
                            <div class="meal-option" data-value="brunch" onclick="toggleMealTag(${dayNum}, 'brunch')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                                Brunch
                            </div>
                            <div class="meal-option" data-value="lunch" onclick="toggleMealTag(${dayNum}, 'lunch')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                                Lunch
                            </div>
                            <div class="meal-option" data-value="tea" onclick="toggleMealTag(${dayNum}, 'tea')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                                Tea/Coffee
                            </div>
                            <div class="meal-option" data-value="snack" onclick="toggleMealTag(${dayNum}, 'snack')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                                Snack
                            </div>
                            <div class="meal-option" data-value="dinner" onclick="toggleMealTag(${dayNum}, 'dinner')">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" fill="currentColor"/>
                                </svg>
                                Dinner
                            </div>
                        </div>
                        <input type="hidden" id="meals-input-${dayNum}" name="itinerary[${dayNum}][meals]" value="${getMealsValue(dayData ? dayData.meals : [])}">
                    </div>
                </div>
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label" for="day-transport-${dayNum}">Transport</label>
                    <input type="text" class="form-input" id="day-transport-${dayNum}" name="itinerary[${dayNum}][transport]" value="${dayData ? dayData.transport || '' : ''}" placeholder="Transport details">
                </div>
                <div class="form-group">
                    <label class="form-label" for="day-duration-${dayNum}">Duration (hours)</label>
                    <input type="number" class="form-input" id="day-duration-${dayNum}" name="itinerary[${dayNum}][duration]" value="${dayData ? dayData.duration || '' : ''}" placeholder="Activity duration">
                </div>
            </div>
            
            <div class="form-section-header">
                <h5>Activities for Day ${dayNum}</h5>
            </div>
            
            <div id="activities-list-${dayNum}"></div>
            <button type="button" class="yatra-btn yatra-btn-secondary add-activity-btn" id="add-activity-btn-${dayNum}">+ Add Activity</button>
            <input type="hidden" name="itinerary[${dayNum}][activity_ids]" id="activity-ids-${dayNum}" value="${dayData && dayData.activity_ids ? dayData.activity_ids.join(',') : ''}">
        </div>
    `;
    itineraryDays.appendChild(dayElement);
    
    // Add event listeners for real-time updates
    const titleInput = document.getElementById(`day-title-${dayNum}`);
    const locationInput = document.getElementById(`day-location-${dayNum}`);
    
    if (titleInput) {
        titleInput.addEventListener('input', function() {
            const dayTitle = document.querySelector(`.itinerary-day[data-day="${dayNum}"] .day-title`);
            if (dayTitle) {
                dayTitle.textContent = this.value || 'New Day';
            }
        });
    }
    
    if (locationInput) {
        locationInput.addEventListener('input', function() {
            const dayLocation = document.querySelector(`.itinerary-day[data-day="${dayNum}"] .day-summary .location`);
            if (dayLocation) {
                dayLocation.textContent = this.value || 'Location TBD';
            }
        });
    }
    
    updateDayNumbers && updateDayNumbers();
    
    // Force the day content to be visible immediately
    const dayContent = document.querySelector(`.itinerary-day[data-day="${dayNum}"] .day-content`);
    if (dayContent) {
        dayContent.classList.add('active');
        const arrow = document.querySelector(`.itinerary-day[data-day="${dayNum}"] .toggle-arrow`);
        if (arrow) {
            arrow.classList.add('rotated');
        }
        
        // Debug: Check if form fields are present
        const formFields = dayContent.querySelectorAll('.form-group');
        console.log(`Day ${dayNum} has ${formFields.length} form fields`);
        
        // Ensure the day content is visible
        dayContent.style.display = 'block';
    } else {
        console.error(`Could not find day content for day ${dayNum}`);
    }
    
    // Also call toggleDay to ensure proper state management
    setTimeout(() => {
        toggleDay(dayNum);
        renderSelectedActivities && renderSelectedActivities(dayNum, dayData ? dayData.activity_ids : []);
    }, 50);

    const addActivityBtn = document.getElementById(`add-activity-btn-${dayNum}`);
    if (addActivityBtn) {
        addActivityBtn.addEventListener('click', function() {
            console.log('Add Activity button clicked for day', dayNum);
            openActivitySelector(dayNum);
        });
        console.log('Event listener attached for add-activity-btn-' + dayNum);
    } else {
        console.log('Button not found: add-activity-btn-' + dayNum);
    }
}
window.addItineraryDay = addItineraryDay;

function updateDayNumbers() {
    const days = document.querySelectorAll('.itinerary-day');
    days.forEach((day, index) => {
        const dayNum = index + 1;
        day.dataset.day = dayNum;
        const dayNumberElement = day.querySelector('.day-number');
        if (dayNumberElement) {
            dayNumberElement.textContent = `Day ${dayNum}`;
        }
        const dayTitle = day.querySelector('.day-title');
        if (dayTitle) {
            const formSectionHeader = day.querySelector('.form-section-header h5');
            if (formSectionHeader) {
                formSectionHeader.textContent = `Day ${dayNum} Details`;
            }
        }
        const dayHeader = day.querySelector('.day-header');
        if (dayHeader) {
            dayHeader.onclick = () => toggleDay(dayNum);
        }
        const inputs = day.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            const name = input.name;
            if (name.includes('[itinerary][') && name.includes(']')) {
                input.name = name.replace(/\[itinerary\]\[\d+\]/, `[itinerary][${dayNum}]`);
            }
        });
        const editBtn = day.querySelector('.edit-btn');
        const removeBtn = day.querySelector('.remove-btn');
        if (editBtn) {
            editBtn.onclick = () => editDay(dayNum);
        }
        if (removeBtn) {
            removeBtn.onclick = () => removeItineraryDay(dayNum);
        }
    });
}
window.updateDayNumbers = updateDayNumbers;

function toggleDay(dayNumber) {
    const allDayContents = document.querySelectorAll('.itinerary-day .day-content');
    const allArrows = document.querySelectorAll('.itinerary-day .toggle-arrow');
    const thisDayContent = document.querySelector(`.itinerary-day[data-day="${dayNumber}"] .day-content`);
    const thisArrow = document.querySelector(`.itinerary-day[data-day="${dayNumber}"] .toggle-arrow`);
    if (thisDayContent && thisDayContent.classList.contains('active')) {
        thisDayContent.classList.remove('active');
        if (thisArrow) thisArrow.classList.remove('rotated');
        return;
    }
    allDayContents.forEach(content => content.classList.remove('active'));
    allArrows.forEach(arrow => arrow.classList.remove('rotated'));
    if (thisDayContent) thisDayContent.classList.add('active');
    if (thisArrow) thisArrow.classList.add('rotated');
}
window.toggleDay = toggleDay;

function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Add nonce and action
    formData.append('action', 'yatra_save_trip');
    formData.append('nonce', yatraAdmin.nonce);
    
    // Show loading state
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Saving...';
    submitBtn.disabled = true;
    
    fetch(yatraAdmin.ajaxUrl, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Trip saved successfully!');
            if (data.data.redirect) {
                window.location.href = data.data.redirect;
            }
        } else {
            alert('Error: ' + (data.data.message || 'Failed to save trip'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while saving the trip.');
    })
    .finally(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    });
}

// Quick action functions
function previewTrip() {
    alert('Preview feature coming soon!');
}

function duplicateTrip() {
    if (confirm('Create a copy of this trip?')) {
        // Implementation for duplicating trip
        alert('Duplicate feature coming soon!');
    }
}

function deleteTrip() {
    if (confirm('Are you sure you want to delete this trip? This action cannot be undone.')) {
        // Implementation for deleting trip
        alert('Delete feature coming soon!');
    }
}

// Placeholder functions for future implementation
function editDay(dayNumber) {
    console.log('Edit day:', dayNumber);
    // Implementation for editing day details
}

function removeItineraryDay(dayNumber) {
    if (confirm('Are you sure you want to remove this day?')) {
        const dayElement = document.querySelector(`.itinerary-day[data-day="${dayNumber}"]`);
        if (dayElement) {
            dayElement.remove();
            updateDayNumbers();
            
            // Show empty state if no days left
            const itineraryDays = document.getElementById('itinerary-days');
            const itineraryEmpty = document.getElementById('itinerary-empty');
            if (itineraryDays.children.length === 0 && itineraryEmpty) {
                itineraryEmpty.style.display = 'block';
            }
        }
    }
}
window.removeItineraryDay = removeItineraryDay;

function renderSelectedActivities(dayNumber, activityIds) {
    console.log('Render activities for day:', dayNumber, activityIds);
    // Implementation for rendering selected activities
}

// Helper functions for meals tag system
function getMealsTags(meals, dayNum) {
    if (!meals || meals.length === 0) return '';
    
    const mealLabels = {
        'breakfast': 'Breakfast',
        'brunch': 'Brunch',
        'lunch': 'Lunch',
        'tea': 'Tea/Coffee',
        'snack': 'Snack',
        'dinner': 'Dinner'
    };
    
    let tags = '';
    if (Array.isArray(meals)) {
        meals.forEach(meal => {
            if (mealLabels[meal]) {
                tags += `<div class="meal-tag" data-meal="${meal}">
                    ${mealLabels[meal]}
                    <div class="remove-tag" onclick="removeMealTag(${dayNum}, '${meal}')">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </div>`;
            }
        });
    } else if (typeof meals === 'string') {
        // Handle old single-value format
        const mealArray = [];
        if (meals === 'breakfast' || meals === 'breakfast_lunch' || meals === 'all_meals') mealArray.push('breakfast');
        if (meals === 'lunch' || meals === 'breakfast_lunch' || meals === 'all_meals') mealArray.push('lunch');
        if (meals === 'dinner' || meals === 'breakfast_dinner' || meals === 'all_meals') mealArray.push('dinner');
        
        mealArray.forEach(meal => {
            tags += `<div class="meal-tag" data-meal="${meal}">
                ${mealLabels[meal]}
                <div class="remove-tag" onclick="removeMealTag(${dayNum}, '${meal}')">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
            </div>`;
        });
    }
    
    return tags;
}

function getMealsValue(meals) {
    if (!meals || meals.length === 0) return '';
    
    if (Array.isArray(meals)) {
        return meals.join(',');
    } else if (typeof meals === 'string') {
        return meals;
    }
    
    return '';
}

// Meals tag functionality
function toggleMealsDropdown(dayNum) {
    const dropdown = document.getElementById(`meals-dropdown-${dayNum}`);
    const container = document.querySelector(`.meals-tag-container[data-day="${dayNum}"]`);
    const input = container.querySelector('.meals-tag-input');
    
    dropdown.classList.toggle('active');
    input.classList.toggle('active');
    
    // Close other dropdowns
    document.querySelectorAll('.meals-dropdown.active').forEach(dd => {
        if (dd.id !== `meals-dropdown-${dayNum}`) {
            dd.classList.remove('active');
            dd.parentNode.querySelector('.meals-tag-input').classList.remove('active');
        }
    });
}

function toggleMealTag(dayNum, mealValue) {
    const tagsContainer = document.getElementById(`meals-tags-${dayNum}`);
    const input = document.getElementById(`meals-input-${dayNum}`);
    const dropdown = document.getElementById(`meals-dropdown-${dayNum}`);
    
    // Check if tag already exists
    const existingTag = tagsContainer.querySelector(`[data-meal="${mealValue}"]`);
    
    if (existingTag) {
        // Remove tag
        existingTag.remove();
    } else {
        // Add tag
        const mealLabels = {
            'breakfast': 'Breakfast',
            'brunch': 'Brunch',
            'lunch': 'Lunch',
            'tea': 'Tea/Coffee',
            'snack': 'Snack',
            'dinner': 'Dinner'
        };
        
        const tag = document.createElement('div');
        tag.className = 'meal-tag';
        tag.dataset.meal = mealValue;
        tag.innerHTML = `
            ${mealLabels[mealValue]}
            <div class="remove-tag" onclick="removeMealTag(${dayNum}, '${mealValue}')">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
        `;
        
        tagsContainer.appendChild(tag);
    }
    
    // Update hidden input
    updateMealsHiddenInput(dayNum);
    
    // Update dropdown options
    updateMealOptions(dayNum);
    
    // Hide placeholder if tags exist
    const placeholder = document.querySelector(`.meals-tag-container[data-day="${dayNum}"] .meals-placeholder`);
    if (placeholder) {
        placeholder.style.display = tagsContainer.children.length > 0 ? 'none' : 'block';
    }
}

function removeMealTag(dayNum, mealValue) {
    const tag = document.querySelector(`#meals-tags-${dayNum} [data-meal="${mealValue}"]`);
    if (tag) {
        tag.remove();
        updateMealsHiddenInput(dayNum);
        updateMealOptions(dayNum);
        
        // Show placeholder if no tags
        const tagsContainer = document.getElementById(`meals-tags-${dayNum}`);
        const placeholder = document.querySelector(`.meals-tag-container[data-day="${dayNum}"] .meals-placeholder`);
        if (placeholder) {
            placeholder.style.display = tagsContainer.children.length > 0 ? 'none' : 'block';
        }
    }
}

function updateMealsHiddenInput(dayNum) {
    const input = document.getElementById(`meals-input-${dayNum}`);
    const tags = document.querySelectorAll(`#meals-tags-${dayNum} .meal-tag`);
    const values = Array.from(tags).map(tag => tag.dataset.meal);
    
    input.value = values.join(',');
}

function updateMealOptions(dayNum) {
    const dropdown = document.getElementById(`meals-dropdown-${dayNum}`);
    const tags = document.querySelectorAll(`#meals-tags-${dayNum} .meal-tag`);
    const selectedMeals = Array.from(tags).map(tag => tag.dataset.meal);
    
    dropdown.querySelectorAll('.meal-option').forEach(option => {
        const mealValue = option.dataset.value;
        if (selectedMeals.includes(mealValue)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.meals-tag-container')) {
        document.querySelectorAll('.meals-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.parentNode.querySelector('.meals-tag-input').classList.remove('active');
        });
    }
}); 