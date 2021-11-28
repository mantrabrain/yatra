import React, {useEffect} from 'react';
import {Card, CardBody} from '@wordpress/components';
import NumberInput from "./fields/NumberInput";

export const TabContent = (props) => {
    useEffect(() => {
        tippy('.yatra-tippy-tooltip', {
            //content: "Hello World",

            allowHTML: true,
        });
    });
    return (
        <Card size="small">
            <CardBody><h3>{props.tab.content_title}</h3></CardBody>
            <NumberInput settings={props.tab.settings}/>
            <input type="hidden" value={YatraCouponSettings.nonce} name="yatra_coupon_post_type_metabox_nonce"/>
            <input type="hidden" value={props.active} name="yatra_coupon_active_tab"/>
        </Card>

    )
}
