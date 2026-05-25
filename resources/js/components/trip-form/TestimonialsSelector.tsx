import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Star, User, MapPin, Calendar, Loader2 } from "lucide-react";
import { apiService } from "../../lib/api-client";

const __ = (text: string) => {
  return (window as any)?.yatraAdmin?.translations?.[text] || text;
};

interface Review {
  id: number;
  trip_id: number;
  rating: number;
  title: string;
  content: string;
  author_name: string;
  author_location: string | null;
  created_at: string;
  status: "pending" | "approved" | "rejected";
}

interface TestimonialsSelectorProps {
  tripId: number | null;
  selectedReviewIds: number[];
  onChange: (reviewIds: number[]) => void;
}

export const TestimonialsSelector: React.FC<TestimonialsSelectorProps> = ({
  tripId,
  selectedReviewIds,
  onChange,
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tripId) {
      fetchReviews();
    } else {
      setReviews([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const fetchReviews = async () => {
    if (!tripId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await apiService.getReviews({
        trip_id: tripId,
        status: "approved",
        per_page: 100,
      });

      setReviews(data.data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      setError(__("Failed to load reviews. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const toggleReview = (reviewId: number) => {
    const newSelection = selectedReviewIds.includes(reviewId)
      ? selectedReviewIds.filter((id) => id !== reviewId)
      : [...selectedReviewIds, reviewId];
    onChange(newSelection);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  if (!tripId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{__("Testimonials")}</CardTitle>
          <CardDescription>
            {__("Select reviews to display as testimonials")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {__("Save the trip first to select testimonials from reviews")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{__("Testimonials")}</CardTitle>
        <CardDescription>
          {__(
            "Select approved reviews to display as testimonials on the trip page",
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
              {__("Loading reviews...")}
            </span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={fetchReviews}
              className="mt-2"
            >
              {__("Retry")}
            </Button>
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center">
            <User className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {__("No approved reviews yet")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {__(
                "Reviews will appear here once customers submit and they are approved",
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedReviewIds.length > 0
                  ? __(`${selectedReviewIds.length} review(s) selected`)
                  : __("Select reviews to feature as testimonials")}
              </p>
              {selectedReviewIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onChange([])}
                  className="text-xs"
                >
                  {__("Clear all")}
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedReviewIds.includes(review.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  onClick={() => toggleReview(review.id)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedReviewIds.includes(review.id)}
                      onChange={() => toggleReview(review.id)}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {review.author_name}
                            </span>
                            {review.author_location && (
                              <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <MapPin className="w-3 h-3" />
                                {review.author_location}
                              </span>
                            )}
                          </div>
                          {renderStars(review.rating)}
                        </div>
                        <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          <Calendar className="w-3 h-3" />
                          {formatDate(review.created_at)}
                        </span>
                      </div>

                      {review.title && (
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                          {review.title}
                        </h4>
                      )}

                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {review.content}
                      </p>

                      {selectedReviewIds.includes(review.id) && (
                        <Badge variant="info" className="mt-2">
                          {__("Selected as testimonial")}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
