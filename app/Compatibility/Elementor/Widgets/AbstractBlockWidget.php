<?php

declare(strict_types=1);

namespace Yatra\Compatibility\Elementor\Widgets;

use Yatra\Blocks\AbstractServerBlock;

if (! defined('ABSPATH')) {
    exit;
}

/**
 * Base Elementor widget for a Yatra block. Controls mirror the block's
 * attributes ({@see AbstractServerBlock::controls()}); render() calls the
 * block's own render method, so the widget and the block print the same HTML.
 *
 * Only loaded from {@see \Yatra\Compatibility\Elementor\WidgetManager::registerWidgets()},
 * i.e. when Elementor is active.
 *
 * @package Yatra\Compatibility\Elementor\Widgets
 * @since 3.1.4
 */
abstract class AbstractBlockWidget extends \Elementor\Widget_Base
{
    /**
     * The block this widget renders.
     */
    abstract protected function block(): AbstractServerBlock;

    public function get_name()
    {
        return 'yatra-' . $this->block()->slug();
    }

    public function get_title()
    {
        return $this->block()->title();
    }

    public function get_icon()
    {
        return $this->block()->elementorIcon();
    }

    public function get_categories()
    {
        return ['yatra'];
    }

    public function get_keywords()
    {
        return ['yatra', 'trip', 'tour', 'travel'];
    }

    /**
     * Control schema (same format as {@see AbstractServerBlock::controls()}).
     *
     * @return list<array<string, mixed>>
     */
    protected function controlSchema(): array
    {
        return $this->block()->controls();
    }

    /**
     * Render the block markup for the given block attributes.
     *
     * @param array<string, mixed> $attributes
     */
    protected function renderAttributes(array $attributes): string
    {
        return $this->block()->render($attributes);
    }

    protected function register_controls()
    {
        $schema = $this->controlSchema();

        $this->start_controls_section('yatra_content', [
            'label' => $this->get_title(),
            'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
        ]);

        if (empty($schema)) {
            $this->add_control('yatra_no_settings', [
                'type' => \Elementor\Controls_Manager::RAW_HTML,
                'raw' => esc_html__('This widget has no settings.', 'yatra'),
            ]);
        }

        foreach ($schema as $control) {
            $name = (string) $control['name'];
            $args = [
                'label' => (string) ($control['label'] ?? $name),
            ];
            if (! empty($control['help'])) {
                $args['description'] = (string) $control['help'];
            }

            switch ($control['type'] ?? 'text') {
                case 'number':
                    $args['type'] = \Elementor\Controls_Manager::NUMBER;
                    $args['default'] = (int) ($control['default'] ?? 0);
                    if (isset($control['min'])) {
                        $args['min'] = (int) $control['min'];
                    }
                    if (isset($control['max'])) {
                        $args['max'] = (int) $control['max'];
                    }
                    break;
                case 'toggle':
                    $args['type'] = \Elementor\Controls_Manager::SWITCHER;
                    $args['return_value'] = 'yes';
                    $args['default'] = ! empty($control['default']) ? 'yes' : '';
                    break;
                case 'select':
                    $args['type'] = \Elementor\Controls_Manager::SELECT;
                    $args['options'] = (array) ($control['options'] ?? []);
                    $args['default'] = (string) ($control['default'] ?? '');
                    break;
                case 'multiselect':
                    $args['type'] = \Elementor\Controls_Manager::SELECT2;
                    $args['multiple'] = true;
                    $args['label_block'] = true;
                    $args['options'] = (array) ($control['options'] ?? []);
                    $args['default'] = [];
                    break;
                case 'trip':
                    $args['type'] = \Elementor\Controls_Manager::SELECT2;
                    $args['label_block'] = true;
                    $args['options'] = self::tripOptions();
                    $args['default'] = '0';
                    break;
                default:
                    $args['type'] = \Elementor\Controls_Manager::TEXT;
                    $args['default'] = (string) ($control['default'] ?? '');
                    $args['label_block'] = true;
            }

            $this->add_control($name, $args);
        }

        $this->end_controls_section();
    }

    protected function render()
    {
        $settings = $this->get_settings_for_display();
        $settings = is_array($settings) ? $settings : [];

        // Elementor values → block attribute types (the block sanitizes them again).
        $attributes = [];
        foreach ($this->controlSchema() as $control) {
            $name = (string) $control['name'];
            $value = $settings[$name] ?? ($control['default'] ?? null);
            switch ($control['type'] ?? 'text') {
                case 'number':
                case 'trip':
                    $attributes[$name] = is_numeric($value) ? (int) $value : (int) ($control['default'] ?? 0);
                    break;
                case 'toggle':
                    $attributes[$name] = ($value === 'yes' || $value === true);
                    break;
                case 'multiselect':
                    $attributes[$name] = array_values(array_filter(array_map('absint', (array) $value)));
                    break;
                default:
                    $attributes[$name] = is_scalar($value) ? (string) $value : '';
            }
        }

        // Block render methods escape everything they print.
        echo $this->renderAttributes($attributes); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    }

    /**
     * Published trips for the trip picker (same list as GET yatra/v1/trips/public).
     *
     * @return array<string, string>
     */
    protected static function tripOptions(): array
    {
        static $options = null;
        if ($options !== null) {
            return $options;
        }

        $options = ['0' => __('Current trip (trip pages)', 'yatra')];
        try {
            $trips = (new \Yatra\Services\TripService())->getAll([
                'limit' => 500,
                'offset' => 0,
                'order_by' => 'title',
                'order' => 'ASC',
                'where' => ['status' => ['publish']],
                'include_deleted' => false,
            ]);
            foreach ($trips as $trip) {
                $id = (int) ($trip->id ?? 0);
                if ($id > 0) {
                    $options[(string) $id] = (string) ($trip->title ?? ('#' . $id));
                }
            }
        } catch (\Throwable $e) {
            // Leave only "Current trip".
        }

        return $options;
    }
}
