<?php
/**
 * Public-facing "Chat with AI" widget — slot directly under the
 * Enquiry button on the single-trip page when the operator has the AI
 * module on AND has flipped the `yatra_ai_trip_chat_enabled` toggle.
 *
 * The widget is intentionally self-contained: button + slide-over
 * panel + inline JS in one partial. That sidesteps the build pipeline
 * (no admin React bundle on the public page) and keeps the widget
 * cheap to render. The chat itself routes through the REST endpoint
 * /wp-json/yatra/v1/ai/trip-chat/{trip_id} which carries the rate
 * limits + BYOK key.
 *
 * Visual language matches the rest of the single-trip sidebar:
 *   - Yatra blue brand color (`--yatra-primary`, fallback #3b82f6)
 *   - Rounded corners, soft shadows
 *   - Same button silhouette as `.yatra-booking-button` so the chat
 *     trigger feels like a peer-CTA, not a foreign widget.
 *
 * Required vars (set by the caller before include):
 *   $trip       — Yatra trip object (must expose getId() + getName())
 */

if (!defined('ABSPATH')) {
    exit;
}

// Two gates — module must be on AND the public chat toggle must be on.
// We deliberately keep both checks server-side; an operator who flips
// the module off without unticking the chat flag should still result in
// no widget rendered. ModuleManager stores modules as an array of
// `{slug: ai_assistant, ...}` objects, NOT a hyphen-keyed map, so we
// must call its isModuleEnabled() helper rather than indexing by slug.
$yatra_ai_module_on = false;
if (\class_exists('\\Yatra\\Core\\Modules\\ModuleManager')) {
    $yatra_ai_module_on = \Yatra\Core\Modules\ModuleManager::isModuleEnabled('ai_assistant');
}

$yatra_ai_chat_flag = (bool) get_option('yatra_ai_trip_chat_enabled', false);

// WP_DEBUG-only HTML-comment breadcrumb so the operator can `View Source`
// and see exactly which gate stopped the widget. Production sites never
// see this — when the feature is off the page is byte-identical to before.
if (defined('WP_DEBUG') && WP_DEBUG && (!$yatra_ai_module_on || !$yatra_ai_chat_flag)) {
    echo '<!-- yatra-ai-chat-widget: module_on=' . ($yatra_ai_module_on ? '1' : '0')
        . ' chat_flag=' . ($yatra_ai_chat_flag ? '1' : '0') . ' -->';
}

if (!$yatra_ai_module_on || !$yatra_ai_chat_flag) {
    return;
}

if (!isset($trip)) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        echo '<!-- yatra-ai-chat-widget: $trip missing -->';
    }
    return;
}

// Accept either the Trip object (with getId/getName) or a raw post-id
// integer or stdClass with ID field — the widget is rendered from
// multiple branches in content-sidebar and the calling shape isn't
// perfectly uniform.
$yatra_chat_trip_id = 0;
$yatra_chat_trip_name = '';
if (\is_object($trip)) {
    if (\method_exists($trip, 'getId')) {
        $yatra_chat_trip_id = (int) $trip->getId();
    } elseif (isset($trip->id)) {
        $yatra_chat_trip_id = (int) $trip->id;
    } elseif (isset($trip->ID)) {
        $yatra_chat_trip_id = (int) $trip->ID;
    }
    // The Yatra Trip class exposes the display title via getTitle();
    // older snippets used getName(). Try both, then fall through to
    // raw stdClass / WP_Post property names.
    if (\method_exists($trip, 'getTitle')) {
        $yatra_chat_trip_name = (string) $trip->getTitle();
    } elseif (\method_exists($trip, 'getName')) {
        $yatra_chat_trip_name = (string) $trip->getName();
    } elseif (isset($trip->title)) {
        $yatra_chat_trip_name = (string) $trip->title;
    } elseif (isset($trip->name)) {
        $yatra_chat_trip_name = (string) $trip->name;
    } elseif (isset($trip->post_title)) {
        $yatra_chat_trip_name = (string) $trip->post_title;
    }
} elseif (\is_numeric($trip)) {
    $yatra_chat_trip_id = (int) $trip;
}

if ($yatra_chat_trip_id <= 0) {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        echo '<!-- yatra-ai-chat-widget: trip id resolution failed -->';
    }
    return;
}
if ($yatra_chat_trip_name === '') {
    $yatra_chat_trip_name = sprintf(__('Trip #%d', 'yatra'), $yatra_chat_trip_id);
}

$yatra_chat_rest = esc_url_raw(rest_url('yatra/v1/ai/trip-chat/' . $yatra_chat_trip_id));
$yatra_chat_widget_id = 'yatra-ai-chat-' . $yatra_chat_trip_id;
?>

<button
    type="button"
    class="yatra-ai-chat-trigger"
    data-yatra-ai-chat-trigger="<?php echo esc_attr($yatra_chat_widget_id); ?>"
    aria-controls="<?php echo esc_attr($yatra_chat_widget_id); ?>"
    aria-expanded="false"
>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
    </svg>
    <span><?php esc_html_e('Ask AI about this trip', 'yatra'); ?></span>
    <span class="yatra-ai-chat-badge"><?php esc_html_e('AI', 'yatra'); ?></span>
</button>

<div
    class="yatra-ai-chat-panel"
    id="<?php echo esc_attr($yatra_chat_widget_id); ?>"
    role="dialog"
    aria-modal="false"
    aria-labelledby="<?php echo esc_attr($yatra_chat_widget_id); ?>-title"
    hidden
>
    <div class="yatra-ai-chat-panel-header">
        <div class="yatra-ai-chat-panel-title-wrap">
            <div class="yatra-ai-chat-panel-avatar" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
            </div>
            <div class="yatra-ai-chat-panel-title-text">
                <div class="yatra-ai-chat-panel-title" id="<?php echo esc_attr($yatra_chat_widget_id); ?>-title">
                    <?php esc_html_e('Trip Assistant', 'yatra'); ?>
                </div>
                <div class="yatra-ai-chat-panel-subtitle">
                    <span class="yatra-ai-chat-online-dot" aria-hidden="true"></span>
                    <?php echo esc_html(sprintf(__('Online · ask about %s', 'yatra'), $yatra_chat_trip_name)); ?>
                </div>
            </div>
        </div>
        <button type="button" class="yatra-ai-chat-close" data-yatra-ai-chat-close aria-label="<?php esc_attr_e('Close chat', 'yatra'); ?>">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    </div>

    <div class="yatra-ai-chat-messages" data-yatra-ai-chat-messages>
        <div class="yatra-ai-chat-msg yatra-ai-chat-msg-assistant">
            <?php echo esc_html(sprintf(
                /* translators: %s = trip name */
                __("Hi! I can help with questions about %s — itinerary, what to pack, difficulty, best season. For bookings or quotes, please use the enquiry button above.", 'yatra'),
                $yatra_chat_trip_name
            )); ?>
        </div>
        <?php
        // Suggestion chips — give the visitor a starting point so the
        // empty input isn't intimidating. Click → fills the textarea +
        // submits.
        $yatra_chat_suggestions = [
            __('What\'s included?', 'yatra'),
            __('What should I pack?', 'yatra'),
            __('Is it kid-friendly?', 'yatra'),
            __('Best season to go?', 'yatra'),
        ];
        ?>
        <div class="yatra-ai-chat-suggestions" data-yatra-ai-chat-suggestions>
            <?php foreach ($yatra_chat_suggestions as $sug): ?>
                <button type="button" class="yatra-ai-chat-suggestion" data-yatra-ai-chat-suggestion>
                    <?php echo esc_html($sug); ?>
                </button>
            <?php endforeach; ?>
        </div>
    </div>

    <?php
    // Intentionally a <div>, not a <form>. The booking sidebar already
    // wraps everything in a <form>, and the HTML spec forbids nested
    // forms — the browser silently elides the inner one, which left
    // panel.querySelector('[data-yatra-ai-chat-form]') returning null
    // and crashing the script's node check. We handle "submit" via a
    // button click + Enter keydown instead.
    ?>
    <div class="yatra-ai-chat-input-row" data-yatra-ai-chat-form>
        <textarea
            class="yatra-ai-chat-input"
            placeholder="<?php esc_attr_e('Type your question…', 'yatra'); ?>"
            rows="1"
            maxlength="1000"
            data-yatra-ai-chat-textarea
        ></textarea>
        <button type="button" class="yatra-ai-chat-send" data-yatra-ai-chat-send aria-label="<?php esc_attr_e('Send message', 'yatra'); ?>">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M22 2L11 13"/>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
            </svg>
        </button>
    </div>
    <div class="yatra-ai-chat-disclaimer">
        <?php esc_html_e('AI replies may have inaccuracies. Confirm details via enquiry.', 'yatra'); ?>
    </div>
</div>

<style id="yatra-ai-chat-style-<?php echo esc_attr($yatra_chat_widget_id); ?>">
/* -- Chat widget — matches Yatra public-page palette ------------------ */
.yatra-ai-chat-trigger {
    display: flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; margin-top: 10px;
    padding: 12px 14px;
    background: #fff;
    color: var(--yatra-primary, #3b82f6);
    border: 1.5px solid var(--yatra-primary, #3b82f6);
    border-radius: 10px; cursor: pointer;
    font: inherit; font-size: 0.92rem; font-weight: 600;
    transition: background .15s ease, color .15s ease, box-shadow .15s ease;
}
.yatra-ai-chat-trigger:hover {
    background: color-mix(in srgb, var(--yatra-primary, #3b82f6) 8%, white);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--yatra-primary, #3b82f6) 22%, transparent);
}
.yatra-ai-chat-trigger svg { color: var(--yatra-primary, #3b82f6); flex-shrink: 0; }
.yatra-ai-chat-badge {
    margin-left: 4px; padding: 2px 7px; border-radius: 999px;
    background: color-mix(in srgb, var(--yatra-primary, #3b82f6) 14%, white);
    color: var(--yatra-primary, #3b82f6);
    font-size: 0.65rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;
}

/* -- Slide-over panel ------------------------------------------------- */
.yatra-ai-chat-panel {
    position: fixed; right: 20px; bottom: 20px;
    width: 380px; max-width: calc(100vw - 40px);
    height: 580px; max-height: calc(100vh - 40px);
    background: #fff;
    border-radius: 16px;
    box-shadow:
        0 20px 50px rgba(15, 23, 42, 0.18),
        0 6px 14px rgba(15, 23, 42, 0.08);
    display: flex; flex-direction: column; overflow: hidden;
    z-index: 999999;
    font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
        "Helvetica Neue", Arial, sans-serif;
    border: 1px solid rgba(15, 23, 42, 0.08);
    /* Smooth entrance */
    animation: yatra-ai-chat-slide-up .22s ease-out;
}
.yatra-ai-chat-panel[hidden] { display: none; }
@keyframes yatra-ai-chat-slide-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
}

/* Header */
.yatra-ai-chat-panel-header {
    padding: 14px 16px;
    background: var(--yatra-primary, #3b82f6);
    color: #fff;
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.yatra-ai-chat-panel-title-wrap { display: flex; gap: 10px; align-items: center; flex: 1; min-width: 0; }
.yatra-ai-chat-panel-avatar {
    width: 32px; height: 32px; border-radius: 10px;
    background: rgba(255, 255, 255, 0.2);
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.yatra-ai-chat-panel-title-text { min-width: 0; flex: 1; }
.yatra-ai-chat-panel-title {
    font-weight: 600; font-size: 0.95rem; line-height: 1.2;
}
.yatra-ai-chat-panel-subtitle {
    display: flex; align-items: center; gap: 6px;
    font-size: 0.72rem; opacity: 0.92; margin-top: 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.yatra-ai-chat-online-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: #4ade80; box-shadow: 0 0 0 3px rgba(74, 222, 128, 0.3);
    flex-shrink: 0;
}
.yatra-ai-chat-close {
    background: rgba(255, 255, 255, 0.16); border: 0; color: #fff;
    width: 30px; height: 30px; border-radius: 8px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background .12s ease;
    padding: 0;
}
.yatra-ai-chat-close:hover { background: rgba(255, 255, 255, 0.28); }

/* Messages list */
.yatra-ai-chat-messages {
    flex: 1; overflow-y: auto;
    padding: 16px 14px 8px;
    background: #f8fafc;
    display: flex; flex-direction: column; gap: 10px;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}
.yatra-ai-chat-messages::-webkit-scrollbar { width: 6px; }
.yatra-ai-chat-messages::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
.yatra-ai-chat-msg {
    padding: 10px 13px; border-radius: 14px; max-width: 86%;
    line-height: 1.5; word-wrap: break-word;
    font-size: 0.875rem;
    display: flex; flex-direction: column; gap: 3px;
}
.yatra-ai-chat-msg-text { white-space: pre-wrap; }
.yatra-ai-chat-msg-time {
    align-self: flex-end;
    font-size: 0.65rem;
    opacity: 0.65;
    letter-spacing: 0.2px;
    font-variant-numeric: tabular-nums;
    margin-top: 1px;
}
.yatra-ai-chat-msg-visitor .yatra-ai-chat-msg-time { color: #e0e7ff; }
.yatra-ai-chat-msg-assistant .yatra-ai-chat-msg-time { color: #94a3b8; }
.yatra-ai-chat-msg-error .yatra-ai-chat-msg-time { color: #b91c1c; }
.yatra-ai-chat-msg-assistant {
    background: #fff;
    border: 1px solid #e2e8f0;
    align-self: flex-start;
    color: #1e293b;
    border-bottom-left-radius: 4px;
}
.yatra-ai-chat-msg-visitor {
    background: var(--yatra-primary, #3b82f6);
    color: #fff;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
}
.yatra-ai-chat-msg-error {
    background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
    align-self: flex-start;
    font-size: 0.8rem;
}

/* Typing indicator */
.yatra-ai-chat-typing {
    align-self: flex-start;
    background: #fff; border: 1px solid #e2e8f0;
    border-radius: 14px; border-bottom-left-radius: 4px;
    padding: 12px 14px;
    display: flex; gap: 4px; align-items: center;
}
.yatra-ai-chat-typing-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #94a3b8;
    animation: yatra-ai-chat-bounce 1.2s infinite ease-in-out;
}
.yatra-ai-chat-typing-dot:nth-child(2) { animation-delay: 0.15s; }
.yatra-ai-chat-typing-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes yatra-ai-chat-bounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
    30% { transform: translateY(-4px); opacity: 1; }
}

/* Suggestion chips */
.yatra-ai-chat-suggestions {
    display: flex; flex-wrap: wrap; gap: 6px;
    margin-top: 2px;
}
.yatra-ai-chat-suggestion {
    background: #fff;
    border: 1px solid color-mix(in srgb, var(--yatra-primary, #3b82f6) 25%, transparent);
    color: var(--yatra-primary, #3b82f6);
    font: inherit; font-size: 0.78rem; font-weight: 500;
    padding: 6px 11px; border-radius: 999px;
    cursor: pointer;
    transition: background .12s ease, border-color .12s ease;
}
.yatra-ai-chat-suggestion:hover {
    background: color-mix(in srgb, var(--yatra-primary, #3b82f6) 10%, white);
    border-color: var(--yatra-primary, #3b82f6);
}

/* Input row */
.yatra-ai-chat-input-row {
    padding: 10px 12px;
    border-top: 1px solid #e5e7eb;
    display: flex; gap: 8px; align-items: flex-end;
    background: #fff;
}
.yatra-ai-chat-input {
    flex: 1;
    padding: 10px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    resize: none;
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.4;
    max-height: 100px; min-height: 40px;
    outline: none;
    color: #1e293b;
    background: #fff;
    transition: border-color .12s ease, box-shadow .12s ease;
}
.yatra-ai-chat-input::placeholder { color: #94a3b8; }
.yatra-ai-chat-input:focus {
    border-color: var(--yatra-primary, #3b82f6);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--yatra-primary, #3b82f6) 18%, transparent);
}
.yatra-ai-chat-send {
    background: var(--yatra-primary, #3b82f6);
    color: #fff;
    border: 0;
    border-radius: 10px;
    width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; flex-shrink: 0;
    transition: background .12s ease, transform .08s ease;
}
.yatra-ai-chat-send:hover:not(:disabled) {
    background: var(--yatra-primary-dark, #2563eb);
}
.yatra-ai-chat-send:active:not(:disabled) { transform: scale(0.96); }
.yatra-ai-chat-send:disabled { background: #cbd5e1; cursor: not-allowed; }

/* Price summary card — mirrors the regular booking page's pricing
   breakdown (subtotal → discounts → taxes → total → due now) so the
   visitor sees the same numbers before the chat fires the create
   call. Shown as a chat bubble in the assistant column. */
.yatra-ai-chat-price-card {
    align-self: flex-start;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px; border-bottom-left-radius: 4px;
    padding: 12px 14px;
    width: 86%; max-width: 86%;
    font-size: 0.84rem;
}
.yatra-ai-chat-price-card-title {
    font-weight: 600;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #475569;
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
}
.yatra-ai-chat-price-card-rows { display: flex; flex-direction: column; gap: 4px; }
.yatra-ai-chat-price-row {
    display: flex; justify-content: space-between; gap: 8px;
    color: #1e293b;
}
.yatra-ai-chat-price-row-label { color: #475569; }
.yatra-ai-chat-price-row-value { font-weight: 500; font-variant-numeric: tabular-nums; }
.yatra-ai-chat-price-discount .yatra-ai-chat-price-row-value { color: #15803d; }
.yatra-ai-chat-price-total {
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed #cbd5e1;
    font-weight: 600;
}
.yatra-ai-chat-price-total .yatra-ai-chat-price-row-label,
.yatra-ai-chat-price-total .yatra-ai-chat-price-row-value {
    color: #0f172a;
    font-size: 0.95rem;
}
.yatra-ai-chat-price-due .yatra-ai-chat-price-row-value {
    color: var(--yatra-primary, #3b82f6);
}

/* Booking auto-create loader (shown between AI reply and confirmation
   message while the POST is in-flight). Uses the same bouncing dots
   as the typing indicator so it feels continuous. */
.yatra-ai-chat-booking-creating {
    align-self: flex-start;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 14px; border-bottom-left-radius: 4px;
    padding: 10px 13px;
    display: flex; gap: 4px; align-items: center;
    color: #475569; font-size: 0.78rem;
}
.yatra-ai-chat-booking-creating-text { color: #475569; }

/* Success bubble after a booking is created — same chat-bubble shape
   as the assistant messages but with a green accent border and a
   prominent "View confirmation" link. */
.yatra-ai-chat-msg-success {
    border-color: #86efac;
    background: #f0fdf4;
    color: #14532d;
}
.yatra-ai-chat-msg-link {
    display: inline-block;
    margin-top: 6px;
    color: var(--yatra-primary, #3b82f6);
    font-weight: 600;
    text-decoration: none;
    font-size: 0.82rem;
}
.yatra-ai-chat-msg-link:hover { text-decoration: underline; }

.yatra-ai-chat-disclaimer {
    padding: 7px 14px 10px;
    background: #fff;
    font-size: 0.68rem;
    color: #94a3b8;
    text-align: center;
    border-top: 1px solid #f1f5f9;
}

@media (max-width: 480px) {
    .yatra-ai-chat-panel {
        right: 0; bottom: 0; left: 0;
        width: 100%; max-width: 100%;
        height: 92vh; max-height: 92vh;
        border-radius: 16px 16px 0 0;
        border-bottom: 0;
    }
}
</style>

<script>
(function () {
    'use strict';

    // Single endpoint — the backend BookingAgent handles tool calls,
    // pricing previews, and the booking POST internally. The frontend
    // is now a thin transport: send message, render reply.
    var WIDGET_ID = '<?php echo esc_js($yatra_chat_widget_id); ?>';
    var REST_URL = '<?php echo esc_js($yatra_chat_rest); ?>';
    var NONCE = '<?php echo esc_js(wp_create_nonce('wp_rest')); ?>';
    var SESSION_KEY = 'yatra_ai_chat_session_<?php echo esc_js($yatra_chat_trip_id); ?>';
    var HISTORY_KEY = 'yatra_ai_chat_history_<?php echo esc_js($yatra_chat_trip_id); ?>';
    var I18N = {
        thinking: '<?php echo esc_js(__('Thinking…', 'yatra')); ?>',
        chatFailed: '<?php echo esc_js(__('Chat failed. Please try again.', 'yatra')); ?>',
        noReply: '<?php echo esc_js(__('No reply received.', 'yatra')); ?>',
        networkError: '<?php echo esc_js(__('Network error. Please try again.', 'yatra')); ?>',
        priceSummaryTitle: '<?php echo esc_js(__('Price summary', 'yatra')); ?>',
        priceSubtotal: '<?php echo esc_js(__('Subtotal', 'yatra')); ?>',
        priceGroupDiscount: '<?php echo esc_js(__('Group discount', 'yatra')); ?>',
        priceCouponDiscount: '<?php echo esc_js(__('Coupon', 'yatra')); ?>',
        priceTaxes: '<?php echo esc_js(__('Taxes', 'yatra')); ?>',
        priceTotal: '<?php echo esc_js(__('Total', 'yatra')); ?>',
        priceDueNow: '<?php echo esc_js(__('Due now', 'yatra')); ?>',
        bookingConfirmed: '<?php echo esc_js(__('Booking confirmed!', 'yatra')); ?>',
        bookingReference: '<?php echo esc_js(__('Reference:', 'yatra')); ?>',
        viewConfirmation: '<?php echo esc_js(__('View confirmation', 'yatra')); ?>'
    };

    // Wait until the DOM is parsed enough to find our nodes. The
    // partial outputs the markup right above this script, but if the
    // page injects extra content via a hook between them we still want
    // to be safe.
    function init() {
        var trigger = document.querySelector('[data-yatra-ai-chat-trigger="' + WIDGET_ID + '"]');
        var panel = document.getElementById(WIDGET_ID);
        if (!trigger || !panel) return;
        if (trigger.getAttribute('data-yatra-ai-chat-init') === '1') return;
        trigger.setAttribute('data-yatra-ai-chat-init', '1');

        var messagesEl = panel.querySelector('[data-yatra-ai-chat-messages]');
        var formEl = panel.querySelector('[data-yatra-ai-chat-form]');
        var textareaEl = panel.querySelector('[data-yatra-ai-chat-textarea]');
        var sendEl = panel.querySelector('[data-yatra-ai-chat-send]');
        var closeEl = panel.querySelector('[data-yatra-ai-chat-close]');
        var suggestionsEl = panel.querySelector('[data-yatra-ai-chat-suggestions]');

        // Defensive — if ANY required node is missing, log + bail
        // instead of throwing a fatal addEventListener error.
        if (!messagesEl || !formEl || !textareaEl || !sendEl || !closeEl) {
            if (window.console) {
                console.warn('Yatra AI chat: required nodes missing', {
                    messagesEl: !!messagesEl, formEl: !!formEl,
                    textareaEl: !!textareaEl, sendEl: !!sendEl, closeEl: !!closeEl
                });
            }
            return;
        }

        var sessionId = '';
        try {
            sessionId = window.localStorage.getItem(SESSION_KEY) || '';
            if (!sessionId) {
                sessionId = 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
                window.localStorage.setItem(SESSION_KEY, sessionId);
            }
        } catch (e) {
            sessionId = 'sess-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);
        }

        var history = [];
        try {
            var raw = window.localStorage.getItem(HISTORY_KEY);
            if (raw) {
                var parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) history = parsed.slice(-12);
            }
        } catch (e) { /* ignore */ }

        // Replay any prior conversation. We hide the suggestions chips
        // once the visitor has interacted at least once, so don't show
        // them on a returning chat. Each turn carries an optional
        // timestamp so re-renders match the original send time;
        // missing timestamps (older history written before timestamps
        // were added) get an empty time label rather than "now".
        if (history.length > 0 && suggestionsEl) {
            suggestionsEl.style.display = 'none';
        }
        history.forEach(function (turn) {
            renderMessage(
                turn.role === 'assistant' ? 'assistant' : 'visitor',
                String(turn.content || ''),
                Number(turn.ts) || 0
            );
        });
        scrollToBottom();

        function openPanel() {
            panel.removeAttribute('hidden');
            trigger.setAttribute('aria-expanded', 'true');
            setTimeout(function () { try { textareaEl.focus(); } catch (e) {} }, 30);
        }
        function closePanel() {
            panel.setAttribute('hidden', '');
            trigger.setAttribute('aria-expanded', 'false');
        }

        trigger.addEventListener('click', function () {
            if (panel.hasAttribute('hidden')) openPanel();
            else closePanel();
        });
        closeEl.addEventListener('click', closePanel);

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !panel.hasAttribute('hidden')) closePanel();
        });

        // Suggestion chip click → send immediately. Cleaner than just
        // filling the textarea since the visitor's intent is obvious.
        if (suggestionsEl) {
            suggestionsEl.addEventListener('click', function (e) {
                var btn = e.target.closest('[data-yatra-ai-chat-suggestion]');
                if (!btn) return;
                var text = (btn.textContent || '').trim();
                if (!text) return;
                suggestionsEl.style.display = 'none';
                sendVisitorMessage(text);
            });
        }

        // Auto-grow textarea up to max-height.
        textareaEl.addEventListener('input', function () {
            textareaEl.style.height = 'auto';
            textareaEl.style.height = Math.min(100, textareaEl.scrollHeight) + 'px';
        });

        textareaEl.addEventListener('keydown', function (e) {
            // Enter → submit, Shift+Enter → newline. We don't use a
            // <form> element (HTML disallows nested forms and this
            // widget lives inside the booking form), so there's no
            // submit event to dispatch — just call the handler.
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submitForm();
            }
        });

        // The "send" button is type="button" — wire a click listener
        // instead of relying on form submission.
        sendEl.addEventListener('click', function (e) {
            e.preventDefault();
            submitForm();
        });

        function submitForm() {
            var message = (textareaEl.value || '').trim();
            if (!message) return;
            if (sendEl.disabled) return;
            textareaEl.value = '';
            textareaEl.style.height = 'auto';
            if (suggestionsEl) suggestionsEl.style.display = 'none';
            sendVisitorMessage(message);
        }

        /**
         * Append a chat bubble with an optional inline timestamp. Pass
         * ts=0 (or omit) for "no timestamp" — useful when replaying
         * pre-timestamp history. Otherwise we format as locale time
         * (HH:MM), so an early-morning vs late-evening conversation
         * is easy to distinguish at a glance without going as
         * granular as seconds.
         */
        function renderMessage(role, content, ts) {
            var div = document.createElement('div');
            div.className = 'yatra-ai-chat-msg yatra-ai-chat-msg-' + (role === 'assistant' ? 'assistant' : 'visitor');

            var textWrap = document.createElement('span');
            textWrap.className = 'yatra-ai-chat-msg-text';
            textWrap.textContent = content;
            div.appendChild(textWrap);

            var when = (typeof ts === 'number' && ts > 0) ? ts : Date.now();
            var timeEl = document.createElement('span');
            timeEl.className = 'yatra-ai-chat-msg-time';
            timeEl.textContent = formatTime(when);
            div.appendChild(timeEl);

            messagesEl.appendChild(div);
        }

        function formatTime(ts) {
            try {
                return new Date(ts).toLocaleTimeString([], {
                    hour: '2-digit', minute: '2-digit'
                });
            } catch (e) {
                var d = new Date(ts);
                var h = d.getHours();
                var m = d.getMinutes();
                return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
            }
        }

        function renderError(text) {
            var div = document.createElement('div');
            div.className = 'yatra-ai-chat-msg yatra-ai-chat-msg-error';

            var textWrap = document.createElement('span');
            textWrap.className = 'yatra-ai-chat-msg-text';
            textWrap.textContent = text;
            div.appendChild(textWrap);

            var timeEl = document.createElement('span');
            timeEl.className = 'yatra-ai-chat-msg-time';
            timeEl.textContent = formatTime(Date.now());
            div.appendChild(timeEl);

            messagesEl.appendChild(div);
        }

        function showTyping() {
            var div = document.createElement('div');
            div.className = 'yatra-ai-chat-typing';
            div.setAttribute('data-yatra-typing', '1');
            div.setAttribute('aria-label', I18N.thinking);
            div.innerHTML =
                '<span class="yatra-ai-chat-typing-dot"></span>' +
                '<span class="yatra-ai-chat-typing-dot"></span>' +
                '<span class="yatra-ai-chat-typing-dot"></span>';
            messagesEl.appendChild(div);
            scrollToBottom();
            return div;
        }

        function scrollToBottom() {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        function persistHistory() {
            try {
                window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-12)));
            } catch (e) { /* ignore */ }
        }

        /* The previous design had a `parseAction()` sentinel parser, a
           booking-summary fetch, and a booking-create POST all in the
           frontend. The agent rewrite moved every one of those to the
           server (BookingAgent + BookingTools); the JS is now a thin
           transport. Anything the visitor used to see as a separate
           bubble (price breakdown, "Booking received! Reference: …")
           is now emitted as part of the assistant's text reply by the
           agent, and rendered through the regular renderMessage path. */
        /**
         * Render the structured pricing breakdown card from a
         * lookup_pricing tool result. Mirrors the rows the regular
         * booking page's pricing-summary.php shows (per-category
         * subtotals → subtotal → discounts → taxes → total → due now).
         * Only rows with non-zero values are rendered so a simple
         * flat-rate trip gets a clean two-row card rather than five
         * "$0.00" rows.
         */
        function renderPricingCard(data) {
            if (!data || typeof data !== 'object') return;
            var card = document.createElement('div');
            card.className = 'yatra-ai-chat-price-card';

            var title = document.createElement('div');
            title.className = 'yatra-ai-chat-price-card-title';
            title.textContent = I18N.priceSummaryTitle;
            card.appendChild(title);

            var rows = document.createElement('div');
            rows.className = 'yatra-ai-chat-price-card-rows';

            // Per-category breakdown ("Adult × 2", "Child × 1")
            if (Array.isArray(data.category_breakdown)) {
                data.category_breakdown.forEach(function (cat) {
                    if (!cat) return;
                    var label = (cat.label || '') + ' × ' + (cat.count || 0);
                    var amount = cat.subtotal_formatted
                        || (typeof cat.subtotal === 'number' ? cat.subtotal.toFixed(2) : '');
                    if (amount) appendPriceRow(rows, label, amount);
                });
            }

            // Subtotal
            if (data.subtotal_formatted || data.subtotal) {
                appendPriceRow(rows, I18N.priceSubtotal, data.subtotal_formatted || data.subtotal);
            }

            // Group discount (only when non-zero)
            if (data.group_discount && data.group_discount.amount && parseFloat(data.group_discount.amount) > 0) {
                appendPriceRow(rows,
                    data.group_discount.label || I18N.priceGroupDiscount,
                    '- ' + (data.group_discount.amount_formatted || data.group_discount.amount),
                    'yatra-ai-chat-price-discount');
            }

            // Coupon
            if (data.coupon_discount && data.coupon_discount.amount && parseFloat(data.coupon_discount.amount) > 0) {
                appendPriceRow(rows,
                    data.coupon_discount.label || I18N.priceCouponDiscount,
                    '- ' + (data.coupon_discount.amount_formatted || data.coupon_discount.amount),
                    'yatra-ai-chat-price-discount');
            }

            // Tax breakdown — one row per tax rate
            if (Array.isArray(data.tax_breakdown)) {
                data.tax_breakdown.forEach(function (tax) {
                    if (!tax) return;
                    appendPriceRow(rows,
                        (tax.label || I18N.priceTaxes) + (tax.rate ? ' (' + tax.rate + '%)' : ''),
                        tax.amount_formatted || tax.amount || '');
                });
            }

            // Total
            if (data.total_amount_formatted || data.total_amount) {
                appendPriceRow(rows, I18N.priceTotal,
                    data.total_amount_formatted || data.total_amount,
                    'yatra-ai-chat-price-total');
            }

            // Due now — only when it differs from total (deposit / partial)
            if (data.amount_due && data.total_amount
                && parseFloat(data.amount_due) !== parseFloat(data.total_amount)) {
                appendPriceRow(rows, I18N.priceDueNow,
                    data.amount_due_formatted || data.amount_due,
                    'yatra-ai-chat-price-due');
            }

            card.appendChild(rows);
            messagesEl.appendChild(card);
        }

        function appendPriceRow(parent, label, value, extraCls) {
            var row = document.createElement('div');
            row.className = 'yatra-ai-chat-price-row' + (extraCls ? ' ' + extraCls : '');
            var l = document.createElement('span');
            l.className = 'yatra-ai-chat-price-row-label';
            l.textContent = String(label);
            var v = document.createElement('span');
            v.className = 'yatra-ai-chat-price-row-value';
            v.textContent = String(value);
            row.appendChild(l);
            row.appendChild(v);
            parent.appendChild(row);
        }

        /**
         * Render the booking-confirmation success bubble. Always
         * includes a real <a> link to the confirmation page rather
         * than relying on the model to write the URL into prose where
         * it wouldn't be clickable. Persists to history so a reload
         * keeps the success visible.
         */
        function renderBookingSuccess(booking) {
            if (!booking || typeof booking !== 'object') return;
            var ref = String(booking.reference || booking.booking_id || '').trim();
            var url = String(booking.confirmation_url || '').trim();
            if (ref === '' && url === '') return; // nothing useful to show

            var now = Date.now();
            var div = document.createElement('div');
            div.className = 'yatra-ai-chat-msg yatra-ai-chat-msg-assistant yatra-ai-chat-msg-success';

            var textWrap = document.createElement('span');
            textWrap.className = 'yatra-ai-chat-msg-text';

            var line1 = document.createElement('div');
            line1.style.fontWeight = '600';
            line1.textContent = I18N.bookingConfirmed;
            textWrap.appendChild(line1);

            if (ref) {
                var line2 = document.createElement('div');
                line2.textContent = I18N.bookingReference + ' ' + ref;
                textWrap.appendChild(line2);
            }
            if (url) {
                var link = document.createElement('a');
                link.href = url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.className = 'yatra-ai-chat-msg-link';
                link.textContent = I18N.viewConfirmation + ' →';
                textWrap.appendChild(link);
            }
            div.appendChild(textWrap);

            var timeEl = document.createElement('span');
            timeEl.className = 'yatra-ai-chat-msg-time';
            timeEl.textContent = formatTime(now);
            div.appendChild(timeEl);

            messagesEl.appendChild(div);

            // Persist a textual summary so a refresh still shows it.
            var summary = I18N.bookingConfirmed
                + (ref ? ' ' + I18N.bookingReference + ' ' + ref : '')
                + (url ? ' (' + url + ')' : '');
            history.push({ role: 'assistant', content: summary, ts: now });
            persistHistory();
        }

        function sendVisitorMessage(message) {
            var now = Date.now();
            renderMessage('visitor', message, now);
            history.push({ role: 'visitor', content: message, ts: now });
            persistHistory();
            scrollToBottom();

            sendEl.disabled = true;
            var typingEl = showTyping();

            fetch(REST_URL, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': NONCE
                },
                body: JSON.stringify({
                    message: message,
                    session_id: sessionId,
                    history: history.slice(-6).map(function (h) {
                        return {
                            role: h.role === 'assistant' ? 'assistant' : 'visitor',
                            content: String(h.content || '').slice(0, 600)
                        };
                    })
                })
            }).then(function (res) {
                return res.json().then(function (body) {
                    return { ok: res.ok, status: res.status, body: body };
                });
            }).then(function (r) {
                if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
                if (!r.ok) {
                    var msg = (r.body && r.body.message) ? r.body.message : I18N.chatFailed;
                    renderError(msg);
                    scrollToBottom();
                    return;
                }
                var reply = (r.body && r.body.reply) ? String(r.body.reply) : '';
                if (!reply) {
                    renderError(I18N.noReply);
                    return;
                }

                // The agent has already done all the work (tool calls,
                // pricing, booking commit) before the response came
                // back. We render three pieces in order:
                //   1. The text reply as a normal chat bubble.
                //   2. (optional) A price-breakdown card, if the agent
                //      called lookup_pricing — same subtotal/discount/
                //      tax/total rows the regular booking page shows,
                //      not whatever the model summarized in prose.
                //   3. (optional) A booking-success bubble with a real
                //      <a> link to the confirmation page, if the agent
                //      called submit_booking and got a booking_id.
                // Both artifacts are extracted server-side from the
                // tool trace and shipped as structured JSON, so we
                // don't have to regex-parse the assistant's prose.
                var assistantNow = Date.now();
                renderMessage('assistant', reply, assistantNow);
                history.push({ role: 'assistant', content: reply, ts: assistantNow });
                persistHistory();

                if (r.body && r.body.pricing) {
                    renderPricingCard(r.body.pricing);
                }
                if (r.body && r.body.booking) {
                    renderBookingSuccess(r.body.booking);
                }
                scrollToBottom();
            }).catch(function () {
                if (typingEl && typingEl.parentNode) typingEl.parentNode.removeChild(typingEl);
                renderError(I18N.networkError);
            }).then(function () {
                sendEl.disabled = false;
                try { textareaEl.focus(); } catch (e) {}
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
</script>
