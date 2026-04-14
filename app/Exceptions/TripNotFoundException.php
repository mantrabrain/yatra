<?php

declare(strict_types=1);

namespace Yatra\Exceptions;

/**
 * Trip Not Found Exception
 * 
 * Thrown when a requested trip cannot be found
 */
class TripNotFoundException extends YatraException
{
    protected string $errorCode = 'trip_not_found';

    public function __construct(int $tripId, ?\Exception $previous = null)
    {
        $message = sprintf('Trip with ID %d not found', $tripId);
        parent::__construct($message, 404, $previous, ['trip_id' => $tripId]);
    }
}
