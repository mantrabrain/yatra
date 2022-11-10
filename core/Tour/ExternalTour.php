<?php

namespace Yatra\Core\Tour;

use Yatra\Core\Abstracts\TourParent;

class ExternalTour extends TourParent
{
    public function __construct($tour = 0)
    {
        parent::__construct($tour);
    }

    public function get_external_url()
    {
        return $this->get_prop('external_url');

    }

    public function get_book_now_text()
    {
        return $this->get_prop('book_now_text');
    }


}