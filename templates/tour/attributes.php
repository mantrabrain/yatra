<tr>
    <th><?php echo esc_html($term->name) ?></th>
    <td><?php

        foreach ($content as $content_key => $content_value) {

            $type = isset($field_option[$content_key]['type']) ? $field_option[$content_key]['type'] : '';

            $value = '';

            if (count($field_option) > 0) {

                switch ($type) {
                    case "textarea":
                    case "text":
                        $value = esc_html($content_value);
                        break;

                    case "number":
                        $value = absint($content_value);
                        break;
                    case "shortcode":
                        $value = do_shortcode($content_value);
                        break;


                }

                echo '<p>' . ($value) . '</p>';
            }
        }
        ?></td>
</tr>