import React from "react";
import { Eye, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { Modal } from "../ui/modal";
import { __ } from "../../lib/i18n";

export type EmailPreviewModalProps = {
  open: boolean;
  onClose: () => void;
  subject: string;
  body: string;
};

/**
 * Email preview: subject + HTML body in an iframe.
 * Uses the shared Yatra modal shell: {@link Modal} from `components/ui/modal` (`yatra-model-ui`).
 */
export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  open,
  onClose,
  subject,
  body,
}) => (
  <Modal
    isOpen={open}
    onClose={onClose}
    title={
      <span className="flex items-center gap-3">
        <span
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30"
          aria-hidden
        >
          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </span>
        <span>{__("Email Preview", "yatra")}</span>
      </span>
    }
    description={__("Preview with sample data", "yatra")}
    maxWidthClassName="max-w-6xl w-[95vw]"
    panelClassName="yatra-model-ui flex flex-col max-h-[90vh]"
    bodyClassName="flex flex-1 min-h-0 flex-col px-0 py-0"
    bodyScrollClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
    footer={
      <div className="flex w-full justify-end">
        <Button variant="outline" onClick={onClose} type="button">
          {__("Close", "yatra")}
        </Button>
      </div>
    }
  >
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900">
        <div className="mb-1 flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-400" aria-hidden />
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {__("Subject", "yatra")}
          </span>
        </div>
        <p className="text-base font-medium text-gray-900 dark:text-white">
          {subject}
        </p>
      </div>

      <div className="min-h-0 flex-1 bg-gray-100 px-6 py-4 dark:bg-gray-950">
        <div className="flex h-full min-h-[min(500px,50vh)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <iframe
            srcDoc={body}
            className="min-h-[min(500px,50vh)] w-full flex-1 border-0"
            title={__("Email Preview", "yatra")}
            sandbox="allow-same-origin"
          />
        </div>
      </div>
    </div>
  </Modal>
);

export default EmailPreviewModal;
