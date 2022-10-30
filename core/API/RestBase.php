<?php

namespace Yatra\Core\API;

abstract class RestBase
{
    protected $rest_route_id = '';

    protected $namespace = YATRA_REST_WEBHOOKS_NAMESPACE;


    protected $method = \WP_REST_Server::READABLE;


    public function __construct()
    {
        add_action('rest_api_init', array($this, 'register_routes'));
    }

    public function register_routes()
    {
         register_rest_route($this->namespace, $this->rest_route_id, array(
            'methods' => $this->method,
            'permission_callback' => array($this, 'validate'),
            'callback' => array($this, 'handle')
        ));
    }

    abstract public function validate(\WP_REST_Request $request);

    abstract public function handle(\WP_REST_Request $request);

    abstract public static function init();

}

