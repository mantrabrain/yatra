<?php

namespace Yatra\Core\API;


class TrackerAPI extends RestBase
{
    protected $method = \WP_REST_Server::READABLE;

    protected $rest_route_id = 'track';

    protected $namespace = YATRA_REST_GENERAL_NAMESPACE;

    public function validate(\WP_REST_Request $request)
    {
        return true;
    }

    public function handle(\WP_REST_Request $request)
    {
        return new \WP_REST_Response(['status' => true], 200);
    }

    public static function init()
    {
        return new self;
    }
}
