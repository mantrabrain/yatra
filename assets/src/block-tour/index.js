import {registerBlockType} from "@wordpress/blocks";
import {InspectorControls, useBlockProps} from "@wordpress/block-editor";
import {Panel, PanelBody, RangeControl, ToggleControl, SelectControl} from '@wordpress/components';
import {__} from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

const Edit = (props) => {
    const {attributes, setAttributes} = props;
    const blockProps = useBlockProps();
    const onChangePostPerPage = (value) => {
        setAttributes({posts_per_page: value});
    };
    const onFeatureToggleChange = (value) => {
        setAttributes({featured: value});
    };
    return (
        <div {...blockProps}>
            <ServerSideRender
                block="yatra/tour"
                attributes={attributes}
            />
            <InspectorControls key="setting">
                <div id="yatra-tour-controls">
                    <Panel>
                        <PanelBody title={__('Tour Settings', 'yatra')} initialOpen={true}>

                            <RangeControl
                                label={__('Number of posts')}
                                value={attributes.posts_per_page}
                                onChange={(value) => onChangePostPerPage(value)}
                                min={1}
                                max={50}
                            />
                            <ToggleControl
                                label={__('Show Feature Tour Only', 'yatra')}
                                checked={attributes.featured}
                                onChange={(value) => {
                                    onFeatureToggleChange(value);
                                }}
                            />
                            <SelectControl
                                label={__('Order', 'yatra')}
                                value={attributes.order}
                                options={[
                                    {label: __('Ascending', 'yatra'), value: 'asc'},
                                    {label: __('Descending', 'yatra'), value: 'desc'},
                                ]}
                                onChange={(order) => setAttributes({order: order})}
                            />
                            <SelectControl
                                label={__('Columns', 'yatra')}
                                value={attributes.columns}
                                options={[
                                    {label: __('Two (2)', 'yatra'), value: 2},
                                    {label: __('Three (3)', 'yatra'), value: 3},
                                    {label: __('Four (4)', 'yatra'), value: 4},
                                ]}
                                onChange={(columns) => setAttributes({columns: columns})}
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
    icon: {
        foreground: '#1abc9c',
        src: "dashicons dashicons-palmtree",
    },
    category: 'yatra',
    edit: Edit,
});
