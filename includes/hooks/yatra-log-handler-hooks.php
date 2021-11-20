<?php

class Yatra_Log_Handler_Hooks
{

    public function __construct()
    {
        add_filter('yatra_register_log_handlers', array($this, 'update_handler'));

    }

    public function update_handler($handlers)
    {
        $handler_class = defined('YATRA_LOG_HANDLER') ? YATRA_LOG_HANDLER : null;

        if (!class_exists($handler_class)) {

            $handler_class = Yatra_Log_Handler_File::class;
        }

        array_push($handlers, new $handler_class());


        return $handlers;
    }
}

new Yatra_Log_Handler_Hooks();