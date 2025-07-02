<?php
/**
 * Activities Admin Page
 * 
 * @package Yatra
 * @since 1.0.0
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

$activities = new \Yatra\Models\Activity();
$all_activities = $activities->getActivitiesForDisplay();
?>

<div class="yatra-activities-page">
    <!-- Success/Error Messages -->
    <?php if (isset($_GET['message']) && isset($_GET['msg'])): ?>
        <div class="yatra-message yatra-message-<?php echo esc_attr($_GET['message']); ?>">
            <div class="yatra-message-content">
                <?php if ($_GET['message'] === 'success'): ?>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                <?php else: ?>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                <?php endif; ?>
                <span><?php echo esc_html(urldecode($_GET['msg'])); ?></span>
            </div>
            <button type="button" class="yatra-message-close" onclick="this.parentElement.remove()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
    <?php endif; ?>

    <!-- Page Header -->
    <div class="yatra-page-header">
        <div class="yatra-page-header-content">
            <h1 class="yatra-page-title">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="yatra-page-icon">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                    <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Activities
            </h1>
            <p class="yatra-page-description">Manage global activities that can be added to trip itineraries</p>
        </div>
        <div class="yatra-page-actions">
            <button type="button" class="yatra-btn yatra-btn-primary" id="add-activity-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Add Activity
            </button>
        </div>
    </div>

    <!-- Activities List -->
    <div class="yatra-activities-list">
        <?php if (empty($all_activities)): ?>
            <!-- Empty State -->
            <div class="yatra-empty-state">
                <div class="yatra-empty-state-icon">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
                        <path d="M8 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h3 class="yatra-empty-state-title">No Activities Yet</h3>
                <p class="yatra-empty-state-description">Create your first activity to get started with trip planning</p>
                <button type="button" class="yatra-btn yatra-btn-primary" id="add-first-activity-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    Add Your First Activity
                </button>
            </div>
        <?php else: ?>
            <!-- Activities Table -->
            <div class="yatra-activities-table-wrapper">
                <table class="yatra-activities-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Description</th>
                            <th>Duration</th>
                            <th>Difficulty</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($all_activities as $activity): ?>
                            <tr data-activity-id="<?php echo esc_attr($activity['id']); ?>">
                                <td><?php echo esc_html($activity['name']); ?></td>
                                <td><?php echo esc_html($activity['description']); ?></td>
                                <td><?php echo esc_html($activity['duration']); ?></td>
                                <td><?php echo esc_html($activity['difficulty']); ?></td>
                                <td>
                                    <button type="button" class="yatra-btn yatra-btn-icon yatra-btn-ghost edit-activity-btn" data-activity-id="<?php echo esc_attr($activity['id']); ?>">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                            <path d="M18.5 2.50023C18.8978 2.10297 19.4374 1.87891 20 1.87891C20.5626 1.87891 21.1022 2.10297 21.5 2.50023C21.897 2.89733 22.1211 3.43689 22.1211 3.99953C22.1211 4.56216 21.897 5.10172 21.5 5.49882L12 15.0002L8 16.0002L9 12.0002L18.5 2.50023Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </button>
                                    <button type="button" class="yatra-btn yatra-btn-icon yatra-btn-ghost delete-activity-btn" data-activity-id="<?php echo esc_attr($activity['id']); ?>">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M3 6H5H21M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Add/Edit Activity Modal -->
<div class="yatra-modal" id="activity-modal">
    <div class="yatra-modal-overlay"></div>
    <div class="yatra-modal-container">
        <div class="yatra-modal-header">
            <h2 class="yatra-modal-title" id="activity-modal-title">Add Activity</h2>
            <button type="button" class="yatra-modal-close" id="close-activity-modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
        <div class="yatra-modal-body">
            <form id="activity-form">
                <input type="hidden" id="activity-id" name="id" value="">
                
                <div class="yatra-form-row">
                    <div class="yatra-form-group" style="flex:2;">
                        <label for="activity-name" class="yatra-form-label">Activity Name *</label>
                        <input type="text" id="activity-name" name="name" class="yatra-form-input" required>
                    </div>
                    <div class="yatra-form-group" style="flex:1;">
                        <label for="activity-icon" class="yatra-form-label">Icon (Emoji)</label>
                        <input type="text" id="activity-icon" name="icon" class="yatra-form-input" placeholder="🏔️ 🚶‍♂️ 🚴‍♀️ 🏊‍♂️">
                        <small class="form-desc">Enter an emoji to represent this activity</small>
                    </div>
                </div>

                <div class="yatra-form-row">
                    <div class="yatra-form-group">
                        <label for="activity-duration" class="yatra-form-label">Duration</label>
                        <input type="text" id="activity-duration" name="duration" class="yatra-form-input" placeholder="e.g., 2 hours, 1 day">
                    </div>
                    <div class="yatra-form-group">
                        <label for="activity-difficulty" class="yatra-form-label">Difficulty</label>
                        <select id="activity-difficulty" name="difficulty" class="yatra-form-select">
                            <option value="Easy">Easy</option>
                            <option value="Moderate">Moderate</option>
                            <option value="Hard">Hard</option>
                            <option value="Expert">Expert</option>
                        </select>
                    </div>
                </div>

                <div class="yatra-form-group">
                    <label for="activity-category" class="yatra-form-label">Category</label>
                    <input type="text" id="activity-category" name="category" class="yatra-form-input" placeholder="e.g., Adventure, Cultural, Nature">
                </div>

                <div class="yatra-form-group">
                    <label for="activity-description" class="yatra-form-label">Description</label>
                    <textarea id="activity-description" name="description" class="yatra-form-textarea" rows="2"></textarea>
                </div>
            </form>
        </div>
        <div class="yatra-modal-footer">
            <button type="button" class="yatra-btn yatra-btn-secondary" id="cancel-activity-btn">Cancel</button>
            <button type="button" class="yatra-btn yatra-btn-primary" id="save-activity-btn">
                <span class="save-text">Save Activity</span>
                <span class="loading-text" style="display: none;">
                    <svg class="yatra-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                    Saving...
                </span>
            </button>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal -->
<div class="yatra-modal" id="delete-activity-modal">
    <div class="yatra-modal-overlay"></div>
    <div class="yatra-modal-container yatra-modal-small">
        <div class="yatra-modal-header">
            <h2 class="yatra-modal-title">Delete Activity</h2>
            <button type="button" class="yatra-modal-close" id="close-delete-modal">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        </div>
        <div class="yatra-modal-body">
            <p>Are you sure you want to delete this activity? This action cannot be undone.</p>
        </div>
        <div class="yatra-modal-footer">
            <button type="button" class="yatra-btn yatra-btn-secondary" id="cancel-delete-btn">Cancel</button>
            <button type="button" class="yatra-btn yatra-btn-danger" id="confirm-delete-btn">
                <span class="delete-text">Delete Activity</span>
                <span class="loading-text" style="display: none;">
                    <svg class="yatra-spinner" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                    Deleting...
                </span>
            </button>
        </div>
    </div>
</div>

<script>
jQuery(document).ready(function($) {
    // Activity modal functionality
    const activityModal = $('#activity-modal');
    const deleteModal = $('#delete-activity-modal');
    const activityForm = $('#activity-form');
    let currentActivityId = null;

    // Open add activity modal
    $('#add-activity-btn, #add-first-activity-btn').on('click', function() {
        openActivityModal();
    });

    // Open edit activity modal
    $('.edit-activity-btn').on('click', function() {
        const activityId = $(this).data('activity-id');
        openActivityModal(activityId);
    });

    // Delete activity
    $('.delete-activity-btn').on('click', function() {
        const activityId = $(this).data('activity-id');
        openDeleteModal(activityId);
    });

    // Close modals
    $('.yatra-modal-close, .yatra-modal-overlay, #cancel-activity-btn, #cancel-delete-btn').on('click', function() {
        closeActivityModal();
        closeDeleteModal();
    });

    // Save activity
    $('#save-activity-btn').on('click', function() {
        saveActivity();
    });

    // Confirm delete
    $('#confirm-delete-btn').on('click', function() {
        deleteActivity();
    });

    function openActivityModal(activityId = null) {
        currentActivityId = activityId;
        
        if (activityId) {
            // Edit mode - load activity data
            $('#activity-modal-title').text('Edit Activity');
            loadActivityData(activityId);
        } else {
            // Add mode - reset form
            $('#activity-modal-title').text('Add Activity');
            activityForm[0].reset();
            $('#activity-id').val('');
        }
        
        activityModal.addClass('yatra-modal-open');
    }

    function closeActivityModal() {
        activityModal.removeClass('yatra-modal-open');
        currentActivityId = null;
    }

    function openDeleteModal(activityId) {
        currentActivityId = activityId;
        deleteModal.addClass('yatra-modal-open');
    }

    function closeDeleteModal() {
        deleteModal.removeClass('yatra-modal-open');
        currentActivityId = null;
    }

    function loadActivityData(activityId) {
        // Find the activity card and extract data
        const activityCard = $(`.yatra-activity-card[data-activity-id="${activityId}"]`);
        
        if (activityCard.length) {
            const title = activityCard.find('.yatra-activity-title').text();
            const description = activityCard.find('.yatra-activity-description').text();
            const duration = activityCard.find('.yatra-activity-duration').text().trim();
            const difficulty = activityCard.find('.yatra-activity-difficulty').text();
            const icon = activityCard.find('.yatra-activity-icon-emoji').text();
            
            $('#activity-id').val(activityId);
            $('#activity-name').val(title);
            $('#activity-description').val(description);
            $('#activity-duration').val(duration);
            $('#activity-difficulty').val(difficulty);
            $('#activity-icon').val(icon);
        }
    }

    function saveActivity() {
        // Validate form
        const name = $('#activity-name').val().trim();
        if (!name) {
            showFormError('Activity name is required.');
            return;
        }

        const formData = new FormData(activityForm[0]);
        const isEdit = currentActivityId !== null;
        
        // Show loading state
        const saveBtn = $('#save-activity-btn');
        saveBtn.prop('disabled', true);
        saveBtn.find('.save-text').hide();
        saveBtn.find('.loading-text').show();

        // Clear previous errors
        clearFormErrors();

        // Prepare data for API
        const data = Object.fromEntries(formData);
        
        // Determine API endpoint and method
        const url = isEdit 
            ? `${yatraAdmin.restUrl}yatra/v1/activities/${currentActivityId}`
            : `${yatraAdmin.restUrl}yatra/v1/activities`;
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': yatraAdmin.nonce
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                closeActivityModal();
                location.reload();
            } else {
                showFormError(result.message || 'Error saving activity.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showFormError('Network error. Please try again.');
        })
        .finally(() => {
            saveBtn.prop('disabled', false);
            saveBtn.find('.save-text').show();
            saveBtn.find('.loading-text').hide();
        });
    }

    function deleteActivity() {
        if (!currentActivityId) return;

        // Show loading state
        const deleteBtn = $('#confirm-delete-btn');
        deleteBtn.prop('disabled', true);
        deleteBtn.find('.delete-text').hide();
        deleteBtn.find('.loading-text').show();

        fetch(`${yatraAdmin.restUrl}yatra/v1/activities/${currentActivityId}`, {
            method: 'DELETE',
            headers: {
                'X-WP-Nonce': yatraAdmin.nonce
            }
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                // Close modal
                closeDeleteModal();
                
                // Show success message
                showSuccessMessage('Activity deleted successfully.');
                
                // Remove the activity card from DOM
                $(`.yatra-activity-card[data-activity-id="${currentActivityId}"]`).fadeOut(300, function() {
                    $(this).remove();
                    
                    // Check if no activities left
                    if ($('.yatra-activity-card').length === 0) {
                        location.reload(); // Reload to show empty state
                    }
                });
            } else {
                showErrorMessage(result.message || 'Error deleting activity.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showErrorMessage('Network error. Please try again.');
        })
        .finally(() => {
            deleteBtn.prop('disabled', false);
            deleteBtn.find('.delete-text').show();
            deleteBtn.find('.loading-text').hide();
        });
    }

    function showFormError(message) {
        // Remove existing error messages
        $('.yatra-form-error').remove();
        
        // Add error message to form
        const errorHtml = `<div class="yatra-form-error">${message}</div>`;
        $('#activity-form').prepend(errorHtml);
        
        // Scroll to error
        $('html, body').animate({
            scrollTop: $('.yatra-form-error').offset().top - 100
        }, 300);
    }

    function clearFormErrors() {
        $('.yatra-form-error').remove();
    }

    function showSuccessMessage(message) {
        // Remove existing messages
        $('.yatra-message').remove();
        
        // Add success message
        const messageHtml = `
            <div class="yatra-message yatra-message-success">
                <div class="yatra-message-content">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${message}</span>
                </div>
                <button type="button" class="yatra-message-close" onclick="this.parentElement.remove()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;
        $('.yatra-activities-page').prepend(messageHtml);
    }

    function showErrorMessage(message) {
        // Remove existing messages
        $('.yatra-message').remove();
        
        // Add error message
        const messageHtml = `
            <div class="yatra-message yatra-message-error">
                <div class="yatra-message-content">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 14L12 12M12 12L14 10M12 12L10 10M12 12L14 14M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span>${message}</span>
                </div>
                <button type="button" class="yatra-message-close" onclick="this.parentElement.remove()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>
            </div>
        `;
        $('.yatra-activities-page').prepend(messageHtml);
    }
});
</script> 