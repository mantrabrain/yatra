<?php

declare(strict_types=1);

namespace Yatra\Exceptions;

/**
 * Database Exception
 * 
 * Thrown when database operations fail
 */
class DatabaseException extends YatraException
{
    protected string $errorCode = 'database_error';

    public function __construct(string $message = 'Database operation failed', string $query = '', ?\Exception $previous = null)
    {
        $context = [];
        if (!empty($query)) {
            $context['query'] = $query;
        }
        
        parent::__construct($message, 500, $previous, $context);
    }

    /**
     * Create from wpdb error
     */
    public static function fromWpdbError(string $query = '', string $error = ''): self
    {
        $message = 'Database query failed';
        if (!empty($error)) {
            $message .= ': ' . $error;
        }
        
        return new self($message, $query);
    }
}
