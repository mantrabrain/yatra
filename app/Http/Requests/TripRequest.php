<?php

declare(strict_types=1);

namespace Yatra\Http\Requests;

/**
 * Trip Request
 * Validates trip creation/update requests
 */
class TripRequest extends BaseRequest
{
    /**
     * Validation rules
     */
    protected function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:draft,active,inactive',
        ];
    }

    /**
     * Validate the request
     */
    public function validate(): bool
    {
        $rules = $this->rules();

        foreach ($rules as $field => $rule) {
            $ruleParts = explode('|', $rule);

            foreach ($ruleParts as $rulePart) {
                if ($rulePart === 'required' && !isset($this->data[$field])) {
                    $this->errors[$field][] = "The {$field} field is required.";
                }

                if (strpos($rulePart, 'max:') === 0 && isset($this->data[$field])) {
                    $max = (int) str_replace('max:', '', $rulePart);
                    if (strlen($this->data[$field]) > $max) {
                        $this->errors[$field][] = "The {$field} field must not exceed {$max} characters.";
                    }
                }

                if ($rulePart === 'numeric' && isset($this->data[$field]) && !is_numeric($this->data[$field])) {
                    $this->errors[$field][] = "The {$field} field must be numeric.";
                }
            }
        }

        return $this->isValid();
    }
}

