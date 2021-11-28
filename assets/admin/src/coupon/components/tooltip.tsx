import * as React from 'react';

export default class Tooltip extends React.Component {
    render() {
        return (
            <span className="yatra-tippy-tooltip dashicons dashicons-editor-help"
                  data-tippy-content="Total duration days for this tour"></span>
        );
    }
}
