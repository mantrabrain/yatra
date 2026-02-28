/**
 * WordPress Media Library Hook
 * Provides functionality to open WordPress media library and select/upload images
 */

import { useCallback } from "react";
import { __ } from "../lib/i18n";

declare global {
  interface Window {
    wp?: {
      media: {
        (options?: any): any;
        model?: any;
        view?: any;
        controller?: any;
        frames?: any;
      };
    };
    jQuery?: any;
    yatraWpMedia?: any; // Preserved reference to wp.media
  }
}

interface MediaAttachment {
  id: number;
  url: string;
  alt?: string;
  title?: string;
  caption?: string;
  description?: string;
  sizes?: {
    [key: string]: {
      url: string;
      width: number;
      height: number;
    };
  };
}

interface UseWordPressMediaOptions {
  title?: string;
  buttonText?: string;
  multiple?: boolean;
  library?: {
    type?: string;
  };
}

interface UseWordPressMediaReturn {
  openMediaLibrary: (
    callback: (attachment: MediaAttachment | MediaAttachment[]) => void,
  ) => void;
}

/**
 * Hook to interact with WordPress media library
 */
export const useWordPressMedia = (
  options: UseWordPressMediaOptions = {},
): UseWordPressMediaReturn => {
  const {
    title = "Select or Upload Image",
    buttonText = "Use this image",
    multiple = false,
    library = { type: "image" },
  } = options;

  const openMediaLibrary = useCallback(
    (callback: (attachment: MediaAttachment | MediaAttachment[]) => void) => {
      // Get WordPress media object from global scope
      // Use multiple methods to access wp.media (bypasses window.wp overwrite)
      const getWpMedia = (): any => {
        // Method 1: Use preserved reference (safest, set by inline script before React loads)
        if (typeof (window as any).yatraWpMedia === "function") {
          return (window as any).yatraWpMedia;
        }

        // Method 2: Access wp in global scope using Function constructor (bypasses window.wp overwrite)
        try {
          const wpMedia = new Function(
            'return (typeof wp !== "undefined" && typeof wp.media === "function") ? wp.media : null',
          )();
          if (wpMedia) {
            return wpMedia;
          }
        } catch (e) {
          // Continue to next method
        }

        // Method 3: Try accessing through window.wp if it's an object
        try {
          if (
            typeof (window as any).wp === "object" &&
            (window as any).wp !== null &&
            typeof (window as any).wp.media === "function"
          ) {
            return (window as any).wp.media;
          }
        } catch (e) {
          // Continue to next method
        }

        // Method 4: Use eval to access in global scope (last resort)
        try {
          // eslint-disable-next-line no-eval
          const wpMedia = eval(
            '(typeof wp !== "undefined" && typeof wp.media === "function") ? wp.media : null',
          );
          if (wpMedia) {
            return wpMedia;
          }
        } catch (e) {
          // Ignore
        }

        return null;
      };

      // Wait for media library to be available
      const ensureMediaLibrary = (retries = 50, delay = 100): Promise<any> => {
        return new Promise((resolve, reject) => {
          let attempt = 0;

          const checkMedia = () => {
            attempt++;
            const wpMedia = getWpMedia();

            if (wpMedia && typeof wpMedia === "function") {
              resolve(wpMedia);
              return;
            }

            if (retries > 0) {
              retries--;
              setTimeout(checkMedia, delay);
            } else {
              reject(
                new Error(
                  __(
                    "WordPress media library is not available. Please refresh the page.",
                    "yatra",
                  ),
                ),
              );
            }
          };

          // Start checking after DOM is ready with longer delay for scripts to load
          if (typeof window.jQuery !== "undefined") {
            window.jQuery(document).ready(() => {
              // Give more time for media scripts to initialize
              setTimeout(checkMedia, 500);
            });
          } else if (
            document.readyState === "complete" ||
            document.readyState === "interactive"
          ) {
            setTimeout(checkMedia, 500);
          } else {
            document.addEventListener("DOMContentLoaded", () => {
              setTimeout(checkMedia, 500);
            });
            // Fallback: also start checking after a delay
            setTimeout(checkMedia, 1000);
          }
        });
      };

      // Open media library
      ensureMediaLibrary()
        .then((wpMedia) => {
          // Create media frame
          const frame = wpMedia({
            title,
            button: {
              text: buttonText,
            },
            multiple,
            library,
          });

          if (!frame) {
            throw new Error(__("Failed to create media frame.", "yatra"));
          }

          // Handle selection when user clicks the button
          frame.on("select", () => {
            const selection = frame.state().get("selection");
            const attachments = selection.toJSON();

            if (multiple) {
              const formattedAttachments: MediaAttachment[] = attachments.map(
                (attachment: any) => ({
                  id: attachment.id,
                  url: attachment.url,
                  alt: attachment.alt || "",
                  title: attachment.title || "",
                  caption: attachment.caption || "",
                  description: attachment.description || "",
                  sizes: attachment.sizes || {},
                }),
              );
              callback(formattedAttachments);
            } else {
              const attachment = attachments[0];
              if (attachment) {
                const formattedAttachment: MediaAttachment = {
                  id: attachment.id,
                  url: attachment.url,
                  alt: attachment.alt || "",
                  title: attachment.title || "",
                  caption: attachment.caption || "",
                  description: attachment.description || "",
                  sizes: attachment.sizes || {},
                };
                callback(formattedAttachment);
              }
            }
          });

          // Open the media library popup
          frame.open();
        })
        .catch((error) => {
          console.error("Error opening WordPress media library:", error);
          alert(
            error.message ||
              __(
                "WordPress media library is not available. Please refresh the page.",
                "yatra",
              ),
          );
        });
    },
    [title, buttonText, multiple, library],
  );

  return { openMediaLibrary };
};
