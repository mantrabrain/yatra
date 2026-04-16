(function ($) {
  "use strict";

  function dismissNotice($notice) {
    var id = $notice.data("yatra-notice-id");
    if (!id) return;

    $.ajax({
      url: (window.yatraWpNotices && window.yatraWpNotices.ajaxUrl) || window.ajaxurl,
      method: "POST",
      data: {
        action: "yatra_dismiss_notice",
        nonce: window.yatraWpNotices && window.yatraWpNotices.nonce,
        notice_id: id,
      },
    });
  }

  $(document).on("click", ".yatra-notice.is-dismissible .notice-dismiss", function () {
    var $notice = $(this).closest(".yatra-notice");
    dismissNotice($notice);
  });

  // "Maybe later" (or any explicit dismiss link) should also dismiss.
  $(document).on("click", "[data-yatra-notice-dismiss]", function (e) {
    e.preventDefault();
    var $notice = $(this).closest(".yatra-notice");
    dismissNotice($notice);
    $notice.fadeOut(200, function () {
      $(this).remove();
    });
  });
})(jQuery);

