import {registerBlockType} from "@wordpress/blocks";
import {InspectorControls, useBlockProps} from "@wordpress/block-editor";
import {Panel, PanelBody, SelectControl} from '@wordpress/components';
import {__} from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';

const Edit = (props) => {
    const {attributes, setAttributes} = props;
    const blockProps = useBlockProps();
    return (
        <div {...blockProps}>
            <ServerSideRender
                block="yatra/destination"
                attributes={attributes}
            />
            <InspectorControls key="setting">
                <div id="gutenpride-controls">
                    <Panel>
                        <PanelBody title={__('Destination Settings', 'yatra')} initialOpen={true}>

                            <SelectControl
                                label={__('Order', 'yatra')}
                                value={attributes.order}
                                options={[
                                    {label: __('Ascending', 'yatra'), value: 'asc'},
                                    {label: __('Descending', 'yatra'), value: 'desc'},
                                ]}
                                onChange={(order) => setAttributes({order: order})}
                            />
                        </PanelBody>
                    </Panel>
                </div>
            </InspectorControls>
        </div>
    );
}

registerBlockType('yatra/destination', {
    apiVersion: 2,
    title: __('Destination', 'yatra'),
    description: __('This block is used to show the destination list of Yatra WordPress plugin.', 'yatra'),
    icon: {
        foreground: '#1abc9c',
        src: "dashicons dashicons-location",
    },
    category: 'yatra',
    edit: Edit,
});
