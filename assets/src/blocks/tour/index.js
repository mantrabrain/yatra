import {registerBlockType} from "@wordpress/blocks";
import {InspectorControls, useBlockProps, ColorPalette} from "@wordpress/block-editor";
import {Panel, PanelBody, RangeControl} from '@wordpress/components';
import {__} from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

const {useSelect} = wp.data;


const Edit = (props) => {
    const {attributes, setAttributes} = props;
    const blockProps = useBlockProps();
    const onChangePostPerPage = (value) => {
        setAttributes({posts_per_page: value});
    };
    return (
        <div {...blockProps}>
            <ServerSideRender
                block="yatra/tour"
                attributes={attributes}
            />
            <InspectorControls key="setting">
                <div id="gutenpride-controls">
                    <Panel>
                        <PanelBody title={__('Tour Settings', 'yatra')} initialOpen={true}>

                            <RangeControl
                                label={__('Number of posts')}
                                value={attributes.posts_per_page}
                                onChange={(value) => onChangePostPerPage(value)}
                                min={1}
                                max={50}
                            />
                        </PanelBody>
                    </Panel>
                </div>
            </InspectorControls>
        </div>
    );
}

registerBlockType('yatra/tour', {
    apiVersion: 2,
    title: __('Tour', 'yatra'),
    description: __('This block is used to show the tour packages of Yatra WordPress plugin.', 'yatra'),
    icon: 'dashicons dashicons-palmtree',
    category: 'yatra',
    edit: Edit,
});
