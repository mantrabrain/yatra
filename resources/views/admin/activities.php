<?php
use Yatra\Models\Activity;

// Fetch all activities
$activities = Activity::getAll();
$nonce = wp_create_nonce('yatra_activities_nonce');
?>
<div class="yatra-activities-admin">
    <h2>Activities</h2>
    <div id="activities-list">
        <?php if (empty($activities)): ?>
            <div class="yatra-empty-state">
                <p>No activities found. Click below to add your first activity.</p>
            </div>
        <?php else: ?>
            <?php foreach ($activities as $activity): ?>
                <div class="activity-card" data-id="<?php echo $activity->id; ?>">
                    <div class="activity-card-main">
                        <div class="activity-card-info">
                            <div class="activity-title"><?php echo esc_html($activity->title); ?></div>
                            <div class="activity-desc"><?php echo esc_html($activity->description); ?></div>
                        </div>
                        <?php if ($activity->time): ?>
                        <div class="activity-time">
                            <?php echo esc_html($activity->time); ?>
                        </div>
                        <?php endif; ?>
                    </div>
                    <div class="activity-card-actions">
                        <button class="yatra-btn yatra-btn-secondary edit-activity" data-id="<?php echo $activity->id; ?>">Edit</button>
                        <button class="yatra-btn yatra-btn-danger remove-activity" data-id="<?php echo $activity->id; ?>">Remove</button>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php endif; ?>
    </div>
    <button class="yatra-btn yatra-btn-primary" id="add-activity-btn">+ Add Activity</button>
    <div id="activity-modal" style="display:none;"></div>
</div>
<script>
const yatraActivitiesNonce = '<?php echo esc_js($nonce); ?>';

function renderActivityModal(activity = null) {
    const isEdit = !!activity;
    const modal = document.getElementById('activity-modal');
    modal.innerHTML = `
        <div class="activity-modal-bg"></div>
        <div class="activity-modal-content">
            <h3>
                ${isEdit ? 'Edit Activity' : 'Add Activity'}
            </h3>
            <form id="activity-form">
                <input type="hidden" name="nonce" value="${yatraActivitiesNonce}">
                ${isEdit ? `<input type="hidden" name="id" value="${activity.id}">` : ''}
                <div class="form-group">
                    <label>Title</label>
                    <input type="text" name="title" class="form-input" value="${isEdit ? activity.title : ''}" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea name="description" class="form-textarea">${isEdit ? activity.description : ''}</textarea>
                </div>
                <div class="form-group">
                    <label>Time</label>
                    <input type="text" name="time" class="form-input" value="${isEdit ? activity.time : ''}" placeholder="e.g. 09:00">
                </div>
                <div class="form-group">
                    <label>Location</label>
                    <input type="text" name="location" class="form-input" value="${isEdit ? activity.location : ''}">
                </div>
                <div class="form-group">
                    <label>Image URL</label>
                    <input type="text" name="image" class="form-input" value="${isEdit ? activity.image : ''}">
                </div>
                <div class="form-group">
                    <label>Status</label>
                    <select name="status" class="form-select">
                        <option value="active" ${!isEdit || activity.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="inactive" ${isEdit && activity.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                    </select>
                </div>
                <div class="modal-actions">
                    <button type="submit" class="yatra-btn yatra-btn-primary">${isEdit ? 'Update' : 'Add'} Activity</button>
                    <button type="button" class="yatra-btn yatra-btn-secondary" id="cancel-activity-modal">Cancel</button>
                </div>
            </form>
        </div>
    `;
    modal.style.display = 'block';
    document.getElementById('cancel-activity-modal').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('activity-form').onsubmit = function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        formData.append('action', isEdit ? 'yatra_edit_activity' : 'yatra_add_activity');
        fetch(ajaxurl, {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                location.reload();
            } else {
                alert(data.data && data.data.message ? data.data.message : 'Failed to save activity.');
            }
        });
    };
}

document.getElementById('add-activity-btn').onclick = function() {
    renderActivityModal();
};

document.querySelectorAll('.edit-activity').forEach(btn => {
    btn.onclick = function() {
        const id = this.getAttribute('data-id');
        const formData = new FormData();
        formData.append('action', 'yatra_get_activity');
        formData.append('id', id);
        formData.append('nonce', yatraActivitiesNonce);
        fetch(ajaxurl, { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.data.activity) {
                    renderActivityModal(data.data.activity);
                } else {
                    alert('Failed to fetch activity.');
                }
            });
    };
});

document.querySelectorAll('.remove-activity').forEach(btn => {
    btn.onclick = function() {
        if (!confirm('Are you sure you want to remove this activity?')) return;
        const id = this.getAttribute('data-id');
        const formData = new FormData();
        formData.append('action', 'yatra_delete_activity');
        formData.append('id', id);
        formData.append('nonce', yatraActivitiesNonce);
        fetch(ajaxurl, { method: 'POST', body: formData })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    location.reload();
                } else {
                    alert(data.data && data.data.message ? data.data.message : 'Failed to delete activity.');
                }
            });
    };
});
</script>
<style>
.yatra-activities-admin { max-width: 700px; margin: 0 auto; }
#activities-list { margin-bottom: 2rem; }
.activity-card { background: #f8fafc; border-radius: 0.75rem; padding: 1.5rem 1.5rem 1rem 1.5rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start; box-shadow: 0 2px 8px rgba(16,30,54,0.04); }
.activity-card-main { display: flex; align-items: center; gap: 2rem; flex: 1; }
.activity-title { font-size: 1.15rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem; }
.activity-desc { color: #64748b; font-size: 1rem; }
.activity-time { background: #2563eb; color: #fff; font-weight: 600; border-radius: 1.5rem; padding: 0.35rem 1.1rem; font-size: 1rem; margin-left: 1.5rem; }
.activity-card-actions { display: flex; gap: 0.75rem; align-items: center; }
.yatra-btn { font-size: 1rem; }

/* Modal styles */
#activity-modal { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; display: none; }
.activity-modal-bg { position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(30,41,59,0.18); }
.activity-modal-content { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: #fff; border-radius: 1rem; box-shadow: 0 8px 32px rgba(16,30,54,0.18); padding: 2.5rem 2.5rem 2rem 2.5rem; min-width: 350px; max-width: 95vw; }
.activity-modal-content h3 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 700; }
.activity-modal-content .form-group { margin-bottom: 1.25rem; }
.activity-modal-content .form-input, .activity-modal-content .form-textarea, .activity-modal-content .form-select { width: 100%; font-size: 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; }
.activity-modal-content .form-textarea { min-height: 60px; }
.activity-modal-content .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem; }
</style> 