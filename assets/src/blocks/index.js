import {registerBlockType} from "@wordpress/blocks";
import {InspectorControls, useBlockProps} from "@wordpress/block-editor";
import {TextControl} from '@wordpress/components';

let attributes = {
    content: {
        type: 'string',
        required: true,
        default: 'Inside of block'
    },
}

const Edit = ({attributes, setAttributes}) => {
    return (
        <div {...useBlockProps()}>
            <InspectorControls>
                Settings
            </InspectorControls>
            <TextControl
                value={attributes.content}
                onChange={(val) => setAttributes({content: val})}
            />
        </div>
    )
}

registerBlockType('yatra/tour', {
    title: 'Tour',
    apiVersion: 2,
    description: 'This block is used to show the tour packages of Yatra WordPress plugin.',
    category: 'yatra',
    icon: 'dashicons dashicons-palmtree',
    supports: {
        html: false,
    },
    attributes,
    edit: Edit,
    save: ({attributes}) => {
        return (
            <div
                {...useBlockProps.save()}
            >
                {attributes.content}
            </div>
        );
    }
});