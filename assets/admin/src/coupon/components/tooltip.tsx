import * as React from 'react';

type TooltipProps = {
    content: TooltipContent
}
type TooltipContent = {
    tooltip: string
}

const Tooltip = (props: TooltipProps) => {

    return (
        <span className="yatra-tippy-tooltip dashicons dashicons-editor-help"
              data-tippy-content={props.content}></span>
    );
};
export default Tooltip
