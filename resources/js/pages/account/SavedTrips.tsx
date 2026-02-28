import React from "react";
import { Heart, MapPin as MapPinIcon } from "lucide-react";
import { __ } from "../../lib/i18n";
import { formatPrice } from "./utils";
import { apiClient } from "../../lib/api-client";
import { useToast } from "../../components/ui/toast";

interface SavedTripsProps {
  savedTrips: any[];
  isLoading: boolean;
}

const SavedTrips: React.FC<SavedTripsProps> = ({ savedTrips, isLoading }) => {
  const { showToast } = useToast();

  const handleRemoveTrip = async (tripId: number) => {
    try {
      await apiClient.delete(`/saved-trips/${tripId}`);
      // Refetch saved trips
      window.location.reload();
    } catch (error) {
      console.error("Error removing trip:", error);
      showToast(__("Failed to remove trip from wishlist.", "yatra"), "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {__("Saved Trips", "yatra")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {__("Your wishlist of favorite trips", "yatra")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div
          className="yatra-trip-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div key={i} className="yatra-trip-card">
              <div
                className="yatra-trip-image"
                style={{ backgroundColor: "#f3f4f6", minHeight: "200px" }}
              >
                <div className="animate-pulse bg-gray-200 dark:bg-gray-700 w-full h-full"></div>
              </div>
              <div className="yatra-trip-content p-4">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : savedTrips.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {__("No saved trips yet", "yatra")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {__(
              "Start exploring and save your favorite trips to your wishlist!",
              "yatra",
            )}
          </p>
          <a
            href="/trip/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MapPinIcon className="w-4 h-4" />
            {__("Browse Trips", "yatra")}
          </a>
        </div>
      ) : (
        <div
          className="yatra-trip-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {savedTrips.map((trip: any) => {
            const tripUrl =
              trip.permalink || `/trip/${trip.trip_slug || trip.trip_id}`;
            const imageUrl =
              trip.trip_image ||
              `${window.yatraAdmin?.siteUrl || ""}/wp-content/plugins/yatra/assets/images/trip-placeholder.svg`;
            const hasDiscount =
              trip.discount_percent && trip.discount_percent > 0;
            const displayPrice =
              trip.price !== undefined && trip.price !== null
                ? trip.price
                : trip.sale_price !== undefined &&
                    trip.sale_price !== null &&
                    trip.sale_price > 0
                  ? trip.sale_price
                  : trip.original_price !== undefined &&
                      trip.original_price !== null &&
                      trip.original_price > 0
                    ? trip.original_price
                    : 0;
            const originalPrice = trip.original_price;
            const avgRating =
              trip.rating !== undefined && trip.rating !== null
                ? trip.rating
                : trip.average_rating !== undefined &&
                    trip.average_rating !== null
                  ? trip.average_rating
                  : 0;
            const reviewCount =
              trip.reviews !== undefined && trip.reviews !== null
                ? trip.reviews
                : trip.review_count || trip.reviews_count || 0;

            return (
              <div
                key={trip.id || trip.trip_id}
                className="yatra-trip-card"
                data-price={displayPrice}
                data-rating={avgRating}
                data-duration={trip.duration_days || 0}
              >
                <div className="yatra-trip-image">
                  <img src={imageUrl} alt={trip.trip_title} />
                  {hasDiscount && (
                    <div className="yatra-discount-badge">
                      {trip.discount_percent}% {__("OFF", "yatra")}
                    </div>
                  )}
                  <button
                    className="yatra-favorite-btn saved is-saved"
                    title={__("Remove from favorites", "yatra")}
                    onClick={() => handleRemoveTrip(trip.trip_id)}
                    style={{ color: "#ef4444" }}
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="currentColor"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>

                <div className="yatra-trip-content">
                  <div className="yatra-trip-meta">
                    {trip.location && (
                      <>
                        <span className="yatra-trip-location">
                          {trip.location}
                        </span>
                        <span className="yatra-trip-separator">•</span>
                      </>
                    )}
                    <span className="yatra-trip-duration">
                      {trip.duration || __("Flexible", "yatra")}
                    </span>
                    {trip.difficulty && (
                      <>
                        <span className="yatra-trip-separator">•</span>
                        <span className="yatra-trip-difficulty">
                          {trip.difficulty}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="yatra-trip-title">{trip.trip_title}</h3>

                  {trip.highlights && trip.highlights.length > 0 && (
                    <div className="yatra-trip-highlights">
                      {trip.highlights.map((highlight: any, idx: number) => {
                        const highlightText =
                          typeof highlight === "string"
                            ? highlight
                            : highlight.text || highlight;
                        const highlightLink =
                          typeof highlight === "object" && highlight.link
                            ? highlight.link
                            : null;

                        if (highlightLink) {
                          return (
                            <a
                              key={idx}
                              href={highlightLink}
                              className="yatra-highlight-badge yatra-highlight-link"
                            >
                              {highlightText}
                            </a>
                          );
                        }
                        return (
                          <span key={idx} className="yatra-highlight-badge">
                            {highlightText}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="yatra-trip-rating">
                    <div className="yatra-rating-stars">
                      <svg
                        width="16"
                        height="16"
                        fill="#fbbf24"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                      <span className="yatra-rating-value">
                        {avgRating > 0 ? avgRating.toFixed(1) : "0.0"}
                      </span>
                    </div>
                    {reviewCount > 0 && (
                      <span className="yatra-reviews-count">
                        ({reviewCount} {__("reviews", "yatra")})
                      </span>
                    )}
                  </div>

                  <div className="yatra-trip-footer">
                    <div className="yatra-trip-price">
                      {hasDiscount &&
                        originalPrice &&
                        originalPrice > displayPrice &&
                        !trip.is_traveler_based && (
                          <div className="yatra-original-price">
                            {formatPrice(originalPrice)}
                          </div>
                        )}
                      <div className="yatra-current-price">
                        {trip.is_traveler_based ? (
                          <>
                            <span
                              className="yatra-starting-from"
                              style={{
                                fontSize: "0.75rem",
                                fontWeight: "normal",
                              }}
                            >
                              {__("Starting from", "yatra")}{" "}
                            </span>
                            {formatPrice(displayPrice)}
                          </>
                        ) : (
                          formatPrice(displayPrice)
                        )}
                      </div>
                      <div className="yatra-price-note">
                        {__("Per person", "yatra")}
                      </div>
                    </div>
                    <a href={tripUrl} className="yatra-card-view-btn">
                      {__("View Details", "yatra")}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavedTrips;
