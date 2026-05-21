/**
 * Media Upload Component
 * Handles image and video uploads for itinerary entries
 */

import React from "react";
import { Upload, X, Video, Plus } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { __, sprintf } from "../../lib/i18n";
import { prepareWordPressMediaFrameOpen } from "../../lib/wp-media-open";
import { MediaItem } from "../trip-form/types";

interface MediaUploadProps {
  items: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  maxItems?: number;
  acceptTypes?: "images" | "videos" | "both";
  title?: string;
  description?: string;
  className?: string;
}

export const MediaUpload: React.FC<MediaUploadProps> = ({
  items = [],
  onChange,
  maxItems = 10,
  acceptTypes = "both",
  title = __("Media Gallery", "yatra"),
  description = __("Add images and videos to showcase this activity", "yatra"),
  className = "",
}) => {
  const getMediaType = (acceptTypes: string): string => {
    switch (acceptTypes) {
      case "images":
        return "image";
      case "videos":
        return "video";
      default:
        return "image,video";
    }
  };

  const getMediaTitle = (acceptTypes: string): string => {
    switch (acceptTypes) {
      case "images":
        return __("Photo Gallery", "yatra");
      case "videos":
        return __("Video Gallery", "yatra");
      default:
        return title;
    }
  };

  const getMediaDescription = (acceptTypes: string): string => {
    switch (acceptTypes) {
      case "images":
        return __("Upload images to showcase this activity", "yatra");
      case "videos":
        return __("Add videos to showcase this activity", "yatra");
      default:
        return description;
    }
  };

  const handleMediaAdd = () => {
    if (items.length >= maxItems) {
      alert(
        sprintf(
          // translators: %d: maximum number of media items allowed.
          __("Maximum %d media items allowed", "yatra"),
          Number(maxItems) || 0,
        ),
      );
      return;
    }

    // Use WordPress media library
    if (window.wp && window.wp.media) {
      const mediaUploader = window.wp.media({
        title: __("Select Media", "yatra"),
        button: { text: __("Add Media", "yatra") },
        multiple: true, // Allow multiple selection
        library: { type: getMediaType(acceptTypes) },
      });

      mediaUploader.on("select", () => {
        const selection = mediaUploader.state().get("selection");
        const newItems: MediaItem[] = [];

        selection.each((attachment: any) => {
          const mediaType = attachment.get("type");

          const mediaItem: MediaItem = {
            id: attachment.get("id").toString(),
            attachment_id: attachment.get("id"),
            url: attachment.get("url"),
            type: mediaType as "image" | "video",
            alt_text: attachment.get("alt") || "",
            caption: attachment.get("caption") || "",
          };

          if (mediaType === "image") {
            const sizes = attachment.get("sizes");
            mediaItem.thumbnail_url =
              sizes?.medium?.url ||
              sizes?.thumbnail?.url ||
              attachment.get("url");
          }

          newItems.push(mediaItem);
        });

        if (newItems.length > 0) {
          onChange([...items, ...newItems]);
        }
      });

      prepareWordPressMediaFrameOpen();
      mediaUploader.open();
    } else {
      // Fallback for non-WordPress environments
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;
      input.accept =
        acceptTypes === "videos"
          ? "video/*"
          : acceptTypes === "images"
            ? "image/*"
            : "image/*,video/*";

      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        const newItems: MediaItem[] = files
          .slice(0, maxItems - items.length)
          .map((file, index) => ({
            id: `temp_${Date.now()}_${index}`,
            attachment_id: 0, // Temporary files don't have attachment IDs
            url: URL.createObjectURL(file),
            type: file.type.startsWith("video/") ? "video" : "image",
            alt_text: file.name,
            caption: file.name,
          }));

        onChange([...items, ...newItems]);
      };

      input.click();
    }
  };

  const handleMediaRemove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const isImage = (item: MediaItem) => item.type === "image";

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getMediaTitle(acceptTypes)}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {getMediaDescription(acceptTypes)}
              </p>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {items.length}/{maxItems}
            </span>
          </div>

          {items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item, index) => (
                <div key={item.id} className="relative group">
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                    {isImage(item) ? (
                      <img
                        src={item.thumbnail_url || item.url}
                        alt={
                          item.alt_text ||
                          // translators: %d: media item sequence number (1-based).
                          sprintf(__("Media %d", "yatra"), index + 1)
                        }
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Image load error:", e, "Item:", item); // Debug log
                          // Fallback to placeholder or broken image icon
                          (e.target as HTMLImageElement).style.display = "none";
                          const parent = (e.target as HTMLImageElement)
                            .parentElement;
                          if (parent) {
                            parent.innerHTML =
                              '<div class="flex items-center justify-center w-full h-full"><div class="text-gray-400 text-center"><div class="text-4xl mb-2">🖼️</div><div class="text-sm">' +
                              __("Image not available", "yatra") +
                              "</div></div></div>";
                          }
                        }}
                        onLoad={() => {
                          // Image loaded successfully
                        }}
                      />
                    ) : (
                      <div className="relative w-full h-full">
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                          <Video className="w-12 h-12 text-white" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Delete Button */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMediaRemove(index)}
                      className="h-8 w-8 p-0 bg-red-500 hover:bg-red-600 text-white"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Caption */}
                  {item.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                      <p className="text-xs text-white truncate">
                        {item.caption}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add Media Button */}
          {items.length < maxItems && (
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleMediaAdd}
                variant="outline"
                className="w-full md:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                {acceptTypes === "videos"
                  ? __("Add Video", "yatra")
                  : acceptTypes === "images"
                    ? __("Add Image", "yatra")
                    : __("Add Media", "yatra")}
              </Button>
            </div>
          )}

          {items.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {__(
                  "No media items yet. Click 'Add Media' to get started.",
                  "yatra",
                )}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
