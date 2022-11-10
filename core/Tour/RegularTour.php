<?php

namespace Yatra\Core\Tour;

use Yatra\Core\Abstracts\TourParent;

class RegularTour extends TourParent
{
    public function __construct($tour = 0)
    {
        parent::__construct($tour);
    }


}