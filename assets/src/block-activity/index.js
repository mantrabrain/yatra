import {registerBlockType} from "@wordpress/blocks";
import {InspectorControls, useBlockProps} from "@wordpress/block-editor";
import {Panel, PanelBody, RangeControl, ToggleControl, SelectControl} from '@wordpress/components';
import {__} from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
import './editor.scss';

const Edit = (props) => {
    const {attributes, setAttributes} = props;
    const onChangePerPage = (value) => {
        setAttributes({per_page: value});
    };
    const blockProps = useBlockProps();
    return (
        <div {...blockProps}>
            <ServerSideRender
                block="yatra/activity"
                attributes={attributes}
            />
            <InspectorControls key="setting">
                <div id="yatra-activity-controls">
                    <Panel>
                        <PanelBody title={__('Activity Settings', 'yatra')} initialOpen={true}>

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
                            <RangeControl
                                label={__('Per Page')}
                                value={attributes.per_page}
                                onChange={(value) => onChangePerPage(value)}
                                min={-1}
                                max={50}
                            />
                        </PanelBody>
                    </Panel>
                </div>
            </InspectorControls>
        </div>
    );
}

registerBlockType('yatra/activity', {
    apiVersion: 2,
    title: __('Activity', 'yatra'),
    description: __('This block is used to show the activity list of Yatra WordPress plugin.', 'yatra'),
    icon: {
        foreground: '#1abc9c',
        src: "dashicons dashicons-universal-access",
    },
    category: 'yatra',
    edit: Edit,
});
