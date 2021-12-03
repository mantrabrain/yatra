import {registerBlockType} from "@wordpress/blocks";
import {InspectorControls, useBlockProps, ColorPalette} from "@wordpress/block-editor";
import {TextControl, RangeControl} from '@wordpress/components';
import {__} from '@wordpress/i18n';
import {TourTemplate} from "./components/template.js";


let attributes = {
    content: {
        type: 'string',
        required: true,
        default: 'Inside of block',
        text_color: {type: 'string', default: '#ffffff'},
        bg_color: {type: 'string', default: '#000000'},
        per_page: {type: 'number', default: 10}

    },
}

const Edit = ({attributes, setAttributes}) => {

    const onChangeBGColor = (hexColor) => {
        setAttributes({bg_color: hexColor});
    };

    const onChangeTextColor = (hexColor) => {
        setAttributes({text_color: hexColor});
    };
    const onChangePostPerPage = (perPage) => {
        setAttributes({per_page: perPage});

    }
    return (
        <div {...useBlockProps()}>
            <InspectorControls>
                <div id="gutenpride-controls">
                    <fieldset>
                        <legend className="block-base-control__label">
                            {__('Posts Per Page', 'yatra')}
                        </legend>
                        <RangeControl
                            label="Columns"
                            value={attributes.per_page}
                            onChange={(value) => onChangePostPerPage(value)}
                            min={2}
                            max={10}/>
                    </fieldset>
                    <fieldset>
                        <legend className="blocks-base-control__label">
                            {__('Background color', 'gutenpride')}
                        </legend>
                        <ColorPalette // Element Tag for Gutenberg standard colour selector
                            onChange={onChangeBGColor} // onChange event callback
                        />
                    </fieldset>
                    <fieldset>
                        <legend className="blocks-base-control__label">
                            {__('Text color', 'gutenpride')}
                        </legend>
                        <ColorPalette // Element Tag for Gutenberg standard colour selector
                            onChange={onChangeTextColor} // onChange event callback
                        />
                    </fieldset>
                </div>
            </InspectorControls>
            <TourTemplate/>
        </div>
    )
}
registerBlockType('yatra/tour', {
    title: 'Tour',
    apiVersion: 2,
    description: __('This block is used to show the tour packages of Yatra WordPress plugin.', 'yatra'),
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
                {...useBlockProps.save()}>
                <TourTemplate/>
            </div>
        );
    }
});