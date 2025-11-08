<?php

declare(strict_types=1);

namespace Yatra\Http\Requests;

/**
 * Base Request Class
 * Handles validation and sanitization
 */
abstract class BaseRequest
{
    /**
     * @var array
     */
    protected array $data;

    /**
     * @var array
     */
    protected array $errors = [];

    /**
     * Constructor
     */
    public function __construct(array $data)
    {
        $this->data = $this->sanitize($data);
    }

    /**
     * Validate the request
     */
    abstract public function validate(): bool;

    /**
     * Get validation rules
     */
    abstract protected function rules(): array;

    /**
     * Sanitize input data
     */
    protected function sanitize(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = sanitize_text_field($value);
            } elseif (is_array($value)) {
                $sanitized[$key] = $this->sanitize($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Get validated data
     */
    public function validated(): array
    {
        return $this->data;
    }

    /**
     * Get errors
     */
    public function errors(): array
    {
        return $this->errors;
    }

    /**
     * Check if request is valid
     */
    public function isValid(): bool
    {
        return empty($this->errors);
    }
}

