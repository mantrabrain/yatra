<?php

declare(strict_types=1);

namespace Yatra\Exceptions;

use Exception;

/**
 * Base Yatra Exception
 * 
 * Provides structured error handling with error codes and context
 */
class YatraException extends Exception
{
    /**
     * @var array Additional context data
     */
    protected array $context = [];

    /**
     * @var string Error code for API responses
     */
    protected string $errorCode = 'yatra_error';

    public function __construct(string $message = '', int $code = 0, ?Exception $previous = null, array $context = [])
    {
        parent::__construct($message, $code, $previous);
        $this->context = $context;
    }

    /**
     * Get error context
     */
    public function getContext(): array
    {
        return $this->context;
    }

    /**
     * Get API error code
     */
    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    /**
     * Set error context
     */
    public function setContext(array $context): self
    {
        $this->context = $context;
        return $this;
    }

    /**
     * Add context data
     */
    public function addContext(string $key, mixed $value): self
    {
        $this->context[$key] = $value;
        return $this;
    }

    /**
     * Convert to array for API responses
     */
    public function toArray(): array
    {
        return [
            'error_code' => $this->getErrorCode(),
            'message' => $this->getMessage(),
            'context' => $this->getContext(),
            'file' => $this->getFile(),
            'line' => $this->getLine(),
        ];
    }
}
