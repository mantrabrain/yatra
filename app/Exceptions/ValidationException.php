<?php

declare(strict_types=1);

namespace Yatra\Exceptions;

/**
 * Validation Exception
 * 
 * Thrown when input validation fails
 */
class ValidationException extends YatraException
{
    protected string $errorCode = 'validation_error';

    /**
     * @var array Validation errors by field
     */
    protected array $errors = [];

    public function __construct(string $message = 'Validation failed', array $errors = [], int $code = 400, ?\Exception $previous = null)
    {
        $this->errors = $errors;
        parent::__construct($message, $code, $previous, ['validation_errors' => $errors]);
    }

    /**
     * Get validation errors
     */
    public function getErrors(): array
    {
        return $this->errors;
    }

    /**
     * Add validation error for a field
     */
    public function addError(string $field, string $message): self
    {
        $this->errors[$field][] = $message;
        $this->context['validation_errors'] = $this->errors;
        return $this;
    }

    /**
     * Check if field has errors
     */
    public function hasError(string $field): bool
    {
        return isset($this->errors[$field]) && !empty($this->errors[$field]);
    }

    /**
     * Get errors for specific field
     */
    public function getFieldErrors(string $field): array
    {
        return $this->errors[$field] ?? [];
    }
}
